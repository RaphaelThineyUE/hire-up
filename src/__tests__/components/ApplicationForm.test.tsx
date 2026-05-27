import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/actions/applications', () => ({
  createApplication: vi.fn().mockResolvedValue(undefined),
  updateApplication: vi.fn().mockResolvedValue(undefined),
}))

import { ApplicationForm } from '@/components/app/ApplicationForm'
import { createApplication, updateApplication } from '@/actions/applications'
import type { Application } from '@/lib/types'

const mockApp: Application = {
  id: 'app-1',
  user_id: 'u1',
  company: 'Stripe',
  role: 'Software Engineer',
  url: 'https://stripe.com/jobs/1',
  job_description: 'Build payments.',
  match_score_value: 90,
  match_score: 'high',
  status: 'applied',
  notes: 'Great company',
  salary_range: '$150k',
  location: 'Remote',
  remote_type: 'remote',
  contract_type: 'full-time',
  applied_at: '2026-01-01T00:00:00Z',
  posted_at: '2025-12-31',
  created_at: '2026-01-01T00:00:00Z',
}

beforeEach(() => vi.clearAllMocks())

describe('ApplicationForm — create mode', () => {
  it('renders Add application submit button', () => {
    render(<ApplicationForm mode="create" />)
    expect(screen.getByRole('button', { name: /add application/i })).toBeInTheDocument()
  })

  it('renders Company and Role label text', () => {
    render(<ApplicationForm mode="create" />)
    expect(screen.getByText('Company')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
  })

  it('renders status select defaulting to Applied', () => {
    render(<ApplicationForm mode="create" />)
    expect(screen.getByDisplayValue('Applied')).toBeInTheDocument()
  })

  it('calls createApplication on form submit', async () => {
    render(<ApplicationForm mode="create" />)
    const form = document.querySelector('form')!
    await act(async () => { fireEvent.submit(form) })
    await waitFor(() => expect(createApplication).toHaveBeenCalled())
  })
})

describe('ApplicationForm — edit mode', () => {
  it('renders Save changes submit button', () => {
    render(<ApplicationForm mode="edit" initial={mockApp} />)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('pre-fills company and role fields from initial prop', () => {
    render(<ApplicationForm mode="edit" initial={mockApp} />)
    expect(screen.getByDisplayValue('Stripe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Software Engineer')).toBeInTheDocument()
  })

  it('calls updateApplication with the application id on submit', async () => {
    const onDone = vi.fn()
    render(<ApplicationForm mode="edit" initial={mockApp} onDone={onDone} />)
    const form = document.querySelector('form')!
    await act(async () => { fireEvent.submit(form) })
    await waitFor(() =>
      expect(updateApplication).toHaveBeenCalledWith('app-1', expect.any(Object)),
    )
  })
})

describe('ApplicationForm — shared', () => {
  it('calls onDone when Cancel is clicked', () => {
    const onDone = vi.fn()
    render(<ApplicationForm mode="create" onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onDone).toHaveBeenCalled()
  })
})
