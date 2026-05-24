import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/actions/settings', () => ({ getSettings: vi.fn() }))
vi.mock('@/actions/cv', () => ({ getCV: vi.fn() }))
vi.mock('@/lib/ai', () => ({
  generateDocument: vi.fn().mockResolvedValue('# Cover Letter\n\nDear Hiring Manager'),
  scoreMatch: vi.fn().mockResolvedValue(82),
}))

import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/actions/settings'
import { getCV } from '@/actions/cv'
import { listDocuments } from '@/actions/documents'

const mockAuth  = { getUser: vi.fn() }
const mockFrom  = vi.fn()
const mockSelect = vi.fn()
const mockEq     = vi.fn()
const mockOrder  = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    auth: mockAuth,
    from: mockFrom,
    storage: { from: vi.fn().mockReturnValue({ upload: vi.fn().mockResolvedValue({ error: null }) }) },
  })
  mockFrom.mockReturnValue({ select: mockSelect })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ order: mockOrder })
  mockOrder.mockResolvedValue({ data: [], error: null });
  (getSettings as ReturnType<typeof vi.fn>).mockResolvedValue({ ai_provider: 'ollama', ai_model: '' });
  (getCV as ReturnType<typeof vi.fn>).mockResolvedValue({ extracted_text: 'CV text' })
})

describe('listDocuments', () => {
  it('returns empty array when no documents', async () => {
    const result = await listDocuments('app-123')
    expect(result).toEqual([])
    expect(mockFrom).toHaveBeenCalledWith('documents')
  })
})
