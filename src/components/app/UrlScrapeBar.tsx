'use client'

import { useState, useTransition } from 'react'
import { Link2, Loader2, AlertCircle } from 'lucide-react'
import type { ScrapeResult } from '@/lib/scraper'

interface UrlScrapeBarProps {
  onPrefill: (data: ScrapeResult) => void
}

export function UrlScrapeBar({ onPrefill }: UrlScrapeBarProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleScrape() {
    const trimmed = url.trim()
    if (!trimmed) return
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Scrape failed'); return }
      onPrefill(data as ScrapeResult)
      setUrl('')
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 12px', background: 'var(--bg-1)',
          border: '1px solid var(--border-1)', borderRadius: 'var(--r-sm)',
        }}>
          <Link2 size={13} strokeWidth={1.75} color="var(--fg-3)" />
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleScrape()}
            placeholder="Paste a job URL to auto-fill the form…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, color: 'var(--fg-0)', padding: '8px 0',
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>
        <button
          onClick={handleScrape}
          disabled={isPending || !url.trim()}
          style={{
            padding: '8px 14px', background: 'var(--bg-2)',
            border: '1px solid var(--border-1)', borderRadius: 'var(--r-sm)',
            fontSize: 12, color: 'var(--fg-1)',
            cursor: isPending || !url.trim() ? 'default' : 'pointer',
            opacity: isPending || !url.trim() ? 0.5 : 1,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {isPending && <Loader2 size={13} strokeWidth={1.75} style={{ animation: 'spin 1s linear infinite' }} />}
          {isPending ? 'Importing…' : 'Import'}
        </button>
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--danger)' }}>
          <AlertCircle size={12} strokeWidth={1.75} />
          {error}
        </div>
      )}
    </div>
  )
}
