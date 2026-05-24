const ArrowIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
)

export default function FinalCTA() {
  return (
    <section style={{ background: 'var(--bg-inverse)', padding: '120px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--gutter)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'end' }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)' }} />
              Stop pasting. Start applying.
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(48px, 6vw, 88px)',
              lineHeight: 1, letterSpacing: '-0.035em', fontWeight: 800,
              margin: '24px 0 0', color: 'var(--fg-inverse)', maxWidth: 800,
            }}>
              Your next job is on one of these boards.<br />
              <span style={{ color: 'var(--accent)' }}>We&apos;ll find it.</span>
            </h2>
          </div>

          <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            <a href="#signup" style={{
              height: 52, padding: '0 22px',
              borderRadius: 'var(--r-sm)',
              fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--accent-bg)', color: 'var(--fg-on-accent)',
              border: '1px solid var(--fg-0)',
            }}>
              Start free <ArrowIcon />
            </a>
            <a href="#demo" style={{
              height: 52, padding: '0 22px',
              borderRadius: 'var(--r-sm)',
              fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent', color: 'var(--fg-inverse)',
              border: '1px solid var(--fg-inverse)',
            }}>
              Book a demo
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
