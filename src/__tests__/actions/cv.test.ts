import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('pdf-parse', () => ({
  PDFParse: vi.fn().mockImplementation(() => ({
    getText: vi.fn().mockResolvedValue({ text: 'CV text here' }),
  })),
}))
vi.mock('mammoth', () => ({ extractRawText: vi.fn().mockResolvedValue({ value: 'DOCX text here' }) }))

import { createClient } from '@/lib/supabase/server'
import { getCV, getCVs, setDefaultCV, deleteCV, uploadCV } from '@/actions/cv'

const mockAuth = { getUser: vi.fn() }
let mockFrom: ReturnType<typeof vi.fn>
let mockStorage: ReturnType<typeof vi.fn>

// Returns an eq stub that chains: .eq().eq() resolves to `val`
function chainableEq(resolveVal: unknown) {
  const self: ReturnType<typeof vi.fn> = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue(resolveVal),
    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    order: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [] }),
    }),
  })
  return self
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })

  // Default select chain: select → eq → { order → order → limit → maybeSingle }
  const maybeSingle = vi.fn().mockResolvedValue({ data: null })
  const limitChain = vi.fn().mockReturnValue({ maybeSingle })
  const orderFinal = vi.fn().mockReturnValue({ limit: limitChain })
  const orderFirst = vi.fn().mockReturnValue({ order: orderFinal })
  const eqChain = vi.fn().mockReturnValue({ order: orderFirst, maybeSingle })
  const selectChain = vi.fn().mockReturnValue({ eq: eqChain, order: orderFirst })

  // update chain: update → eq → eq → resolves
  const updateEqEq = vi.fn().mockResolvedValue({ error: null })
  const updateEq = vi.fn().mockReturnValue({ eq: updateEqEq })
  const updateChain = vi.fn().mockReturnValue({ eq: updateEq })

  // delete chain: delete → eq → eq → resolves
  const deleteEqEq = vi.fn().mockResolvedValue({})
  const deleteEq = vi.fn().mockReturnValue({ eq: deleteEqEq })
  const deleteChain = vi.fn().mockReturnValue({ eq: deleteEq })

  const insertChain = vi.fn().mockResolvedValue({ error: null })

  mockFrom = vi.fn().mockReturnValue({
    select: selectChain,
    update: updateChain,
    delete: deleteChain,
    insert: insertChain,
  })

  mockStorage = vi.fn().mockReturnValue({
    upload: vi.fn().mockResolvedValue({ error: null }),
    remove: vi.fn().mockResolvedValue({}),
  })

  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    auth: mockAuth,
    from: mockFrom,
    storage: { from: mockStorage },
  })
})

describe('getCV', () => {
  it('returns null when no CV exists', async () => {
    const result = await getCV()
    expect(result).toBeNull()
    expect(mockFrom).toHaveBeenCalledWith('cvs')
  })

  it('returns the CV when one exists', async () => {
    const cv = { id: 'cv-1', filename: 'resume.pdf', is_default: true, user_id: 'user-123', storage_path: 'user-123/uuid.pdf', extracted_text: null, word_count: null, created_at: '2024-01-01' }
    const maybeSingle = vi.fn().mockResolvedValue({ data: cv })
    const limit = vi.fn().mockReturnValue({ maybeSingle })
    const order2 = vi.fn().mockReturnValue({ limit })
    const order1 = vi.fn().mockReturnValue({ order: order2 })
    const eq = vi.fn().mockReturnValue({ order: order1 })
    const select = vi.fn().mockReturnValue({ eq })
    mockFrom.mockReturnValue({ select })

    const result = await getCV()
    expect(result).toEqual(cv)
  })
})

describe('getCVs', () => {
  it('returns empty array when no CVs exist', async () => {
    const order2 = vi.fn().mockResolvedValue({ data: [] })
    const order1 = vi.fn().mockReturnValue({ order: order2 })
    const eq = vi.fn().mockReturnValue({ order: order1 })
    const select = vi.fn().mockReturnValue({ eq })
    mockFrom.mockReturnValue({ select })

    const result = await getCVs()
    expect(result).toEqual([])
    expect(mockFrom).toHaveBeenCalledWith('cvs')
  })

  it('returns CVs ordered default first', async () => {
    const cvs = [
      { id: 'cv-1', filename: 'a.pdf', is_default: true },
      { id: 'cv-2', filename: 'b.pdf', is_default: false },
    ]
    const order2 = vi.fn().mockResolvedValue({ data: cvs })
    const order1 = vi.fn().mockReturnValue({ order: order2 })
    const eq = vi.fn().mockReturnValue({ order: order1 })
    const select = vi.fn().mockReturnValue({ eq })
    mockFrom.mockReturnValue({ select })

    const result = await getCVs()
    expect(result).toEqual(cvs)
  })
})

