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

// Mock crypto so decrypt() returns a predictable value
vi.mock('@/lib/crypto', () => ({
  decrypt: (v: string) => `decrypted-${v}`,
  encrypt: (v: string) => `encrypted-${v}`,
}))

import { scoreMatch, generateDocument, extractJobTitles, batchMatchScore } from '@/lib/ai'
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

  it('returns empty string when AI call throws', async () => {
    openaiCreate.mockRejectedValue(new Error('network error'))
    const result = await generateDocument('cv text', 'job desc', 'tailored_cv', ollamaSettings)
    expect(result).toBe('')
  })
})

describe('extractJobTitles', () => {
  it('returns parsed titles from AI response', async () => {
    openaiCreate.mockResolvedValue({
      choices: [{ message: { content: '{"titles": ["Software Engineer", "Backend Developer", "Full Stack Engineer"]}' } }],
    })
    const titles = await extractJobTitles('my cv text', ollamaSettings)
    expect(titles).toEqual(['Software Engineer', 'Backend Developer', 'Full Stack Engineer'])
  })

  it('returns empty array when AI call throws', async () => {
    openaiCreate.mockRejectedValue(new Error('connection refused'))
    const titles = await extractJobTitles('cv', ollamaSettings)
    expect(titles).toEqual([])
  })
})

describe('batchMatchScore', () => {
  it('returns scores array from AI response', async () => {
    openaiCreate.mockResolvedValue({
      choices: [{ message: { content: '[{"index": 0, "score": 85}, {"index": 1, "score": 62}]' } }],
    })
    const jobs = [
      { index: 0, title: 'Engineer', company: 'Acme', descriptionSnippet: 'build stuff' },
      { index: 1, title: 'Designer', company: 'Beta', descriptionSnippet: 'draw stuff' },
    ]
    const results = await batchMatchScore('my cv text', jobs, ollamaSettings)
    expect(results).toEqual([
      { index: 0, score: 85 },
      { index: 1, score: 62 },
    ])
  })
})

describe('scoreMatch (claude path)', () => {
  it('returns score from Anthropic response', async () => {
    anthropicCreate.mockResolvedValue({
      content: [{ text: '{"score": 91}' }],
    })
    const claudeSettings: UserSettings = {
      ...ollamaSettings,
      ai_provider: 'claude',
      claude_api_key_enc: 'somekey',
    }
    const score = await scoreMatch('my cv text', 'job description', claudeSettings)
    expect(score).toBe(91)
  })
})
