'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload, FileText, Trash2 } from 'lucide-react'
import { uploadCV, deleteCV } from '@/actions/cv'
import type { CV } from '@/lib/types'

interface CVUploadFormProps {
  currentCV: CV | null
}

export function CVUploadForm({ currentCV }: CVUploadFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await uploadCV(formData)
      if (result.error) setError(result.error)
    })
  }

  async function handleDelete() {
    if (!confirm('Remove your CV?')) return
    startTransition(async () => { await deleteCV() })
  }

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {currentCV ? (
        <div style={{
          background: 'var(--bg-1)', border: '1px solid var(--border-0)',
          borderRadius: 'var(--r-lg)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={20} strokeWidth={1.75} color="var(--accent)" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-0)' }}>{currentCV.filename}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                  {currentCV.word_count?.toLocaleString() ?? '—'} words
                  {' · '}uploaded {new Date(currentCV.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
            <button
              onClick={handleDelete}
              disabled={isPending}
              style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--danger)' }}
            >
              <Trash2 size={13} strokeWidth={1.75} />
            </button>
          </div>

          {currentCV.extracted_text && (
            <div>
              <div style={sectionLabel}>Extracted text preview</div>
              <pre style={{
                margin: 0, padding: '12px 14px',
                background: 'var(--bg-2)', border: '1px solid var(--border-0)',
                borderRadius: 'var(--r-sm)', fontSize: 12, fontFamily: 'var(--font-mono)',
                color: 'var(--fg-1)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxHeight: 200, overflow: 'auto',
              }}>
                {currentCV.extracted_text.slice(0, 500)}{currentCV.extracted_text.length > 500 ? '…' : ''}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-lg)', padding: 20, color: 'var(--fg-2)', fontSize: 13 }}>
          No CV uploaded yet.
        </div>
      )}

      <div>
        <div style={sectionLabel}>{currentCV ? 'Replace CV' : 'Upload CV'}</div>
        <form action={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input ref={fileRef} name="cv" type="file" accept=".pdf,.docx" required
            style={{ fontSize: 13, color: 'var(--fg-1)' }} />
          {error && <p style={{ margin: 0, fontSize: 13, color: 'var(--danger)' }}>{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: 'var(--accent)', border: 'none', borderRadius: 'var(--r-sm)',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: isPending ? 'default' : 'pointer', opacity: isPending ? 0.6 : 1,
              alignSelf: 'flex-start',
            }}
          >
            <Upload size={14} strokeWidth={2} />
            {isPending ? 'Uploading…' : currentCV ? 'Replace CV' : 'Upload CV'}
          </button>
        </form>
      </div>
    </div>
  )
}
