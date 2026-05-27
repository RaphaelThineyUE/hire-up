import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/actions/settings', () => ({ updateSettings: vi.fn().mockResolvedValue(undefined) }))
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }))

import { SettingsForm } from '@/components/app/SettingsForm'
import { updateSettings } from '@/actions/settings'
import { useRouter } from 'next/navigation'

const mockPush = vi.fn()

const baseSettings = {
  user_id: 'u1',
  ai_provider: 'ollama' as const,
  ai_base_url: 'http://127.0.0.1:1234/v1',
  ai_model: 'llama3',
  claude_api_key_enc: '',
  openai_api_key_enc: '',
  jsearch_api_key_enc: '',
  find_jobs_candidates: 25,
  find_jobs_save_count: 10,
  jsearch_query_override: '',
  jsearch_country: '',
  jsearch_language: '',
  jsearch_location: '',
  jsearch_date_posted: '',
  jsearch_work_from_home: false,
  jsearch_employment_types: '',
  jsearch_job_requirements: '',
  jsearch_radius: '',
  jsearch_exclude_publishers: '',
  jsearch_num_pages: '2',
  cron_enabled: false,
  cron_hour_utc: 8,
  claude_api_key_masked: '••••1234',
  openai_api_key_masked: '',
  jsearch_api_key_masked: '',
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush })
})

describe('SettingsForm', () => {
  it('renders all three AI provider radio buttons', () => {
    render(<SettingsForm settings={baseSettings} />)
    expect(screen.getByRole('radio', { name: /ollama/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /claude/i })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /openai/i })).not.toBeChecked()
  })

  it('shows Base URL field when ollama is selected', () => {
    render(<SettingsForm settings={baseSettings} />)
    expect(screen.getByPlaceholderText(/127\.0\.0\.1/)).toBeInTheDocument()
  })

  it('shows Claude API key field when claude provider is set', () => {
    render(<SettingsForm settings={{ ...baseSettings, ai_provider: 'claude' }} />)
    expect(screen.getByPlaceholderText(/sk-ant/)).toBeInTheDocument()
  })

  it('shows OpenAI API key field when openai provider is set', () => {
    render(<SettingsForm settings={{ ...baseSettings, ai_provider: 'openai' }} />)
    expect(screen.getByPlaceholderText(/sk-…/)).toBeInTheDocument()
  })

  it('switches to Claude key field when claude radio is clicked', () => {
    render(<SettingsForm settings={baseSettings} />)
    fireEvent.click(screen.getByRole('radio', { name: /claude/i }))
    expect(screen.getByPlaceholderText(/sk-ant/)).toBeInTheDocument()
  })

  it('renders Save settings submit button', () => {
    render(<SettingsForm settings={baseSettings} />)
    expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument()
  })

  it('renders candidate pool and cron enabled fields', () => {
    render(<SettingsForm settings={baseSettings} />)
    expect(screen.getByDisplayValue('25')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('navigates to scan page when Run now is clicked', () => {
    render(<SettingsForm settings={baseSettings} />)
    fireEvent.click(screen.getByRole('button', { name: /run now/i }))
    expect(mockPush).toHaveBeenCalledWith('/app/applications?scan=1')
  })

  it('calls updateSettings and shows Saved on successful submit', async () => {
    render(<SettingsForm settings={baseSettings} />)
    const form = screen.getByRole('button', { name: /save settings/i }).closest('form')!
    await act(async () => { fireEvent.submit(form) })
    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument())
    expect(updateSettings).toHaveBeenCalled()
  })
})
