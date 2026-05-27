import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/actions/settings', () => ({ getSettings: vi.fn() }))
vi.mock('@/actions/cv', () => ({ getCV: vi.fn() }))
vi.mock('@/lib/ai', () => ({
  generateDocument: vi.fn(),
  scoreMatch: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/actions/settings'
import { getCV } from '@/actions/cv'
import { generateDocument as aiGenerateDocument, scoreMatch } from '@/lib/ai'
import { revalidatePath } from 'next/cache'
import {
  listDocuments,
  generateDocumentForApplication,
  scoreApplication,
  deleteDocument,
} from '@/actions/documents'

const mockAuth = { getUser: vi.fn() }
let mockFrom: ReturnType<typeof vi.fn>
let mockStorageUpload: ReturnType<typeof vi.fn>
let mockStorageRemove: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
  mockStorageUpload = vi.fn().mockResolvedValue({ error: null })
  mockStorageRemove = vi.fn().mockResolvedValue({})
  mockFrom = vi.fn()
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    auth: mockAuth,
    from: mockFrom,
    storage: {
      from: vi.fn().mockReturnValue({ upload: mockStorageUpload, remove: mockStorageRemove }),
    },
  })
  ;(getSettings as ReturnType<typeof vi.fn>).mockResolvedValue({ ai_provider: 'ollama', ai_model: '' })
  ;(getCV as ReturnType<typeof vi.fn>).mockResolvedValue({ extracted_text: 'My CV text' })
  ;(aiGenerateDocument as ReturnType<typeof vi.fn>).mockResolvedValue('# Cover Letter')
  ;(scoreMatch as ReturnType<typeof vi.fn>).mockResolvedValue(85)
})

describe('listDocuments', () => {
  it('returns empty array when no documents', async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockFrom.mockReturnValue({ select })

    const result = await listDocuments('app-123')
    expect(result).toEqual([])
    expect(mockFrom).toHaveBeenCalledWith('documents')
  })

  it('returns documents when present', async () => {
    const docs = [{ id: 'doc-1', application_id: 'app-123', type: 'cover_letter' }]
    const order = vi.fn().mockResolvedValue({ data: docs, error: null })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockFrom.mockReturnValue({ select })

    const result = await listDocuments('app-123')
    expect(result).toEqual(docs)
  })
})

