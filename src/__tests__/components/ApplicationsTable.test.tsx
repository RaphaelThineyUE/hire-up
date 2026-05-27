import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ApplicationsTable } from '@/components/app/ApplicationsTable'
import type { Application } from '@/lib/types'

function makeApp(overrides: Partial<Application> = {}): Application {
  return {
    id: 'app-1',
    user_id: 'u1',
    company: 'Acme Corp',
    role: 'Frontend Engineer',
    url: null,
    job_description: null,
    match_score_value: 75,
    match_score: 'high',
    status: 'applied',
    notes: null,
    salary_range: null,
    location: 'San Francisco',
    remote_type: null,
    contract_type: null,
    applied_at: '2026-01-01T00:00:00Z',
    posted_at: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('ApplicationsTable', () => {
  it('shows empty state message when no applications', () => {
    render(<ApplicationsTable applications={[]} onRowClick={vi.fn()} />)
    expect(screen.getByText('No applications yet.')).toBeInTheDocument()
  })

  it('renders role, company and avatar abbreviation for each row', () => {
    render(<ApplicationsTable applications={[makeApp()]} onRowClick={vi.fn()} />)
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('AC')).toBeInTheDocument()
  })

  it('renders status chip and score badge', () => {
    render(<ApplicationsTable applications={[makeApp()]} onRowClick={vi.fn()} />)
    // Scope to the table — chip is inside it, filter tabs are not
    const table = screen.getByRole('table')
    expect(within(table).getByText('Applied')).toBeInTheDocument()
    expect(within(table).getByText('75')).toBeInTheDocument()
  })

  it('shows em-dash when location is null', () => {
    render(<ApplicationsTable applications={[makeApp({ location: null })]} onRowClick={vi.fn()} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('calls onRowClick with the application when a row is clicked', () => {
    const onRowClick = vi.fn()
    const app = makeApp()
    render(<ApplicationsTable applications={[app]} onRowClick={onRowClick} />)
    fireEvent.click(screen.getByText('Frontend Engineer'))
    expect(onRowClick).toHaveBeenCalledWith(app)
  })

  it('defaults to showing all rows', () => {
    const apps = [
      makeApp({ id: '1', role: 'Role A' }),
      makeApp({ id: '2', role: 'Role B', status: 'rejected' }),
    ]
    render(<ApplicationsTable applications={apps} onRowClick={vi.fn()} />)
    expect(screen.getByText('Role A')).toBeInTheDocument()
    expect(screen.getByText('Role B')).toBeInTheDocument()
  })

  it('filters rows by status when a status tab is clicked', () => {
    const apps = [
      makeApp({ id: '1', status: 'applied', role: 'Role Applied' }),
      makeApp({ id: '2', status: 'offer', role: 'Role Offer', company: 'Beta Co' }),
    ]
    render(<ApplicationsTable applications={apps} onRowClick={vi.fn()} />)

    // The 'Offer' filter tab has textContent "Offer1" while the chip span has "Offer".
    // getAllByText(/^Offer/) returns both; the tab div appears first in DOM order.
    const offerEls = screen.getAllByText(/^Offer/)
    fireEvent.click(offerEls[0])

    expect(screen.getByText('Role Offer')).toBeInTheDocument()
    expect(screen.queryByText('Role Applied')).not.toBeInTheDocument()
  })

  it('shows descending sort indicator on Added column by default', () => {
    render(<ApplicationsTable applications={[makeApp()]} onRowClick={vi.fn()} />)
    expect(screen.getByText(/Added ↓/)).toBeInTheDocument()
  })

  it('shows sort indicator on Role column after clicking its header', () => {
    render(<ApplicationsTable applications={[makeApp()]} onRowClick={vi.fn()} />)
    fireEvent.click(screen.getByText(/^Role/))
    expect(screen.getByText(/Role ↓/)).toBeInTheDocument()
  })

  it('toggles sort direction when clicking the active sort column', () => {
    render(<ApplicationsTable applications={[makeApp()]} onRowClick={vi.fn()} />)
    fireEvent.click(screen.getByText(/^Role/))
    expect(screen.getByText(/Role ↓/)).toBeInTheDocument()
    fireEvent.click(screen.getByText(/Role ↓/))
    expect(screen.getByText(/Role ↑/)).toBeInTheDocument()
  })
})
