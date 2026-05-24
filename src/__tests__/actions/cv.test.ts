import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('pdf-parse', () => ({ default: vi.fn().mockResolvedValue({ text: 'CV text here', numpages: 2 }) }))
vi.mock('mammoth', () => ({ extractRawText: vi.fn().mockResolvedValue({ value: 'DOCX text here' }) }))

import { createClient } from '@/lib/supabase/server'
import { getCV } from '@/actions/cv'

const mockAuth  = { getUser: vi.fn() }
const mockFrom  = vi.fn()
const mockSelect = vi.fn()
const mockEq     = vi.fn()
const mockMaybeSingle = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    auth: mockAuth,
    from: mockFrom,
    storage: { from: vi.fn() },
  })
  mockFrom.mockReturnValue({ select: mockSelect })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })
  mockMaybeSingle.mockResolvedValue({ data: null, error: null })
})

describe('getCV', () => {
  it('returns null when no CV exists', async () => {
    const result = await getCV()
    expect(result).toBeNull()
    expect(mockFrom).toHaveBeenCalledWith('cvs')
  })
})
