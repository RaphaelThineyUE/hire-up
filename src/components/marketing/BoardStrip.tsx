const BOARDS = ['LinkedIn', 'Indeed', 'Greenhouse', 'Lever', 'Workable', 'Wellfound', 'WeWorkRemotely', 'Y Combinator', 'Ashby', 'SimplyHired']

export default function BoardStrip() {
  return (
    <section style={{
      background: 'var(--bg-1)', padding: '56px 0',
      borderTop: '1px solid var(--border-0)',
      borderBottom: '1px solid var(--border-0)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--gutter)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)',
            letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>
            One scan, ten boards
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 32px', flex: 1, justifyContent: 'flex-end' }}>
            {BOARDS.map(b => (
              <span key={b} style={{
                fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
                color: 'var(--fg-1)', letterSpacing: '-0.015em',
              }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
