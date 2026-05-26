import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/actions/scan', () => ({
  explainMatch: vi.fn().mockResolvedValue(['Stack matches', 'Remote role']),
  listContacts: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/actions/applications', () => ({
  updateApplication: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

import { ScanJobFlyout } from '@/components/app/ScanJobFlyout'
import type { Application } from '@/lib/types'

const app: Application = {
  id: 'app-1',
  user_id: 'u1',
  company: 'Stripe',
  role: 'Senior Software Engineer, Payments',
  url: 'https://stripe.com/jobs/123',
  job_description: 'Build the payments platform.',
  match_score_value: 94,
  match_score: 'high',
  status: 'found',
  notes: null,
  salary_range: '$185,000 – $245,000',
  location: 'Remote (US)',
  remote_type: 'remote',
  contract_type: 'full-time',
  applied_at: '2026-05-24T10:00:00Z',
  posted_at: '2026-05-24',
  created_at: '2026-05-24T10:00:00Z',
}

describe('ScanJobFlyout', () => {
  it('renders company avatar with initials, role, company', () => {
    render(<ScanJobFlyout application={app} onClose={() => {}} onApplied={() => {}} />)
    expect(screen.getByText('St')).toBeInTheDocument() // avatar initials
    expect(screen.getByText('Senior Software Engineer, Payments')).toBeInTheDocument()
    expect(screen.getByText(/Stripe · Remote/)).toBeInTheDocument()
  })

  it('shows match score as decimal and salary in meta row', () => {
    render(<ScanJobFlyout application={app} onClose={() => {}} onApplied={() => {}} />)
    expect(screen.getByText(/0\.94/)).toBeInTheDocument()
    expect(screen.getByText(/\$185,000/)).toBeInTheDocument()
  })

  it('renders Overview, Tailored CV, Cover letter, Outreach tabs', () => {
    render(<ScanJobFlyout application={app} onClose={() => {}} onApplied={() => {}} />)
    expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tailored CV' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cover letter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Outreach' })).toBeInTheDocument()
  })

  it('shows Open posting link when url is present', () => {
    render(<ScanJobFlyout application={app} onClose={() => {}} onApplied={() => {}} />)
    const link = screen.getByRole('link', { name: /open posting/i })
    expect(link).toHaveAttribute('href', 'https://stripe.com/jobs/123')
  })

  it('shows job description content on Overview tab', () => {
    render(<ScanJobFlyout application={app} onClose={() => {}} onApplied={() => {}} />)
    expect(screen.getByText(/Build the payments platform/)).toBeInTheDocument()
  })
})
