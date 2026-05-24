import type { ReactNode } from 'react'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-0)',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--bg-1)',
        border: '1px solid var(--border-0)',
        borderRadius: 'var(--r-lg)',
        padding: 40,
        width: '100%',
        maxWidth: 400,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <Image src="/mark.svg" alt="" width={24} height={24} />
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
            letterSpacing: '-0.04em', color: 'var(--fg-0)',
          }}>Hire Up</span>
        </div>
        {children}
      </div>
    </div>
  )
}
