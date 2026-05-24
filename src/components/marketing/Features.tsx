const CheckIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

interface Step {
  num: string
  title: string
  kicker: string
  body: string
  bullets: string[]
  mock: React.ReactNode
}

function ScanMock() {
  const cells = ['LinkedIn 124', 'Indeed 89', 'Greenhouse 47', 'Lever 31', 'Workable 12', 'Wellfound 8', 'Remote 4', 'YC ⋯']
  return (
    <div style={{ background: 'var(--bg-0)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-xl)', padding: 20, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--fg-2)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-0)' }}>staff product designer, remote, $180k+</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {cells.map((b, i) => {
          const [name, ...rest] = b.split(' ')
          return (
            <div key={i} style={{ padding: '8px 10px', background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--fg-1)', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{name}</span>
              <span style={{ color: 'var(--fg-2)' }}>{rest.join(' ')}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TailorMock() {
  const diffs = ['+ payments', '+ rewrites', '+ TypeScript', '+ Ruby', '− Python', '− Go']
  return (
    <div style={{ background: 'var(--bg-0)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-xl)', padding: 20, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Summary · diff vs base</div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg-1)', margin: 0 }}>
        Senior engineer with 8 years building <mark style={{ background: 'var(--accent-soft)', color: 'var(--fg-0)', padding: '0 2px' }}>payments infrastructure</mark> and developer tools.
        Led the <mark style={{ background: 'var(--accent-soft)', color: 'var(--fg-0)', padding: '0 2px' }}>charge pipeline rewrite at Plaid</mark>, owning <mark style={{ background: 'var(--accent-soft)', color: 'var(--fg-0)', padding: '0 2px' }}>$2B+ in monthly volume</mark>.
        Comfortable in <s style={{ color: 'var(--fg-3)' }}>Python and Go</s> <mark style={{ background: 'var(--accent-soft)', color: 'var(--fg-0)', padding: '0 2px' }}>TypeScript and Ruby</mark>.
      </p>
      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {diffs.map(t => (
          <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 8px', borderRadius: 'var(--r-sm)', background: t.startsWith('+') ? 'var(--accent-soft)' : 'var(--bg-2)', color: t.startsWith('+') ? '#7A2510' : 'var(--fg-2)' }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

function ApplyMock() {
  return (
    <div style={{ background: 'var(--bg-0)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-xl)', padding: 20, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Drafted email · awaiting your approval</div>
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-0)', fontSize: 12, color: 'var(--fg-1)', display: 'grid', gridTemplateColumns: '60px 1fr', gap: 8 }}>
          <span style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>To</span>
          <span>mira.acharya@stripe.com</span>
          <span style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>Subject</span>
          <span>re: Senior Engineer, Payments — interested</span>
        </div>
        <div style={{ padding: 16, fontSize: 13, lineHeight: 1.6, color: 'var(--fg-1)' }}>
          Hi Mira,<br /><br />
          Saw your req for a Senior Engineer on Payments. I led the charge pipeline rewrite at Plaid (p95 1.8s → 220ms over 14 months) and the work lines up cleanly. Resume attached…
        </div>
        <div style={{ padding: 10, borderTop: '1px solid var(--border-0)', background: 'var(--bg-2)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ padding: '6px 12px', background: 'var(--accent-bg)', color: 'var(--fg-on-accent)', border: '1px solid var(--fg-0)', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--fg-on-accent)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
            Send
          </span>
          <span style={{ padding: '6px 12px', fontSize: 12, color: 'var(--fg-1)' }}>Edit</span>
          <span style={{ padding: '6px 12px', fontSize: 12, color: 'var(--fg-2)' }}>Skip</span>
        </div>
      </div>
    </div>
  )
}

const STEPS: Step[] = [
  {
    num: '01', title: 'Scan', kicker: 'One query, ten boards',
    body: 'Set your filters once — title, salary, location, stack — and Hire Up runs them across LinkedIn, Indeed, Greenhouse, Lever, and six more, in parallel. Results stream in as boards finish. Duplicates collapse automatically.',
    bullets: ['10 boards, ~3 seconds', 'De-duped by company + role', 'Saved searches re-run on a schedule'],
    mock: <ScanMock />,
  },
  {
    num: '02', title: 'Tailor', kicker: 'CV + cover letter, per posting',
    body: 'Hire Up reads the full job description and tailors your CV and cover letter to it — surfacing the projects, metrics, and stack words that map to the role. Edits are diffed against your base CV so you can see exactly what changed.',
    bullets: ['Highlights the JD keywords you already have', 'Drafts a cover letter you can actually send', 'Drafts outreach when a hiring contact is found'],
    mock: <TailorMock />,
  },
  {
    num: '03', title: 'Apply', kicker: 'You review every send',
    body: 'For supported portals (Greenhouse, Lever, Ashby) Hire Up can auto-apply with your approval. For everything else, it opens the form pre-filled. Every submission lands in a tracked ledger — never apply twice.',
    bullets: ['Auto-apply on 4 portals · one-click on the rest', 'Every submission tracked, with stage', 'Never re-apply by accident'],
    mock: <ApplyMock />,
  },
]

export default function Features() {
  return (
    <section id="how" style={{ background: 'var(--bg-0)', padding: '120px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--gutter)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-2)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          How it works
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(40px, 5vw, 64px)',
          lineHeight: 1, letterSpacing: '-0.03em', fontWeight: 700,
          margin: '20px 0 80px', color: 'var(--fg-0)', maxWidth: 800,
        }}>
          Three steps. None of them are pasting.
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {STEPS.map((s, i) => (
            <div key={s.num} style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
              gap: 64, alignItems: 'center',
              background: 'var(--bg-1)',
              border: '1px solid var(--border-0)',
              borderRadius: 'var(--r-2xl)',
              padding: 48,
              direction: i % 2 === 1 ? 'rtl' : 'ltr',
            }}>
              <div style={{ direction: 'ltr' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                  {s.num} · {s.kicker}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1, margin: 0, color: 'var(--fg-0)' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--fg-1)', marginTop: 20, marginBottom: 24, maxWidth: 460 }}>
                  {s.body}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {s.bullets.map((b, j) => (
                    <li key={j} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 12, alignItems: 'flex-start', fontSize: 15, color: 'var(--fg-1)' }}>
                      <CheckIcon /> {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ direction: 'ltr' }}>{s.mock}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
