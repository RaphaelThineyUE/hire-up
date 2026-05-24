import type { ApplicationStatus } from '@/lib/types'

const CHIP_STYLES: Record<ApplicationStatus, { bg: string; color: string }> = {
  found:        { bg: 'var(--bg-3)',       color: 'var(--fg-1)'    },
  applied:      { bg: 'var(--accent-soft)', color: 'var(--accent)'  },
  interviewing: { bg: 'var(--info-bg)',    color: 'var(--info)'    },
  offer:        { bg: 'var(--success-bg)', color: 'var(--success)' },
  rejected:     { bg: 'var(--danger-bg)',  color: 'var(--danger)'  },
}

const CHIP_LABELS: Record<ApplicationStatus, string> = {
  found:        'Found',
  applied:      'Applied',
  interviewing: 'Interviewing',
  offer:        'Offer',
  rejected:     'Rejected',
}

interface ChipProps {
  status: ApplicationStatus
}

export function Chip({ status }: ChipProps) {
  const s = CHIP_STYLES[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px',
      background: s.bg, color: s.color,
      borderRadius: 'var(--r-xs)',
      fontFamily: 'var(--font-mono)', fontSize: 11,
      fontWeight: 600, letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>
      {CHIP_LABELS[status]}
    </span>
  )
}
