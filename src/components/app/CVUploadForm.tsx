'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload, FileText, Trash2, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { uploadCV, deleteCV, setDefaultCV } from '@/actions/cv'
import type { CV } from '@/lib/types'

interface CVManagerProps {
  cvs: CV[]
}

export function CVUploadForm({ cvs }: CVManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleAddCV() {
    fileRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const formData = new FormData()
    formData.append('cv', file)
    startTransition(async () => {
      const result = await uploadCV(formData)
      if (result.error) setError(result.error)
      if (fileRef.current) fileRef.current.value = ''
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Remove this CV?')) return
    startTransition(async () => { await deleteCV(id) })
  }

  function handleSetDefault(id: string) {
    startTransition(async () => { await setDefaultCV(id) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {cvs.length === 0 ? (
        <div style={{
          background: 'var(--bg-1)', border: '1px solid var(--border-0)',
          borderRadius: 'var(--r-lg)', padding: '20px 20px',
          color: 'var(--fg-2)', fontSize: 13,
        }}>
          No CVs uploaded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cvs.map(cv => (
            <CVCard
              key={cv.id}
              cv={cv}
              isExpanded={expandedId === cv.id}
              onToggleExpand={() => setExpandedId(expandedId === cv.id ? null : cv.id)}
              onDelete={() => handleDelete(cv.id)}
              onSetDefault={() => handleSetDefault(cv.id)}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {error && <p style={{ margin: 0, fontSize: 13, color: 'var(--danger)' }}>{error}</p>}

      <button
        onClick={handleAddCV}
        disabled={isPending}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
          background: isPending ? 'transparent' : 'var(--accent)',
          border: isPending ? '1px solid var(--border-0)' : 'none',
          borderRadius: 'var(--r-sm)',
          color: isPending ? 'var(--fg-2)' : '#fff',
          fontSize: 13, fontWeight: 600,
          cursor: isPending ? 'default' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        <Upload size={14} strokeWidth={2} />
        {isPending ? 'Uploading…' : 'Add CV'}
      </button>
    </div>
  )
}

function CVCard({ cv, isExpanded, onToggleExpand, onDelete, onSetDefault, isPending }: {
  cv: CV
  isExpanded: boolean
  onToggleExpand: () => void
  onDelete: () => void
  onSetDefault: () => void
  isPending: boolean
}) {
  return (
    <div style={{
      background: 'var(--bg-1)', border: '1px solid var(--border-0)',
      borderRadius: 'var(--r-lg)', overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <FileText size={20} strokeWidth={1.75} color="var(--accent)" style={{ flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cv.filename}
            </span>
            {cv.is_default && (
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--accent)',
                background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                padding: '2px 6px', borderRadius: 4, flexShrink: 0,
              }}>
                Default
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            {cv.word_count?.toLocaleString() ?? '—'} words
            {' · '}
            {new Date(cv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {cv.extracted_text && (
            <button onClick={onToggleExpand} style={ghostBtn} title={isExpanded ? 'Hide preview' : 'Show preview'}>
              {isExpanded ? <ChevronUp size={13} strokeWidth={1.75} /> : <ChevronDown size={13} strokeWidth={1.75} />}
            </button>
          )}
          {!cv.is_default && (
            <button onClick={onSetDefault} disabled={isPending} style={ghostBtn} title="Set as default CV">
              <Star size={13} strokeWidth={1.75} />
            </button>
          )}
          <button onClick={onDelete} disabled={isPending} style={{ ...ghostBtn, color: 'var(--danger)' }} title="Delete CV">
            <Trash2 size={13} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {isExpanded && cv.extracted_text && (
        <div style={{ borderTop: '1px solid var(--border-0)', padding: '12px 16px', background: 'var(--bg-2)' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8,
          }}>
            Extracted text preview
          </div>
          <pre style={{
            margin: 0, fontSize: 12, fontFamily: 'var(--font-mono)',
            color: 'var(--fg-1)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            maxHeight: 240, overflow: 'auto',
          }}>
            {cv.extracted_text.slice(0, 800)}{cv.extracted_text.length > 800 ? '…' : ''}
          </pre>
        </div>
      )}
    </div>
  )
}

const ghostBtn: React.CSSProperties = {
  padding: '5px 8px', background: 'transparent', border: '1px solid var(--border-0)',
  borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center',
  gap: 4, fontSize: 12, color: 'var(--fg-2)',
}
