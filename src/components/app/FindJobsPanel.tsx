'use client'

import { useState, useRef } from 'react'
import { Search, X, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import type { ScanEvent } from '@/lib/findJobs'

type SourceStatus = 'scanning' | 'done'
type Source = { name: string; count: number; status: SourceStatus }
type Match  = { company: string; role: string; location: string; score: number | null }

type PanelState =
  | { mode: 'idle' }
  | { mode: 'scanning'; stepLabel: string; stepN: number; stepOf: number; sources: Source[]; matches: Match[]; total: number }
  | { mode: 'done';     sources: Source[]; matches: Match[]; saved: number; total: number }
  | { mode: 'error';    code: string; message: string }

interface FindJobsPanelProps {
  onClose: () => void
  onDone:  () => void   // called after done so Applications can reload
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

function scoreColor(score: number | null) {
  if (score === null) return 'var(--fg-3)'
  if (score >= 70) return 'var(--success, #16a34a)'
  if (score >= 40) return 'var(--warning, #d97706)'
  return 'var(--danger)'
}

export function FindJobsPanel({ onClose, onDone }: FindJobsPanelProps) {
  const [state, setState] = useState<PanelState>({ mode: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  async function startScan() {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setState({ mode: 'scanning', stepLabel: 'Starting…', stepN: 0, stepOf: 4, sources: [], matches: [], total: 0 })

    try {
      const res = await fetch('/api/find-jobs', { signal: ctrl.signal })

      if (res.status === 422) {
        const body = await res.json()
        setState({ mode: 'error', code: body.error, message: body.message })
        return
      }
      if (!res.ok) {
        setState({ mode: 'error', code: 'http_error', message: `HTTP ${res.status}` })
        return
      }

      const reader = res.body!.getReader()
      const dec    = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const chunks = buf.split('\n\n')
        buf = chunks.pop() ?? ''

        for (const chunk of chunks) {
          const line = chunk.replace(/^data: /, '').trim()
          if (!line) continue
          let event: ScanEvent
          try { event = JSON.parse(line) } catch { continue }
          handleEvent(event)
        }
      }
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') return
      setState({ mode: 'error', code: 'network', message: 'Connection error. Is the server running?' })
    }
  }

  function handleEvent(event: ScanEvent) {
    setState(prev => {
      if (event.type === 'error') {
        return { mode: 'error', code: event.code, message: event.message }
      }

      if (event.type === 'step') {
        if (prev.mode !== 'scanning') return prev
        return { ...prev, stepLabel: event.label, stepN: event.n, stepOf: event.of }
      }

      if (event.type === 'source') {
        if (prev.mode !== 'scanning') return prev
        const updated = prev.sources.filter(s => s.name !== event.name)
        updated.push({ name: event.name, count: event.count, status: 'done' })
        return { ...prev, sources: updated, total: prev.total + event.count }
      }

      if (event.type === 'match') {
        if (prev.mode !== 'scanning') return prev
        return { ...prev, matches: [...prev.matches, { company: event.company, role: event.role, location: event.location, score: event.score }] }
      }

      if (event.type === 'done') {
        if (prev.mode !== 'scanning') return prev
        onDone()
        return { mode: 'done', sources: prev.sources, matches: prev.matches, saved: event.saved, total: event.total }
      }

      return prev
    })
  }

  function cancel() {
    abortRef.current?.abort()
    setState({ mode: 'idle' })
  }

  const isScanning = state.mode === 'scanning'
  const sources    = state.mode === 'scanning' || state.mode === 'done' ? state.sources : []
  const matches    = state.mode === 'scanning' || state.mode === 'done' ? state.matches : []
  const progress   = state.mode === 'scanning' ? (state.stepN / state.stepOf) * 100 : state.mode === 'done' ? 100 : 0

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'var(--bg-0)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', borderBottom: '1px solid var(--border-0)',
        position: 'sticky', top: 0, background: 'var(--bg-0)', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {(isScanning || state.mode === 'done') && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
              SCAN · {sources.length} {sources.length === 1 ? 'BOARD' : 'BOARDS'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {(isScanning || state.mode === 'done') && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)' }}>
              {state.mode === 'done'
                ? `${state.saved} saved · ${state.total} unique`
                : `${(state as { stepN: number }).stepN} of ${(state as { stepOf: number }).stepOf} steps · ${(state as { total: number }).total} unique`}
            </span>
          )}
          {isScanning && (
            <button onClick={cancel} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-1)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--fg-2)', cursor: 'pointer' }}>
              Cancel
            </button>
          )}
          <button onClick={onClose} style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', borderRadius: 'var(--r-sm)' }}>
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {(isScanning || state.mode === 'done') && (
        <div style={{ height: 3, background: 'var(--border-0)', position: 'relative' }}>
          <div style={{
            height: '100%', background: 'var(--accent)',
            width: `${progress}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      )}

      <div style={{ flex: 1, padding: '40px 32px', maxWidth: 960, margin: '0 auto', width: '100%' }}>

        {/* Idle state */}
        {state.mode === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 60 }}>
            <div style={{ width: 64, height: 64, background: 'var(--accent)', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
              <Search size={28} strokeWidth={1.75} color="#fff" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px', color: 'var(--fg-0)' }}>
                Find matching jobs
              </h1>
              <p style={{ fontSize: 14, color: 'var(--fg-2)', margin: 0, lineHeight: 1.6 }}>
                Search across job boards for roles that match your CV.<br />
                Top matches are scored and saved to your Applications.
              </p>
            </div>
            <button
              onClick={startScan}
              style={{
                padding: '12px 28px', background: 'var(--accent)', border: 'none',
                borderRadius: 'var(--r-sm)', color: '#fff', fontSize: 14,
                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Search size={16} strokeWidth={2} />
              Start scan
            </button>
          </div>
        )}

        {/* Error state */}
        {state.mode === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 60 }}>
            <AlertCircle size={40} strokeWidth={1.5} color="var(--danger)" />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-0)', margin: '0 0 6px' }}>
                {state.message}
              </p>
              <p style={{ fontSize: 12, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                {state.code}
              </p>
            </div>
            <button
              onClick={() => setState({ mode: 'idle' })}
              style={{ padding: '8px 20px', background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-sm)', fontSize: 13, cursor: 'pointer', color: 'var(--fg-1)' }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Scanning / Done state */}
        {(isScanning || state.mode === 'done') && (
          <>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 6px', color: 'var(--fg-0)' }}>
                {state.mode === 'done' ? 'Scan complete' : 'Scanning for matches…'}
              </h1>
              {isScanning && (
                <p style={{ fontSize: 13, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', margin: 0, letterSpacing: '0.02em' }}>
                  {(state as { stepLabel: string }).stepLabel}
                </p>
              )}
              {state.mode === 'done' && (
                <p style={{ fontSize: 14, color: 'var(--fg-2)', margin: 0 }}>
                  Found <strong>{state.total}</strong> unique listings · saved top <strong>{state.saved}</strong> to Applications
                </p>
              )}
            </div>

            {/* Source boards grid */}
            {sources.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 10,
                marginBottom: 32,
              }}>
                {sources.map(src => (
                  <SourceCard key={src.name} source={src} scanning={isScanning} />
                ))}
                {/* Queued placeholder if still scanning */}
                {isScanning && (
                  <div style={{
                    padding: '14px 16px', background: 'var(--bg-1)',
                    border: '1px solid var(--border-0)', borderRadius: 'var(--r-md)',
                    opacity: 0.5,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)', marginBottom: 4 }}>…</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Queued</div>
                  </div>
                )}
              </div>
            )}

            {/* Results list */}
            {matches.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {matches.map((m, i) => (
                  <MatchCard key={i} match={m} />
                ))}
              </div>
            )}

            {/* Done actions */}
            {state.mode === 'done' && (
              <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '9px 20px', background: 'var(--accent)', border: 'none',
                    borderRadius: 'var(--r-sm)', color: '#fff', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  View Applications
                </button>
                <button
                  onClick={() => setState({ mode: 'idle' })}
                  style={{
                    padding: '9px 20px', background: 'transparent',
                    border: '1px solid var(--border-1)', borderRadius: 'var(--r-sm)',
                    fontSize: 13, color: 'var(--fg-1)', cursor: 'pointer',
                  }}
                >
                  Scan again
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SourceCard({ source, scanning }: { source: Source; scanning: boolean }) {
  return (
    <div style={{
      padding: '14px 16px',
      background: 'var(--bg-1)',
      border: '1px solid var(--border-0)',
      borderRadius: 'var(--r-md)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>{source.name}</span>
        {source.status === 'done'
          ? <CheckCircle2 size={14} strokeWidth={2} color="var(--success, #16a34a)" />
          : <Clock size={14} strokeWidth={1.75} color="var(--fg-3)" />}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--fg-0)', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {source.count}
      </div>
      <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 3 }}>
        {scanning ? 'so far…' : 'listings'}
      </div>
    </div>
  )
}

function MatchCard({ match }: { match: Match }) {
  const abbr = initials(match.company)
  const hue  = Math.abs(match.company.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 18px',
      background: 'var(--bg-1)',
      border: '1px solid var(--border-0)',
      borderRadius: 'var(--r-md)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: `hsl(${hue}, 60%, 35%)`,
        display: 'grid', placeItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{abbr}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-0)', marginBottom: 2 }}>{match.role}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>
          {match.company}{match.location ? ` · ${match.location}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {match.score !== null && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: scoreColor(match.score) }}>
            {(match.score / 100).toFixed(2)}
          </span>
        )}
        <span style={{
          padding: '3px 8px', borderRadius: 4,
          fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
          fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
          background: 'var(--accent-subtle, rgba(255,107,53,0.1))',
          color: 'var(--accent)',
        }}>
          READY
        </span>
      </div>
    </div>
  )
}
