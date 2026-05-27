import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScoreBadge } from '@/components/app/ScoreBadge'
import { Chip } from '@/components/app/Chip'
import { StatCard } from '@/components/app/StatCard'

describe('ScoreBadge', () => {
  it('renders em-dash when value is null', () => {
    render(<ScoreBadge value={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders numeric score and "high" label for score >= 70', () => {
    render(<ScoreBadge value={85} />)
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
  })

  it('renders "medium" label for score in 40–69 range', () => {
    render(<ScoreBadge value={55} />)
    expect(screen.getByText('55')).toBeInTheDocument()
    expect(screen.getByText('medium')).toBeInTheDocument()
  })

  it('renders "low" label for score below 40', () => {
    render(<ScoreBadge value={25} />)
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('low')).toBeInTheDocument()
  })
})

describe('Chip', () => {
  it.each([
    ['found', 'Found'],
    ['applied', 'Applied'],
    ['interviewing', 'Interviewing'],
    ['offer', 'Offer'],
    ['rejected', 'Rejected'],
  ] as const)('renders correct label for status "%s"', (status, label) => {
    render(<Chip status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})

describe('StatCard', () => {
  it('renders label and numeric value', () => {
    render(<StatCard label="Total" value={42} />)
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders sub text when provided', () => {
    render(<StatCard label="Applied" value={5} sub="this week" />)
    expect(screen.getByText('this week')).toBeInTheDocument()
  })

  it('does not render sub text when omitted', () => {
    render(<StatCard label="Applied" value={5} />)
    expect(screen.queryByText('this week')).not.toBeInTheDocument()
  })

  it('renders value 0 without sub text', () => {
    render(<StatCard label="Offers" value={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
