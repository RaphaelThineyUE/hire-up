import Image from 'next/image'

interface FooterColumn {
  title: string
  links: string[]
}

const COLS: FooterColumn[] = [
  { title: 'Product', links: ['Features', 'How it works', 'Pricing', 'Changelog'] },
  { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
  { title: 'Resources', links: ['Help center', 'API docs', 'Status', 'Contact'] },
  { title: 'Legal', links: ['Terms', 'Privacy', 'Security', 'DPA'] },
]

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg-inverse)', borderTop: '1px solid #322B26', padding: '64px 0 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--gutter)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Image src="/mark-on-dark.svg" alt="Hire Up" width={28} height={28} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.045em', color: 'var(--fg-inverse)', whiteSpace: 'nowrap' }}>
                Hire Up
              </span>
            </div>
            <p style={{ fontSize: 14, color: '#A89C8E', maxWidth: 280, marginTop: 16, lineHeight: 1.5 }}>
              Aim higher. Apply faster.
            </p>
          </div>

          {COLS.map(c => (
            <div key={c.title}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#A89C8E', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
                {c.title}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {c.links.map(l => (
                  <li key={l}>
                    <a href="#" className="footer-link" style={{ fontSize: 14 }}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid #322B26', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#76695F' }}>© 2026 Hire Up Labs, Inc.</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#76695F' }}>All systems operational</span>
        </div>
      </div>
    </footer>
  )
}
