'use client'

import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { LayoutGrid, Inbox, FileText, Settings } from 'lucide-react'
import type { ReactNode } from 'react'

interface NavItem {
  id: string
  label: string
  href: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',    label: 'Dashboard',    href: '/app/dashboard',    icon: <LayoutGrid size={16} strokeWidth={1.75} /> },
  { id: 'applications', label: 'Applications', href: '/app/applications', icon: <Inbox size={16} strokeWidth={1.75} /> },
  { id: 'cv',           label: 'CV manager',   href: '/app/cv',           icon: <FileText size={16} strokeWidth={1.75} /> },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  function NavLink({ item }: { item: NavItem }) {
    const active = pathname.startsWith(item.href)
    return (
      <div
        role="link"
        tabIndex={0}
        onClick={() => router.push(item.href)}
        onKeyDown={e => e.key === 'Enter' && router.push(item.href)}
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '18px 1fr',
          gap: 10, alignItems: 'center',
          padding: '7px 8px', borderRadius: 'var(--r-sm)',
          fontSize: 13.5, color: active ? 'var(--fg-0)' : 'var(--fg-1)',
          fontWeight: 500, cursor: 'pointer',
          background: active ? 'var(--bg-2)' : 'transparent',
          transition: 'background var(--t-fast) var(--ease-out)',
          userSelect: 'none',
          outline: 'none',
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)' }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        {active && (
          <span style={{
            position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)',
            width: 3, height: 16, background: 'var(--accent)', borderRadius: 2,
          }} />
        )}
        <span style={{ color: active ? 'var(--fg-0)' : 'var(--fg-2)', display: 'flex' }}>{item.icon}</span>
        <span>{item.label}</span>
      </div>
    )
  }

  const settingsActive = pathname.startsWith('/app/settings')

  return (
    <aside style={{
      background: 'var(--bg-1)',
      borderRight: '1px solid var(--border-0)',
      padding: '16px 12px',
      display: 'flex', flexDirection: 'column', gap: 2,
      width: 240, flexShrink: 0, overflow: 'auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 8px 16px',
        borderBottom: '1px solid var(--border-0)', marginBottom: 12,
      }}>
        <Image src="/mark.svg" alt="" width={22} height={22} />
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
          letterSpacing: '-0.04em', color: 'var(--fg-0)', whiteSpace: 'nowrap',
        }}>Hire Up</span>
      </div>

      {NAV_ITEMS.map(item => <NavLink key={item.id} item={item} />)}

      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-0)' }}>
        <div
          role="link"
          tabIndex={0}
          onClick={() => router.push('/app/settings')}
          onKeyDown={e => e.key === 'Enter' && router.push('/app/settings')}
          style={{
            position: 'relative',
            display: 'grid', gridTemplateColumns: '18px 1fr', gap: 10, alignItems: 'center',
            padding: '7px 8px', borderRadius: 'var(--r-sm)',
            fontSize: 13.5, color: settingsActive ? 'var(--fg-0)' : 'var(--fg-1)',
            fontWeight: 500, cursor: 'pointer',
            background: settingsActive ? 'var(--bg-2)' : 'transparent',
            transition: 'background var(--t-fast) var(--ease-out)',
            outline: 'none',
          }}
          onMouseEnter={e => { if (!settingsActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)' }}
          onMouseLeave={e => { if (!settingsActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          {settingsActive && (
            <span style={{
              position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)',
              width: 3, height: 16, background: 'var(--accent)', borderRadius: 2,
            }} />
          )}
          <span style={{ color: settingsActive ? 'var(--fg-0)' : 'var(--fg-2)', display: 'flex' }}>
            <Settings size={16} strokeWidth={1.75} />
          </span>
          <span>Settings</span>
        </div>
      </div>
    </aside>
  )
}