describe('generateDocumentForApplication', () => {
  function setupInsertChain(result: { data: object | null; error: object | null }) {
    const single = vi.fn().mockResolvedValue(result)
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    mockFrom.mockReturnValue({ insert })
  }

  it('returns error when CV is missing', async () => {
    ;(getCV as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const result = await generateDocumentForApplication('app-1', 'job desc', 'cover_letter')
    expect(result).toEqual({ error: 'No CV found. Upload your CV first.' })
  })

  it('returns error when CV has no extracted text', async () => {
    ;(getCV as ReturnType<typeof vi.fn>).mockResolvedValue({ extracted_text: null })
    const result = await generateDocumentForApplication('app-1', 'job desc', 'cover_letter')
    expect(result).toEqual({ error: 'No CV found. Upload your CV first.' })
  })

  it('returns error when AI generation returns null', async () => {
    ;(aiGenerateDocument as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const result = await generateDocumentForApplication('app-1', 'job desc', 'cover_letter')
    expect(result).toEqual({ error: 'AI document generation failed or returned empty content.' })
  })

  it('returns error when storage upload fails', async () => {
    setupInsertChain({ data: { id: 'doc-new' }, error: null })
    mockStorageUpload.mockResolvedValue({ error: { message: 'Bucket full' } })
    const result = await generateDocumentForApplication('app-1', 'job desc', 'cover_letter')
    expect(result).toEqual({ error: 'Bucket full' })
  })

  it('removes storage file and returns error when DB insert fails', async () => {
    setupInsertChain({ data: null, error: { message: 'Unique constraint' } })
    const result = await generateDocumentForApplication('app-1', 'job desc', 'cover_letter')
    expect(result).toEqual({ error: 'Unique constraint' })
    expect(mockStorageRemove).toHaveBeenCalled()
  })

  it('returns document id and revalidates on success', async () => {
    setupInsertChain({ data: { id: 'doc-new' }, error: null })
    const result = await generateDocumentForApplication('app-1', 'job desc', 'cover_letter')
    expect(result).toEqual({ id: 'doc-new' })
    expect(revalidatePath).toHaveBeenCalledWith('/app/applications/app-1')
  })
})

describe('scoreApplication', () => {
  function setupUpdateChain(result: { error: object | null }) {
    const eq = vi.fn().mockResolvedValue(result)
    const update = vi.fn().mockReturnValue({ eq })
    mockFrom.mockReturnValue({ update })
  }

  it('returns error when CV is missing', async () => {
    ;(getCV as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const result = await scoreApplication('app-1', 'job desc')
    expect(result).toEqual({ error: 'No CV found. Upload your CV first.' })
  })

  it('returns error when scoreMatch returns null', async () => {
    ;(scoreMatch as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const result = await scoreApplication('app-1', 'job desc')
    expect(result).toEqual({ error: 'AI scoring failed. Check your AI provider settings.' })
  })

  it('returns error when DB update fails', async () => {
    setupUpdateChain({ error: { message: 'Connection error' } })
    const result = await scoreApplication('app-1', 'job desc')
    expect(result).toEqual({ error: 'Connection error' })
  })

  it('returns score and revalidates on success', async () => {
    setupUpdateChain({ error: null })
    const result = await scoreApplication('app-1', 'job desc')
    expect(result).toEqual({ score: 85 })
    expect(revalidatePath).toHaveBeenCalledWith('/app/applications/app-1')
    expect(revalidatePath).toHaveBeenCalledWith('/app/applications')
    expect(revalidatePath).toHaveBeenCalledWith('/app/dashboard')
  })
})

describe('deleteDocument', () => {
  it('removes storage file then deletes DB row', async () => {
    const single = vi.fn().mockResolvedValue({ data: { storage_path: 'user/app/file.md' } })
    const selectEq = vi.fn().mockReturnValue({ single })
    const selectFn = vi.fn().mockReturnValue({ eq: selectEq })
    const deleteEq = vi.fn().mockResolvedValue({})
    const deleteFn = vi.fn().mockReturnValue({ eq: deleteEq })
    mockFrom.mockReturnValueOnce({ select: selectFn }).mockReturnValueOnce({ delete: deleteFn })

    await deleteDocument('doc-1', 'app-1')
    expect(mockStorageRemove).toHaveBeenCalledWith(['user/app/file.md'])
    expect(deleteEq).toHaveBeenCalledWith('id', 'doc-1')
  })

  it('skips storage removal when storage_path is absent', async () => {
    const single = vi.fn().mockResolvedValue({ data: null })
    const selectEq = vi.fn().mockReturnValue({ single })
    const selectFn = vi.fn().mockReturnValue({ eq: selectEq })
    const deleteEq = vi.fn().mockResolvedValue({})
    const deleteFn = vi.fn().mockReturnValue({ eq: deleteEq })
    mockFrom.mockReturnValueOnce({ select: selectFn }).mockReturnValueOnce({ delete: deleteFn })

    await deleteDocument('doc-1', 'app-1')
    expect(mockStorageRemove).not.toHaveBeenCalled()
  })

  it('revalidates the application path after deletion', async () => {
    const single = vi.fn().mockResolvedValue({ data: { storage_path: 'p' } })
    const selectEq = vi.fn().mockReturnValue({ single })
    const selectFn = vi.fn().mockReturnValue({ eq: selectEq })
    const deleteEq = vi.fn().mockResolvedValue({})
    const deleteFn = vi.fn().mockReturnValue({ eq: deleteEq })
    mockFrom.mockReturnValueOnce({ select: selectFn }).mockReturnValueOnce({ delete: deleteFn })

    await deleteDocument('doc-1', 'app-1')
    expect(revalidatePath).toHaveBeenCalledWith('/app/applications/app-1')
  })
})
