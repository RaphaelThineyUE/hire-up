'use client'

import { useState, useRef, useTransition } from 'react'
import { Search, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react'
import { listFoundApplications, bulkApplyByScore } from '@/actions/scan'
import { ScanJobFlyout } from './ScanJobFlyout'
import type { ScanEvent } from '@/lib/findJobs'
import type { Application } from '@/lib/types'

type Board = { name: string; count: number }
type MatchCard = { company: string; role: string; location: string; score: number | null }

type PageState =
  | { mode: 'idle' }
  | { mode: 'scanning'; query: string; stepN: number; stepOf: number; stepLabel: string; boards: Board[]; matches: MatchCard[]; total: number }
  | { mode: 'done'; query: string; boards: Board[]; results: Application[]; saved: number; total: number }
  | { mode: 'error'; code: string; message: string }

const APPLY_THRESHOLD = 85

function companyHue(name: string) {
  return Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
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
  if (h < 24) return `${h || 1}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function ScanPage() {
  const [state, setState] = useState<PageState>({ mode: 'idle' })
  const [selected, setSelected] = useState<Application | null>(null)
  const [applying, startApply] = useTransition()
  const abortRef = useRef<AbortController | null>(null)

  async function startScan() {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    let query = ''
    let boards: Board[] = []
    let matches: MatchCard[] = []
    let total = 0
    let savedCount = 0

    setState({ mode: 'scanning', query, stepN: 0, stepOf: 4, stepLabel: 'Starting…', boards, matches, total })

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

      if (!res.body) {
        setState({ mode: 'error', code: 'no_body', message: 'Empty response from server.' })
        return
      }
      const reader = res.body.getReader()
      const dec = new TextDecoder()
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

          if (event.type === 'error') {
            setState({ mode: 'error', code: event.code, message: event.message })
            return
          }
          if (event.type === 'step') {
            setState(prev => prev.mode === 'scanning'
              ? { ...prev, stepN: event.n, stepOf: event.of, stepLabel: event.label }
              : prev)
          }
          if (event.type === 'query') {
            query = event.text
            setState(prev => prev.mode === 'scanning' ? { ...prev, query } : prev)
          }
          if (event.type === 'source') {
            const existing = boards.find(b => b.name === event.name)
            total += event.count - (existing?.count ?? 0)
            boards = [...boards.filter(b => b.name !== event.name), { name: event.name, count: event.count }]
            setState(prev => prev.mode === 'scanning' ? { ...prev, boards, total } : prev)
          }
          if (event.type === 'match') {
            matches = [...matches, { company: event.company, role: event.role, location: event.location, score: event.score }]
            setState(prev => prev.mode === 'scanning' ? { ...prev, matches } : prev)
          }
          if (event.type === 'done') {
            savedCount = event.saved
          }
        }
      }

      const results = await listFoundApplications()
      setState({ mode: 'done', query, boards, results, saved: savedCount, total })

    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') return
      console.error('[ScanPage] SSE stream error:', e)
      setState({ mode: 'error', code: 'network', message: 'Connection error. Is the server running?' })
    }
  }

  function cancel() {
    abortRef.current?.abort()
    setState({ mode: 'idle' })
  }

  function handleApplyAll() {
    startApply(async () => {
      await bulkApplyByScore(APPLY_THRESHOLD)
      setState(prev => prev.mode === 'done'
        ? { ...prev, results: prev.results.filter(r => (r.match_score_value ?? 0) < APPLY_THRESHOLD) }
        : prev)
    })
  }

  function handleStatusChange(id: string) {
    setState(prev => prev.mode === 'done'
      ? { ...prev, results: prev.results.filter(r => r.id !== id) }
      : prev)
    setSelected(null)
  }

  const boards = state.mode === 'scanning' || state.mode === 'done' ? state.boards : []
  const isScanning = state.mode === 'scanning'
  const progress = state.mode === 'scanning'
    ? (state.stepN / state.stepOf) * 100
    : state.mode === 'done' ? 100 : 0

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Idle */}
      {state.mode === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 80 }}>
          <div style={{ width: 64, height: 64, background: 'var(--accent)', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
            <Search size={28} strokeWidth={1.75} color="#fff" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px', color: 'var(--fg-0)' }}>
              Find matching jobs
            </h1>
            <p style={{ fontSize: 14, color: 'var(--fg-2)', margin: 0, lineHeight: 1.6 }}>
              Search across job boards for roles that match your CV.<br />
              Top matches are scored and saved to Applications.
            </p>
          </div>
          <button
            onClick={startScan}
            style={{ padding: '12px 28px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--r-sm)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Search size={16} strokeWidth={2} /> Start scan
          </button>
        </div>
      )}

      {/* Error */}
      {state.mode === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 80 }}>
          <AlertCircle size={40} strokeWidth={1.5} color="var(--danger)" />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-0)', margin: '0 0 6px' }}>{state.message}</p>
            <p style={{ fontSize: 12, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', margin: 0 }}>{state.code}</p>
          </div>
          <button
            onClick={() => setState({ mode: 'idle' })}
            style={{ padding: '8px 20px', background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-sm)', fontSize: 13, cursor: 'pointer', color: 'var(--fg-1)' }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Scanning / Done */}
      {(isScanning || state.mode === 'done') && (
        <>
          {/* Header */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
              <span>SCAN · {boards.length} BOARDS</span>
              {state.mode === 'scanning' && <span>{state.stepN} of {state.stepOf} steps · {state.total} found</span>}
              {state.mode === 'done' && <span>{state.saved} saved · {state.total} found</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 6px', color: 'var(--fg-0)' }}>
                  {state.mode === 'done' ? 'Scan complete' : 'Scanning for matches…'}
                </h1>
                {(state.mode === 'scanning' || state.mode === 'done') && state.query && (
                  <p style={{ fontSize: 13, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', margin: 0, letterSpacing: '0.02em' }}>
                    Query · {state.query}
                  </p>
                )}
              </div>
              {isScanning && (
                <button onClick={cancel} style={{ flexShrink: 0, padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-1)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--fg-1)', cursor: 'pointer' }}>
                  Cancel
                </button>
              )}
              {state.mode === 'done' && (
                <button onClick={() => setState({ mode: 'idle' })} style={{ flexShrink: 0, padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-1)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--fg-1)', cursor: 'pointer' }}>
                  Scan again
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 2, background: 'var(--border-0)', borderRadius: 1, margin: '16px 0 24px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--accent)', width: `${progress}%`, transition: 'width 0.4s ease', borderRadius: 1 }} />
          </div>

          {/* Board grid */}
          {boards.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 32 }}>
              {boards.map(b => (
                <div key={b.name} style={{ padding: '12px 14px', background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>{b.name}</span>
                    <CheckCircle2 size={13} strokeWidth={2} color="var(--success, #16a34a)" />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: 'var(--fg-0)' }}>{b.count}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>
                    {isScanning ? 'so far…' : 'listings'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Live match cards (scanning) */}
          {state.mode === 'scanning' && state.matches.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-1)', margin: '0 0 8px', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
                Matches so far · {state.matches.length}
              </h2>
              {state.matches.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-md)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: `hsl(${companyHue(m.company)}, 60%, 35%)`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{initials(m.company)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>{m.role}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>{m.company}{m.location ? ` · ${m.location}` : ''}</div>
                  </div>
                  {m.score !== null && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: scoreColor(m.score), flexShrink: 0 }}>
                      Match {(m.score / 100).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Done results list */}
          {state.mode === 'done' && state.results.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0, color: 'var(--fg-0)' }}>
                  Results · {state.results.length}
                </h2>
                <button
                  onClick={handleApplyAll}
                  disabled={applying}
                  style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--r-sm)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: applying ? 'default' : 'pointer', opacity: applying ? 0.6 : 1 }}
                >
                  Apply to all ≥ {(APPLY_THRESHOLD / 100).toFixed(2)}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {state.results.map(app => (
                  <button
                    key={app.id}
                    onClick={() => setSelected(app)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-md)', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background var(--t-fast) var(--ease-out)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-1)')}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `hsl(${companyHue(app.company)}, 60%, 35%)`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{initials(app.company)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-0)', marginBottom: 2 }}>{app.role}</div>
                      <div style={{ fontSize: 12, color: 'var(--fg-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {app.company}{app.location ? ` · ${app.location}` : ''}
                        {app.salary_range ? ` · ${app.salary_range}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                      {app.match_score_value !== null && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: scoreColor(app.match_score_value), display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: scoreColor(app.match_score_value), display: 'inline-block' }} />
                          Match {(app.match_score_value / 100).toFixed(2)}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{relativeTime(app.created_at)}</span>
                    </div>
                    <ChevronRight size={16} strokeWidth={1.75} color="var(--fg-3)" style={{ flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.mode === 'done' && state.results.length === 0 && (
            <p style={{ color: 'var(--fg-2)', fontSize: 14, marginTop: 8 }}>No new matches to review.</p>
          )}
        </>
      )}

      {selected && (
        <ScanJobFlyout
          application={selected}
          onClose={() => setSelected(null)}
          onApplied={handleStatusChange}
        />
      )}
    </div>
  )
}
