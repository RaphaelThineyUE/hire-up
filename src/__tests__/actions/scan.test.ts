import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/ai', () => ({ whyMatched: vi.fn().mockResolvedValue(['Stack overlap', 'Remote role']) }))
vi.mock('@/actions/settings', () => ({
  getSettings: vi.fn().mockResolvedValue({
    user_id: 'u1', ai_provider: 'ollama', ai_base_url: '', ai_model: '',
    claude_api_key_enc: '', openai_api_key_enc: '', jsearch_api_key_enc: '',
    find_jobs_candidates: 25, find_jobs_save_count: 10,
    jsearch_query_override: '', jsearch_country: 'us', jsearch_language: '',
    jsearch_location: '', jsearch_date_posted: 'month', jsearch_work_from_home: false,
    jsearch_employment_types: '', jsearch_job_requirements: '', jsearch_radius: '',
    jsearch_exclude_publishers: '', jsearch_num_pages: '2', cron_enabled: false, cron_hour_utc: 8,
    claude_api_key_masked: '', openai_api_key_masked: '', jsearch_api_key_masked: '',
  }),
}))

import { createClient } from '@/lib/supabase/server'
import { listFoundApplications, bulkApplyByScore, explainMatch } from '@/actions/scan'

const mockAuth = { getUser: vi.fn() }
const mockFrom = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ auth: mockAuth, from: mockFrom })
})

describe('listFoundApplications', () => {
  it('queries applications filtered by user_id and status=found ordered by score desc', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: [{ id: 'a1', status: 'found' }] })
    const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = await listFoundApplications()

    expect(mockFrom).toHaveBeenCalledWith('applications')
    expect(mockEq1).toHaveBeenCalledWith('user_id', 'user-123')
    expect(mockEq2).toHaveBeenCalledWith('status', 'found')
    expect(result).toEqual([{ id: 'a1', status: 'found' }])
  })
})

describe('bulkApplyByScore', () => {
  it('updates found applications with score >= minScore to applied', async () => {
    const mockGte = vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [{ id: 'a1' }, { id: 'a2' }], error: null }) })
    const mockEqStatus = vi.fn().mockReturnValue({ gte: mockGte })
    const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqStatus })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUser })
    mockFrom.mockReturnValue({ update: mockUpdate })

    const result = await bulkApplyByScore(85)

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'applied' })
    expect(mockGte).toHaveBeenCalledWith('match_score_value', 85)
    expect(result).toEqual({ count: 2 })
  })
})

describe('explainMatch', () => {
  it('returns whyMatched bullets for an application', async () => {
    // First from('applications') call → job_description
    // Second from('cvs') call → extracted_text
    const mockSingleApp = vi.fn().mockResolvedValue({ data: { job_description: 'Build things at scale' } })
    const mockSingleCv = vi.fn().mockResolvedValue({ data: { extracted_text: 'Senior engineer 8 years' } })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingleApp }) }) }) }
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ maybeSingle: mockSingleCv }) }) }) }) }) }
    })

    const result = await explainMatch('app-abc')
    expect(result).toEqual(['Stack overlap', 'Remote role'])
  })

  it('returns empty array when application has no job_description', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { job_description: null } })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) }) }),
    })
    const result = await explainMatch('app-abc')
    expect(result).toEqual([])
  })

  it('returns empty array when cv has no extracted_text', async () => {
    const mockSingleApp = vi.fn().mockResolvedValue({ data: { job_description: 'Build things at scale' } })
    const mockSingleCv = vi.fn().mockResolvedValue({ data: null })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingleApp }) }) }) }
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ maybeSingle: mockSingleCv }) }) }) }) }) }
    })

    const result = await explainMatch('app-abc')
    expect(result).toEqual([])
  })
})

import { listContacts } from '@/actions/scan'

describe('listContacts', () => {
  it('queries contacts filtered by application_id and user_id ordered by created_at', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: [{ id: 'c1', name: 'Jane' }] })
    const mockEqUser = vi.fn().mockReturnValue({ order: mockOrder })
    const mockEqApp = vi.fn().mockReturnValue({ eq: mockEqUser })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqApp })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = await listContacts('app-abc')

    expect(mockFrom).toHaveBeenCalledWith('contacts')
    expect(mockEqApp).toHaveBeenCalledWith('application_id', 'app-abc')
    expect(mockEqUser).toHaveBeenCalledWith('user_id', 'user-123')
    expect(result).toEqual([{ id: 'c1', name: 'Jane' }])
  })
})