describe('setDefaultCV', () => {
  it('returns empty object on success', async () => {
    const result = await setDefaultCV('cv-1')
    expect(result).toEqual({})
  })

  it('returns error on failure', async () => {
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      const eqEq = callCount === 1
        ? vi.fn().mockResolvedValue({})
        : vi.fn().mockResolvedValue({ error: { message: 'DB error' } })
      return { update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: eqEq }) }) }
    })

    const result = await setDefaultCV('cv-1')
    expect(result).toEqual({ error: 'DB error' })
  })
})

describe('deleteCV', () => {
  it('does nothing if CV not found', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null })
    const eq2 = vi.fn().mockReturnValue({ maybeSingle })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const select = vi.fn().mockReturnValue({ eq: eq1 })
    mockFrom.mockReturnValue({ select })

    await deleteCV('nonexistent-id')
  })

  it('deletes CV without error when CV exists', async () => {
    const cv = { storage_path: 'user-123/uuid.pdf', is_default: false }
    const maybeSingle = vi.fn().mockResolvedValue({ data: cv })
    const selectEq2 = vi.fn().mockReturnValue({ maybeSingle })
    const selectEq1 = vi.fn().mockReturnValue({ eq: selectEq2 })
    const select = vi.fn().mockReturnValue({ eq: selectEq1 })

    const deleteEq2 = vi.fn().mockResolvedValue({})
    const deleteEq1 = vi.fn().mockReturnValue({ eq: deleteEq2 })
    const del = vi.fn().mockReturnValue({ eq: deleteEq1 })

    mockFrom.mockReturnValue({ select, delete: del })
    mockStorage.mockReturnValue({ remove: vi.fn().mockResolvedValue({}) })

    await deleteCV('cv-1')
  })
})

describe('uploadCV', () => {
  it('returns error when no file provided', async () => {
    const result = await uploadCV(new FormData())
    expect(result).toEqual({ error: 'No file provided' })
  })

  it('returns error for unsupported file type', async () => {
    const fd = new FormData()
    fd.append('cv', new File(['x'], 'resume.txt', { type: 'text/plain' }))
    const result = await uploadCV(fd)
    expect(result).toEqual({ error: 'Only PDF and DOCX are supported' })
  })

  it('returns empty object on successful PDF upload', async () => {
    mockStorage.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      remove: vi.fn().mockResolvedValue({}),
    })
    // count query → 0 existing CVs; insert → success
    let call = 0
    mockFrom.mockImplementation(() => {
      call++
      if (call === 1) {
        const eq = vi.fn().mockResolvedValue({ count: 0 })
        const select = vi.fn().mockReturnValue({ eq })
        return { select }
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) }
    })

    const fd = new FormData()
    fd.append('cv', new File(['pdf bytes'], 'resume.pdf', { type: 'application/pdf' }))
    const result = await uploadCV(fd)
    expect(result).toEqual({})
  })

  it('returns empty object on successful DOCX upload', async () => {
    mockStorage.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      remove: vi.fn().mockResolvedValue({}),
    })
    let call = 0
    mockFrom.mockImplementation(() => {
      call++
      if (call === 1) {
        const eq = vi.fn().mockResolvedValue({ count: 1 })
        const select = vi.fn().mockReturnValue({ eq })
        return { select }
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) }
    })

    const fd = new FormData()
    fd.append('cv', new File(['docx bytes'], 'cv.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))
    const result = await uploadCV(fd)
    expect(result).toEqual({})
  })

  it('returns error when storage upload fails', async () => {
    mockStorage.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: { message: 'Storage quota exceeded' } }),
    })

    const fd = new FormData()
    fd.append('cv', new File(['x'], 'resume.pdf', { type: 'application/pdf' }))
    const result = await uploadCV(fd)
    expect(result).toEqual({ error: 'Storage quota exceeded' })
  })

  it('removes from storage and returns error when DB insert fails', async () => {
    const removeFn = vi.fn().mockResolvedValue({})
    mockStorage.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      remove: removeFn,
    })
    let call = 0
    mockFrom.mockImplementation(() => {
      call++
      if (call === 1) {
        const eq = vi.fn().mockResolvedValue({ count: 0 })
        const select = vi.fn().mockReturnValue({ eq })
        return { select }
      }
      return { insert: vi.fn().mockResolvedValue({ error: { message: 'insert failed' } }) }
    })

    const fd = new FormData()
    fd.append('cv', new File(['x'], 'resume.pdf', { type: 'application/pdf' }))
    const result = await uploadCV(fd)
    expect(result).toEqual({ error: 'insert failed' })
    expect(removeFn).toHaveBeenCalledOnce()
  })
})
