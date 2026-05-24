'use client'

import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon, Bell } from 'lucide-react'

interface TopBarProps {
  userEmail?: string | null
}

export function TopBar({ userEmail }: TopBarProps) {
  const { theme, toggle } = useTheme()
  const initial = userEmail ? userEmail[0].toUpperCase() : '?'

  const iconBtn: React.CSSProperties = {
    width: 32, height: 32, display: 'grid', placeItems: 'center',
    background: 'transparent', border: 'none', cursor: 'pointer',
    borderRadius: 'var(--r-sm)', color: 'var(--fg-1)',
    transition: 'background var(--t-fast) var(--ease-out)',
  }

  return (
    <header style={{
      height: 64, flexShrink: 0,
      borderBottom: '1px solid var(--border-0)',
      background: 'var(--bg-0)',
      display: 'grid', gridTemplateColumns: '1fr auto',
      alignItems: 'center', padding: '0 24px', gap: 16,
    }}>
      <div style={{
        maxWidth: 520,
        background: 'var(--bg-1)', border: '1px solid var(--border-0)',
        borderRadius: 'var(--r-md)', padding: '0 12px', height: 38,
        display: 'grid', gridTemplateColumns: '18px 1fr auto',
        gap: 10, alignItems: 'center', cursor: 'pointer', color: 'var(--fg-3)',
      }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--fg-2)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <span style={{ fontSize: 14, color: 'var(--fg-3)' }}>Search jobs, contacts, or run a command…</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-2)',
          background: 'var(--bg-2)', border: '1px solid var(--border-0)', borderBottomWidth: 2,
          borderRadius: 'var(--r-xs)', padding: '2px 6px', lineHeight: 1.4,
        }}>⌘ K</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={toggle}
          style={iconBtn}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
        </button>
        <button
          style={iconBtn}
          aria-label="Notifications"
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Bell size={16} strokeWidth={1.75} />
        </button>
        <span style={{ width: 1, height: 24, background: 'var(--border-0)', margin: '0 4px' }} />
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--bg-inverse)', color: 'var(--fg-inverse)',
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
        }}>
          {initial}
        </div>
      </div>
    </header>
  )
}
