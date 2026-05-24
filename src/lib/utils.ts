export type MatchLabel = 'low' | 'medium' | 'high' | null

export function deriveMatchLabel(score: number | null): MatchLabel {
  if (score === null) return null
  if (score < 40) return 'low'
  if (score < 70) return 'medium'
  return 'high'
}

export function scoreColor(label: MatchLabel): string {
  switch (label) {
    case 'high':   return 'var(--success)'
    case 'medium': return 'var(--warning)'
    case 'low':    return 'var(--danger)'
    default:       return 'var(--fg-3)'
  }
}
