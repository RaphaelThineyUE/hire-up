'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Chip } from './Chip'
import { ScoreBadge } from './ScoreBadge'
import { ApplicationForm } from './ApplicationForm'
import { deleteApplication } from '@/actions/applications'
import type { Application } from '@/lib/types'

interface ApplicationDetailProps {
  application: Application
  onClose?: () => void
  fullPage?: boolean
}

export function ApplicationDetail({ application: app, onClose, fullPage = false }: ApplicationDetailProps) {
  const [editing, setEditing] = useState(false)

  async function handleDelete() {
    if (!confirm(`Remove application to ${app.company}?`)) return
    await deleteApplication(app.id)
    onClose?.()
  }

  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2 }
  const fieldLabel: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: 10,
    letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)',
  }
  const fieldValue: React.CSSProperties = { fontSize: 13, color: 'var(--fg-0)' }

  if (editing) {
    return (
      <ApplicationForm
        mode="edit"
        initial={app}
        onDone={() => setEditing(false)}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px', color: 'var(--fg-0)' }}>
              {app.role}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-2)' }}>{app.company}</p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={() => setEditing(true)} style={{ padding: '6px 10px', background: 'var(--bg-2)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--fg-1)' }}>
              <Pencil size={13} strokeWidth={1.75} /> Edit
            </button>
            <button onClick={handleDelete} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--danger)' }}>
              <Trash2 size={13} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip status={app.status} />
          <ScoreBadge value={app.match_score_value} />
          {app.url && (
            <a href={app.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--fg-2)', textDecoration: 'none' }}>
              <ExternalLink size={12} strokeWidth={1.75} /> Job posting
            </a>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {app.location && <div style={fieldStyle}><span style={fieldLabel}>Location</span><span style={fieldValue}>{app.location}</span></div>}
        {app.remote_type && <div style={fieldStyle}><span style={fieldLabel}>Remote</span><span style={{ ...fieldValue, textTransform: 'capitalize' }}>{app.remote_type}</span></div>}
        {app.contract_type && <div style={fieldStyle}><span style={fieldLabel}>Contract</span><span style={{ ...fieldValue, textTransform: 'capitalize' }}>{app.contract_type}</span></div>}
        {app.salary_range && <div style={fieldStyle}><span style={fieldLabel}>Salary</span><span style={{ ...fieldValue, fontFamily: 'var(--font-mono)' }}>{app.salary_range}</span></div>}
        {app.posted_at && <div style={fieldStyle}><span style={fieldLabel}>Posted</span><span style={{ ...fieldValue, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{app.posted_at}</span></div>}
        <div style={fieldStyle}><span style={fieldLabel}>Applied</span><span style={{ ...fieldValue, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{new Date(app.applied_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
      </div>

      {fullPage && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Documents</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ padding: '12px 16px', background: 'var(--bg-2)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--fg-2)' }}>
              No documents yet. AI features coming in Plan 2.
            </div>
          </div>
        </div>
      )}

      {app.notes && (
        <div style={fieldStyle}>
          <span style={fieldLabel}>Notes</span>
          <p style={{ ...fieldValue, margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--fg-1)' }}>{app.notes}</p>
        </div>
      )}

      {!fullPage && (
        <Link
          href={`/app/applications/${app.id}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', background: 'var(--bg-2)',
            border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)',
            fontSize: 13, color: 'var(--fg-1)', textDecoration: 'none',
            alignSelf: 'flex-start',
          }}
        >
          Open full page →
        </Link>
      )}
    </div>
  )
}
