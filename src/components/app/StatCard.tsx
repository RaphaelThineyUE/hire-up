interface StatCardProps {
  label: string
  value: number
  sub?: string
  tone?: 'default' | 'info' | 'success' | 'warning' | 'danger'
}

const TONE_COLOR: Record<string, string> = {
  default: 'var(--fg-0)',
  info:    'var(--info)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger:  'var(--danger)',
}

export function StatCard({ label, value, sub, tone = 'default' }: StatCardProps) {
  return (
    <div style={{
      background: 'var(--bg-1)', border: '1px solid var(--border-0)',
      borderRadius: 'var(--r-lg)', padding: 20,
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700,
        letterSpacing: '-0.035em', lineHeight: 1, marginTop: 12,
        color: TONE_COLOR[tone], fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 8 }}>{sub}</div>
      )}
    </div>
  )
}
