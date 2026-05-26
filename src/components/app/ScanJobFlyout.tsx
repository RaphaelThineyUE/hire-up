'use client'

import { useState, useEffect, useTransition } from 'react'
import { X, ExternalLink, Send, Bookmark, SquarePen, Mail } from 'lucide-react'
import Link from 'next/link'
import { explainMatch, listContacts } from '@/actions/scan'
import { updateApplication } from '@/actions/applications'
import type { Application, Contact } from '@/lib/types'

type Tab = 'overview' | 'tailored_cv' | 'cover_letter' | 'outreach'

interface ScanJobFlyoutProps {
  application: Application
  onClose: () => void
  onApplied: (id: string) => void
}

function companyHue(name: string) {
  return Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360
}

function initials(name: string) {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return (name[0]?.toUpperCase() ?? '') + (name[1] ?? '')
  return words.slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

function scoreColor(v: number | null) {
  if (v === null) return 'var(--fg-3)'
  if (v >= 70) return 'var(--success, #16a34a)'
  if (v >= 40) return 'var(--warning, #d97706)'
  return 'var(--danger)'
}

function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const h = Math.floor(ms / 3_600_000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? '1d ago' : `${d}d ago`
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',     label: 'Overview' },
  { id: 'tailored_cv',  label: 'Tailored CV' },
  { id: 'cover_letter', label: 'Cover letter' },
  { id: 'outreach',     label: 'Outreach' },
]

export function ScanJobFlyout({ application: app, onClose, onApplied }: ScanJobFlyoutProps) {
  const [tab, setTab] = useState<Tab>('overview')
  const [reasons, setReasons] = useState<string[] | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [marking, startMark] = useTransition()

  const hue = companyHue(app.company)
  const abbr = initials(app.company)

  useEffect(() => {
    setReasons(null)
    setContacts([])
    explainMatch(app.id).then(setReasons)
    listContacts(app.id).then(setContacts)
  }, [app.id])

  function handleApply() {
    startMark(async () => {
      try {
        await updateApplication(app.id, { status: 'applied' })
        onApplied(app.id)
      } catch (err) {
        console.error('[ScanJobFlyout] apply failed:', err)
      }
    })
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(26,22,20,0.35)', zIndex: 40 }} />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 560,
        background: 'var(--bg-0)', borderLeft: '1px solid var(--border-0)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px -8px rgba(26,22,20,0.18)',
        animation: 'slide-in-right 180ms var(--ease-out)',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
            {/* Company avatar */}
            <div style={{ width: 44, height: 44, borderRadius: 10, background: `hsl(${hue}, 60%, 35%)`, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{abbr}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 3px', color: 'var(--fg-0)', lineHeight: 1.3 }}>
                {app.role}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--fg-2)', margin: 0 }}>
                {app.company}{app.location ? ` · ${app.location}` : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <Link
                href={`/app/applications/${app.id}`}
                onClick={onClose}
                style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', borderRadius: 'var(--r-sm)', textDecoration: 'none' }}
                title="Open in Applications"
              >
                <SquarePen size={15} strokeWidth={1.75} />
              </Link>
              <button onClick={onClose} style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', borderRadius: 'var(--r-sm)' }}>
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
            {app.match_score_value !== null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: scoreColor(app.match_score_value) }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: scoreColor(app.match_score_value), display: 'inline-block' }} />
                Match {(app.match_score_value / 100).toFixed(2)}
              </span>
            )}
            {app.salary_range && (
              <>
                <span style={{ color: 'var(--fg-3)', fontSize: 12 }}>|</span>
                <span style={{ fontSize: 13, color: 'var(--fg-1)' }}>{app.salary_range}</span>
              </>
            )}
            {app.posted_at && (
              <>
                <span style={{ color: 'var(--fg-3)', fontSize: 12 }}>|</span>
                <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Posted {relativeTime(app.posted_at)}</span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button
              onClick={handleApply}
              disabled={marking}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--r-sm)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: marking ? 'default' : 'pointer', opacity: marking ? 0.6 : 1 }}
            >
              <Send size={13} strokeWidth={2} /> Review &amp; send
            </button>
            <button
              onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'transparent', border: '1px solid var(--border-1)', borderRadius: 'var(--r-sm)', color: 'var(--fg-1)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <Bookmark size={13} strokeWidth={1.75} /> Save
            </button>
            {app.url && (
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'transparent', border: '1px solid var(--border-1)', borderRadius: 'var(--r-sm)', color: 'var(--fg-1)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
              >
                <ExternalLink size={13} strokeWidth={1.75} /> Open posting
              </a>
            )}
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-0)' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '8px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500,
                  color: tab === t.id ? 'var(--fg-0)' : 'var(--fg-2)',
                  borderBottom: tab === t.id ? '2px solid var(--fg-0)' : '2px solid transparent',
                  marginBottom: -1, transition: 'color var(--t-fast) var(--ease-out)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* Overview tab */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* Why matched */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 14 }}>
                  Why Hire Up Matched
                </div>
                {reasons === null && (
                  <p style={{ fontSize: 13, color: 'var(--fg-3)', fontStyle: 'italic', margin: 0 }}>Analyzing match…</p>
                )}
                {reasons !== null && reasons.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: 0 }}>No explanation — configure your AI provider in Settings.</p>
                )}
                {reasons !== null && reasons.length > 0 && (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {reasons.map((r, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.55 }}>
                        <span style={{ marginTop: 2, width: 15, height: 15, flexShrink: 0 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Job description */}
              {app.job_description && (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 14 }}>
                    Job Description (Scraped)
                  </div>
                  <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-md)', padding: '16px 18px', fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.75, whiteSpace: 'pre-wrap', maxHeight: 320, overflowY: 'auto' }}>
                    {app.job_description}
                  </div>
                </div>
              )}

              {/* Contact section */}
              {contacts.length > 0 && (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 14 }}>
                    Contact
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {contacts.map(c => {
                      const cAbbr = initials(c.name ?? '?')
                      const cHue  = companyHue(c.name ?? '?')
                      return (
                        <div
                          key={c.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-md)' }}
                        >
                          <div style={{ width: 38, height: 38, borderRadius: 8, background: `hsl(${cHue}, 55%, 40%)`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{cAbbr}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>{c.name}</div>
                            {c.role && <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 1 }}>{c.role}</div>}
                          </div>
                          {c.email && (
                            <a
                              href={`mailto:${c.email}`}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-1)', borderRadius: 'var(--r-sm)', color: 'var(--fg-1)', fontSize: 12, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}
                            >
                              <Mail size={12} strokeWidth={1.75} /> Draft email
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tailored CV + Cover letter tabs */}
          {(tab === 'tailored_cv' || tab === 'cover_letter') && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 48, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--fg-2)', margin: 0, lineHeight: 1.6 }}>
                Generate a {tab === 'tailored_cv' ? 'tailored CV' : 'cover letter'} from the full Application view.
              </p>
              <Link
                href={`/app/applications/${app.id}`}
                onClick={onClose}
                style={{ padding: '9px 18px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--r-sm)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
              >
                Open in Applications →
              </Link>
            </div>
          )}

          {/* Outreach tab */}
          {tab === 'outreach' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 48, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--fg-2)', margin: 0 }}>Outreach workflows coming soon.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  )
}
