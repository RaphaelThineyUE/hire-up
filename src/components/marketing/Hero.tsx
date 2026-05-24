const ArrowIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
)

const CheckIcon = ({ color = 'var(--accent)' }: { color?: string }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const SearchIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
)

type BoardStatus = 'done' | 'scan' | 'queued' | 'err'

const BOARDS: [string, string, BoardStatus][] = [
  ['LinkedIn', '124', 'done'],
  ['Indeed', '89', 'done'],
  ['Greenhouse', '47', 'done'],
  ['Lever', '31', 'done'],
  ['Workable', '12 so far…', 'scan'],
  ['Wellfound', '8 so far…', 'scan'],
  ['WeWorkRemotely', '4 so far…', 'scan'],
  ['YC', 'Queued', 'queued'],
  ['Ashby', 'Queued', 'queued'],
  ['SimplyHired', 'Connection failed', 'err'],
]

const RESULTS: [string, string, string, string][] = [
  ['Stripe', 'Senior Engineer, Payments', '$185k–245k', '0.94'],
  ['Linear', 'Staff Product Designer', '$200k–260k', '0.91'],
  ['Vercel', 'Design Engineer', '$170k–220k', '0.89'],
]

function ProductPreview() {
  return (
    <div style={{
      background: 'var(--bg-1)',
      border: '1px solid var(--border-1)',
      borderRadius: 'var(--r-2xl)',
      boxShadow: 'var(--shadow-xl)',
      overflow: 'hidden',
    }}>
      {/* Browser chrome */}
      <div style={{
        height: 36, background: 'var(--bg-2)',
        borderBottom: '1px solid var(--border-0)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8,
      }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#E0584F' }} />
        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#E5A93C' }} />
        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#5DBF55' }} />
        <span style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
          app.hireup.work/scan
        </span>
      </div>

      {/* Scan view mock */}
      <div style={{ padding: 28, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 6 }}>
              Scan · 10 boards
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: 'var(--fg-0)' }}>
              Scanning for matches…
            </h3>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-0)', fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--accent)' }} />
            7 of 10 boards · 47 unique
          </span>
        </div>

        <div style={{ height: 4, background: 'var(--bg-2)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: '70%', height: '100%', background: 'var(--accent)', borderRadius: 999 }} />
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1,
          background: 'var(--border-0)', border: '1px solid var(--border-0)',
          borderRadius: 'var(--r-md)', overflow: 'hidden', marginTop: 8,
        }}>
          {BOARDS.map(([name, sub, status], i) => (
            <div key={i} style={{ background: 'var(--bg-1)', padding: '12px 14px', opacity: status === 'queued' ? 0.55 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>{name}</span>
                {status === 'done' && <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                {status === 'err' && <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-2)', marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {RESULTS.map(([co, title, salary, match], i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '36px 1fr auto auto', gap: 12, alignItems: 'center',
              padding: '10px 14px', background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-md)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--r-xs)',
                background: 'var(--bg-inverse)', color: 'var(--accent-bg)',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
                display: 'grid', placeItems: 'center',
              }}>{co.slice(0, 2)}</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-0)' }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 1 }}>{co} · {salary}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>● {match}</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
                padding: '4px 8px', borderRadius: 'var(--r-sm)',
                background: '#FFE5D6', color: '#7A2510',
              }}>READY</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section id="product" style={{ background: 'var(--bg-0)', padding: '80px 0 100px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--gutter)' }}>
        <div style={{ display: 'grid', gap: 32 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-2)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)' }} />
            Aim higher. Apply faster.
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(56px, 8vw, 104px)',
            lineHeight: 0.98,
            letterSpacing: '-0.04em',
            fontWeight: 800,
            margin: 0,
            maxWidth: 1100,
            color: 'var(--fg-0)',
          }}>
            Stop pasting your CV<br />
            into 50 forms.
          </h1>

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 22, lineHeight: 1.4,
            maxWidth: 640, margin: 0,
            color: 'var(--fg-1)',
            letterSpacing: '-0.01em',
          }}>
            Hire Up searches 10 job boards, tailors your CV and cover letter per posting, and applies when it can — all under your review.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <a href="#signup" style={{
              height: 52, padding: '0 22px',
              borderRadius: 'var(--r-sm)',
              fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--accent-bg)', color: 'var(--fg-on-accent)',
              border: '1px solid var(--fg-0)',
            }}>
              Start free — no card
              <ArrowIcon />
            </a>
            <a href="#demo" style={{
              height: 52, padding: '0 22px',
              borderRadius: 'var(--r-sm)',
              fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent', color: 'var(--fg-0)',
              border: '1.5px solid var(--fg-0)',
            }}>
              See a 90-second demo
            </a>
            <span style={{ fontSize: 13, color: 'var(--fg-2)', marginLeft: 8 }}>
              Free plan tracks 25 applications · no time limit
            </span>
          </div>
        </div>

        <div style={{ marginTop: 80 }}>
          <ProductPreview />
        </div>
      </div>
    </section>
  )
}
