import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/ai', () => ({
  extractJobTitles: vi.fn().mockResolvedValue(['software engineer']),
  batchMatchScore: vi.fn().mockResolvedValue([{ index: 0, score: 82 }]),
}))
vi.mock('@/lib/crypto', () => ({
  decrypt: (v: string) => `decrypted-${v}`,
  encrypt: (v: string) => `encrypted-${v}`,
}))

import { findJobs, type ScanEvent } from '@/lib/findJobs'
import type { UserSettings } from '@/lib/types'

const settings: UserSettings = {
  user_id: 'u1',
  ai_provider: 'ollama',
  ai_base_url: 'http://127.0.0.1:1234/v1',
  ai_model: 'llama3',
  claude_api_key_enc: '',
  openai_api_key_enc: '',
  jsearch_api_key_enc: 'enc-key',
  find_jobs_candidates: 5,
  find_jobs_save_count: 2,
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
  jsearch_num_pages: '1',
  cron_enabled: false,
  cron_hour_utc: 8,
}

vi.mock('@/lib/jobSearch', () => ({
  searchJobs: vi.fn().mockResolvedValue([{
    job_id: 'j1',
    employer_name: 'ACME',
    job_title: 'Engineer',
    job_apply_link: 'https://example.com/apply',
    job_description: 'Build things',
    job_city: 'Paris',
    job_country: 'FR',
    job_is_remote: false,
    job_employment_type: 'FULLTIME',
    job_posted_at_datetime_utc: '2026-05-24T10:00:00Z',
    job_publisher: 'LinkedIn',
  }]),
}))

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        not: vi.fn().mockResolvedValue({ data: [] }),
      }),
    }),
    insert: vi.fn().mockResolvedValue({ error: null }),
  }),
}

beforeEach(() => {
  vi.clearAllMocks()
  // Re-apply mocks after clearAllMocks
  mockSupabase.from.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        not: vi.fn().mockResolvedValue({ data: [] }),
      }),
    }),
    insert: vi.fn().mockResolvedValue({ error: null }),
  })
})

describe('findJobs – extended match events', () => {
  it('emits a query event with the search query text', async () => {
    const events: ScanEvent[] = []
    await findJobs(mockSupabase as never, 'u1', settings, 'my cv text', e => events.push(e))
    const queryEvt = events.find(e => e.type === 'query')
    expect(queryEvt).toBeDefined()
    expect((queryEvt as Extract<ScanEvent, { type: 'query' }>).text).toBeTruthy()
  })

  it('emits match event with url, posted_at, and publisher', async () => {
    const events: ScanEvent[] = []
    await findJobs(mockSupabase as never, 'u1', settings, 'my cv text', e => events.push(e))
    const matchEvt = events.find(e => e.type === 'match') as Extract<ScanEvent, { type: 'match' }> | undefined
    expect(matchEvt).toBeDefined()
    expect(matchEvt!.url).toBe('https://example.com/apply')
    expect(matchEvt!.posted_at).toBe('2026-05-24')
    expect(matchEvt!.publisher).toBe('LinkedIn')
  })
})
