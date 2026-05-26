import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} alt="" />,
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/app/scan',
}))
vi.mock('@/actions/scan', () => ({
  listFoundApplications: vi.fn().mockResolvedValue([]),
  bulkApplyByScore: vi.fn().mockResolvedValue({ count: 0 }),
}))

import { ScanPage } from '@/components/app/ScanPage'

describe('ScanPage', () => {
  it('renders idle state with start scan button', () => {
    render(<ScanPage />)
    expect(screen.getByText('Find matching jobs')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start scan/i })).toBeInTheDocument()
  })

  it('does not render scanning or done UI in idle state', () => {
    render(<ScanPage />)
    expect(screen.queryByText(/scanning for matches/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/scan complete/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/connection error/i)).not.toBeInTheDocument()
  })
})
