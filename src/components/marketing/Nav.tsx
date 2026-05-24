'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/components/ThemeProvider'

const SunIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" /><path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
  </svg>
)

const MoonIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Changelog', href: '#changelog' },
]

export default function Nav() {
  const { theme, toggle } = useTheme()

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: 'var(--bg-0)',
      borderBottom: '1px solid var(--border-0)',
      height: 64,
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 var(--gutter)',
        width: '100%',
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 32,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Image src="/mark.svg" alt="Hire Up mark" width={28} height={28} priority />
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22,
            letterSpacing: '-0.045em', color: 'var(--fg-0)', whiteSpace: 'nowrap',
          }}>Hire Up</span>
        </Link>

        <div style={{ display: 'flex', gap: 28, justifyContent: 'center' }}>
          {LINKS.map(l => (
            <a key={l.href} href={l.href} className="nav-link" style={{
              fontSize: 14, fontWeight: 500,
            }}>{l.label}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            style={{
              width: 36, height: 36, padding: 0,
              borderRadius: 'var(--r-sm)',
              background: 'transparent',
              border: '1px solid var(--border-0)',
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--fg-1)',
            }}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <a href="/login" style={{
            height: 36, padding: '0 14px',
            borderRadius: 'var(--r-sm)',
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
            background: 'transparent', color: 'var(--fg-0)',
            border: '1px solid transparent',
            transition: 'background var(--t-fast) var(--ease-out)',
          }}>Log in</a>
          <a href="/signup" style={{
            height: 36, padding: '0 14px',
            borderRadius: 'var(--r-sm)',
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
            background: 'var(--accent-bg)', color: 'var(--fg-on-accent)',
            border: '1px solid var(--fg-0)',
            transition: 'background var(--t-fast) var(--ease-out)',
          }}>Start free</a>
        </div>
      </div>
    </nav>
  )
}
