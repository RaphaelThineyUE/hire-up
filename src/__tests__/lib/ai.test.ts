import { describe, it, expect, vi, beforeEach } from 'vitest'

// Shared mock function for OpenAI completions
const openaiCreate = vi.fn()

// Mock OpenAI SDK
vi.mock('openai', () => {
  return {
    default: function OpenAI() {
      return { chat: { completions: { create: openaiCreate } } }
    },
  }
})

// Shared mock function for Anthropic messages
const anthropicCreate = vi.fn()

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: function Anthropic() {
      return { messages: { create: anthropicCreate } }
    },
  }
})

import { scoreMatch, generateDocument } from '@/lib/ai'
import type { UserSettings } from '@/lib/types'

const ollamaSettings: UserSettings = {
  user_id: 'u1',
  ai_provider: 'ollama',
  ai_base_url: 'http://127.0.0.1:1234/v1',
  ai_model: 'llama3',
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
})

describe('scoreMatch', () => {
  it('returns integer score from JSON response (ollama/openai path)', async () => {
    openaiCreate.mockResolvedValue({
      choices: [{ message: { content: '{"score": 78}' } }],
    })
    const score = await scoreMatch('my cv text', 'job description', ollamaSettings)
    expect(score).toBe(78)
  })

  it('returns null if AI call throws', async () => {
    openaiCreate.mockRejectedValue(new Error('connection refused'))
    const score = await scoreMatch('cv', 'job', ollamaSettings)
    expect(score).toBeNull()
  })
})

describe('generateDocument', () => {
  it('returns markdown string from AI response', async () => {
    openaiCreate.mockResolvedValue({
      choices: [{ message: { content: '# Cover Letter\n\nDear Hiring Manager…' } }],
    })
    const result = await generateDocument('cv text', 'job desc', 'cover_letter', ollamaSettings)
    expect(result).toContain('Cover Letter')
  })
})
