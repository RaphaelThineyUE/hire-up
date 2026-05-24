import type { ReactNode, CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  padding?: number | string
  onClick?: () => void
  style?: CSSProperties
  className?: string
}

export function Card({ children, padding = 24, onClick, style, className }: CardProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: 'var(--bg-1)',
        border: '1px solid var(--border-0)',
        borderRadius: 'var(--r-lg)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
