import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/lib/crypto', () => ({
  encrypt: vi.fn((v: string) => `enc:${v}`),
  decrypt: vi.fn((v: string) => v.replace('enc:', '')),
  mask:    vi.fn((v: string) => v.slice(0, 4) + '****'),
}))

import { createClient } from '@/lib/supabase/server'
import { getSettings, updateSettings } from '@/actions/settings'

const mockAuth = { getUser: vi.fn() }
const mockFrom  = vi.fn()
const mockSelect = vi.fn()
const mockEq     = vi.fn()
const mockSingle = vi.fn()
const mockUpsert = vi.fn()

const defaultSettings = {
  user_id: 'user-123',
  ai_provider: 'ollama',
  ai_base_url: 'http://127.0.0.1:1234/v1',
  ai_model: '',
  claude_api_key_enc: '',
  openai_api_key_enc: '',
  jsearch_api_key_enc: '',
  find_jobs_candidates: 25,
  find_jobs_save_count: 10,
  jsearch_query_override: '',
  jsearch_country: 'us',
  jsearch_language: '',
  jsearch_location: '',
  jsearch_date_posted: 'month',
  jsearch_work_from_home: false,
  jsearch_employment_types: '',
  jsearch_job_requirements: '',
  jsearch_radius: '',
  jsearch_exclude_publishers: '',
  jsearch_num_pages: '2',
  cron_enabled: false,
  cron_hour_utc: 8,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    auth: mockAuth,
    from: mockFrom,
  })
  mockFrom.mockReturnValue({ select: mockSelect, upsert: mockUpsert })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ single: mockSingle })
  mockSingle.mockResolvedValue({ data: defaultSettings, error: null })
  mockUpsert.mockResolvedValue({ error: null })
})

describe('getSettings', () => {
  it('returns settings for authenticated user', async () => {
    const s = await getSettings()
    expect(s.ai_provider).toBe('ollama')
    expect(mockFrom).toHaveBeenCalledWith('user_settings')
  })
})

describe('updateSettings', () => {
  it('upserts with user_id', async () => {
    await updateSettings({ ai_provider: 'claude', ai_model: 'claude-sonnet-4-6' })
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-123', ai_provider: 'claude' })
    )
  })
})
