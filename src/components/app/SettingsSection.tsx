interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div style={{
      background: 'var(--bg-1)', border: '1px solid var(--border-0)',
      borderRadius: 'var(--r-lg)', overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-0)', background: 'var(--bg-2)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--fg-0)' }}>
          {title}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 3 }}>{description}</div>
        )}
      </div>
      <div style={{ padding: 20 }}>
        {children}
      </div>
    </div>
  )
}
