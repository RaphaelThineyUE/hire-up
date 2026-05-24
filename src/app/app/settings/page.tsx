import { getSettings } from '@/actions/settings'
import { SettingsSection } from '@/components/app/SettingsSection'
import { SettingsForm } from '@/components/app/SettingsForm'

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div style={{ padding: 32, maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
          Configuration
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: 'var(--fg-0)' }}>
          Settings
        </h1>
      </div>

      <SettingsForm settings={settings} />
    </div>
  )
}
