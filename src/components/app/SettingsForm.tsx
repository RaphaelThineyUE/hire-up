'use client'

import { useTransition, useState } from 'react'
import { updateSettings } from '@/actions/settings'
import { SettingsSection } from './SettingsSection'
import type { UserSettings } from '@/lib/types'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', boxSizing: 'border-box',
  background: 'var(--bg-0)', border: '1px solid var(--border-1)',
  borderRadius: 'var(--r-sm)', color: 'var(--fg-0)', fontSize: 13,
  outline: 'none', fontFamily: 'var(--font-body)',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)',
  letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 4,
}

type SettingsWithMasks = UserSettings & {
  claude_api_key_masked: string
  openai_api_key_masked: string
  jsearch_api_key_masked: string
}

interface SettingsFormProps {
  settings: SettingsWithMasks
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [provider, setProvider] = useState(settings.ai_provider)

  async function handleSubmit(formData: FormData) {
    setSaved(false)
    startTransition(async () => {
      await updateSettings({
        ai_provider:             formData.get('ai_provider') as UserSettings['ai_provider'],
        ai_base_url:             formData.get('ai_base_url') as string,
        ai_model:                formData.get('ai_model') as string,
        claude_api_key_enc:      formData.get('claude_api_key') as string,
        openai_api_key_enc:      formData.get('openai_api_key') as string,
        jsearch_api_key_enc:     formData.get('jsearch_api_key') as string,
        find_jobs_candidates:    parseInt(formData.get('find_jobs_candidates') as string) || 25,
        find_jobs_save_count:    parseInt(formData.get('find_jobs_save_count') as string) || 10,
        cron_enabled:            formData.get('cron_enabled') === 'on',
        cron_hour_utc:           parseInt(formData.get('cron_hour_utc') as string) || 8,
      })
      setSaved(true)
    })
  }

  return (
    <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* AI Provider */}
      <SettingsSection title="AI Provider" description="Choose how AI scoring and document generation are powered.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {(['ollama', 'claude', 'openai'] as const).map(p => (
              <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--fg-1)' }}>
                <input type="radio" name="ai_provider" value={p} defaultChecked={settings.ai_provider === p}
                  onChange={() => setProvider(p)} style={{ accentColor: 'var(--accent)' }} />
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </label>
            ))}
          </div>
          {provider === 'ollama' && (
            <div>
              <label style={labelStyle}>Base URL</label>
              <input name="ai_base_url" defaultValue={settings.ai_base_url} style={inputStyle} placeholder="http://127.0.0.1:1234/v1" />
            </div>
          )}
          <div>
            <label style={labelStyle}>Model</label>
            <input name="ai_model" defaultValue={settings.ai_model} style={inputStyle}
              placeholder={provider === 'claude' ? 'claude-sonnet-4-6' : provider === 'openai' ? 'gpt-4o-mini' : 'llama3'} />
          </div>
          {provider === 'claude' && (
            <div>
              <label style={labelStyle}>Claude API Key</label>
              <input name="claude_api_key" type="password" defaultValue={settings.claude_api_key_masked} style={inputStyle} placeholder="sk-ant-…" autoComplete="off" />
            </div>
          )}
          {provider === 'openai' && (
            <div>
              <label style={labelStyle}>OpenAI API Key</label>
              <input name="openai_api_key" type="password" defaultValue={settings.openai_api_key_masked} style={inputStyle} placeholder="sk-…" autoComplete="off" />
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Job Search */}
      <SettingsSection title="Job Search" description="JSearch API configuration for Find Jobs.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>JSearch API Key (RapidAPI)</label>
            <input name="jsearch_api_key" type="password" defaultValue={settings.jsearch_api_key_masked} style={inputStyle} placeholder="Your RapidAPI key" autoComplete="off" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Candidate pool</label>
              <input name="find_jobs_candidates" type="number" min={1} max={50} defaultValue={settings.find_jobs_candidates} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Top jobs to save</label>
              <input name="find_jobs_save_count" type="number" min={1} max={25} defaultValue={settings.find_jobs_save_count} style={inputStyle} />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)' }}>Search parameters (country, location, etc.) are configured on the Applications page.</p>
        </div>
      </SettingsSection>

      {/* Auto Source */}
      <SettingsSection title="Auto Source" description="Automatically find and save top job matches daily.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--fg-1)' }}>
            <input type="checkbox" name="cron_enabled" defaultChecked={settings.cron_enabled} style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
            Enable daily auto-source
          </label>
          <div>
            <label style={labelStyle}>Hour (UTC)</label>
            <input name="cron_hour_utc" type="number" min={0} max={23} defaultValue={settings.cron_hour_utc} style={{ ...inputStyle, maxWidth: 80 }} />
          </div>
        </div>
      </SettingsSection>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '9px 20px', background: 'var(--accent)', border: 'none',
            borderRadius: 'var(--r-sm)', color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: isPending ? 'default' : 'pointer', opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? 'Saving…' : 'Save settings'}
        </button>
        {saved && <span style={{ fontSize: 13, color: 'var(--success)' }}>Saved</span>}
      </div>
    </form>
  )
}
