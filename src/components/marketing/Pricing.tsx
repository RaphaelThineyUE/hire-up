const ArrowIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
)

const CheckIcon = ({ inverted }: { inverted?: boolean }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={inverted ? 'var(--accent)' : 'var(--accent)'} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

interface Tier {
  name: string
  price: string
  sub: string
  cta: string
  popular?: boolean
  features: string[]
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    sub: 'For an active search',
    cta: 'Start free',
    features: [
      '25 tracked applications',
      '10-board scan',
      'Tailored CV + cover letter',
      'Manual apply with pre-fill',
    ],
  },
  {
    name: 'Pro',
    price: '$29',
    sub: '/month · cancel anytime',
    cta: 'Start 14-day trial',
    popular: true,
    features: [
      'Unlimited tracked applications',
      '10-board scan, scheduled hourly',
      'Auto-apply on 4 portals',
      'Drafted contact outreach',
      'CSV export + Notion sync',
      'Priority support',
    ],
  },
]

export default function Pricing() {
  return (
    <section id="pricing" style={{ background: 'var(--bg-1)', padding: '120px 0', borderTop: '1px solid var(--border-0)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--gutter)' }}>
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 64px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>
            Pricing
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 5vw, 64px)',
            lineHeight: 1, letterSpacing: '-0.03em', fontWeight: 700,
            margin: '20px 0 16px', color: 'var(--fg-0)',
          }}>
            One price. One job to do.
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.5, color: 'var(--fg-1)', margin: 0 }}>
            Free until you find something. Pro if you want it faster.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, maxWidth: 880, margin: '0 auto' }}>
          {TIERS.map(t => (
            <div key={t.name} style={{
              background: t.popular ? 'var(--bg-inverse)' : 'var(--bg-0)',
              color: t.popular ? 'var(--fg-inverse)' : 'var(--fg-0)',
              border: t.popular ? '1px solid var(--bg-inverse)' : '1px solid var(--border-0)',
              borderRadius: 'var(--r-xl)',
              padding: 36,
              position: 'relative',
            }}>
              {t.popular && (
                <span style={{
                  position: 'absolute', top: 20, right: 20,
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '4px 10px', borderRadius: 'var(--r-sm)',
                  background: 'var(--accent-bg)', color: 'var(--fg-on-accent)',
                }}>Best for active search</span>
              )}

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.popular ? 'var(--fg-3)' : 'var(--fg-2)' }}>
                {t.name}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 700,
                  letterSpacing: '-0.04em', lineHeight: 1,
                  color: t.popular ? 'var(--fg-inverse)' : 'var(--fg-0)',
                  fontVariantNumeric: 'tabular-nums',
                }}>{t.price}</span>
                <span style={{ fontSize: 14, color: t.popular ? 'var(--fg-3)' : 'var(--fg-2)' }}>{t.sub}</span>
              </div>

              <div style={{ marginTop: 28 }}>
                <a href="#signup" style={{
                  height: 44, padding: '0 18px',
                  borderRadius: 'var(--r-sm)',
                  fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%',
                  ...(t.popular
                    ? { background: 'var(--accent-bg)', color: 'var(--fg-on-accent)', border: '1px solid var(--fg-0)' }
                    : { background: 'transparent', color: 'var(--fg-0)', border: '1.5px solid var(--fg-0)' }
                  ),
                }}>
                  {t.cta}
                  <ArrowIcon />
                </a>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '32px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {t.features.map((f, i) => (
                  <li key={i} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 12, alignItems: 'center', fontSize: 14, color: t.popular ? 'var(--fg-2)' : 'var(--fg-1)' }}>
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
