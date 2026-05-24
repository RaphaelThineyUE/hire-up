'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface SlideOverProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  width?: number
}

export function SlideOver({ open, onClose, title, children, width = 480 }: SlideOverProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(26,22,20,0.35)',
          zIndex: 40, animation: 'fade-in 120ms var(--ease-out)',
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width,
        background: 'var(--bg-1)', borderLeft: '1px solid var(--border-0)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px -8px rgba(26,22,20,0.18)',
        animation: 'slide-in-right 180ms var(--ease-out)',
      }}>
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px', borderBottom: '1px solid var(--border-0)',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--fg-0)' }}>
              {title}
            </span>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, display: 'grid', placeItems: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderRadius: 'var(--r-sm)', color: 'var(--fg-2)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slide-in-right { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  )
}
