import { deriveMatchLabel, scoreColor } from '@/lib/utils'

interface ScoreBadgeProps {
  value: number | null
}

export function ScoreBadge({ value }: ScoreBadgeProps) {
  if (value === null || value === undefined) {
    return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)' }}>—</span>
  }

  const label = deriveMatchLabel(value)
  const color = scoreColor(label)

  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
        color, fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </span>
  )
}
