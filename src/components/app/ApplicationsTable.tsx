'use client'

import { useState } from 'react'
import { Chip } from './Chip'
import { ScoreBadge } from './ScoreBadge'
import type { Application, ApplicationStatus } from '@/lib/types'
import { ChevronRight } from 'lucide-react'

type Filter = 'all' | ApplicationStatus

const STATUS_ORDER: ApplicationStatus[] = ['found', 'applied', 'interviewing', 'offer', 'rejected']

interface ApplicationsTableProps {
  applications: Application[]
  onRowClick: (app: Application) => void
}

export function ApplicationsTable({ applications, onRowClick }: ApplicationsTableProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [sortKey, setSortKey] = useState<'created_at' | 'match_score_value' | 'company'>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const counts: Record<Filter, number> = {
    all: applications.length,
    found: 0, applied: 0, interviewing: 0, offer: 0, rejected: 0,
  }
  applications.forEach(a => { counts[a.status] = (counts[a.status] ?? 0) + 1 })

  const visible = (filter === 'all' ? applications : applications.filter(a => a.status === filter))
    .slice()
    .sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '10px 16px',
    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
    letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)',
    background: 'var(--bg-2)', borderBottom: '1px solid var(--border-0)',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-0)' }}>
        {(['all', ...STATUS_ORDER] as Filter[]).map(f => (
          <div
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '10px 14px 12px', cursor: 'pointer',
              fontSize: 13.5, fontWeight: 500,
              color: filter === f ? 'var(--fg-0)' : 'var(--fg-2)',
              borderBottom: filter === f ? '2px solid var(--fg-0)' : '2px solid transparent',
              marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
              textTransform: 'capitalize',
            }}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
              {counts[f]}
            </span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-1)', borderTop: 'none', overflow: 'hidden' }}>
        {visible.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--fg-3)', fontSize: 14 }}>
            No applications yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '38%' }} onClick={() => toggleSort('company')}>
                  Role {sortKey === 'company' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={thStyle}>Status</th>
                <th style={thStyle} onClick={() => toggleSort('match_score_value')}>
                  Score {sortKey === 'match_score_value' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={thStyle}>Location</th>
                <th style={thStyle} onClick={() => toggleSort('created_at')}>
                  Added {sortKey === 'created_at' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={thStyle} />
              </tr>
            </thead>
            <tbody>
              {visible.map(app => (
                <tr
                  key={app.id}
                  onClick={() => onRowClick(app)}
                  style={{ cursor: 'pointer', transition: 'background var(--t-fast) var(--ease-out)', borderBottom: '1px solid var(--border-0)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 'var(--r-xs)',
                        background: 'var(--bg-inverse)', color: 'var(--accent-bg)',
                        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12,
                        display: 'grid', placeItems: 'center', flexShrink: 0,
                      }}>
                        {app.company.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--fg-0)' }}>{app.role}</div>
                        <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 1 }}>{app.company}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}><Chip status={app.status} /></td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}><ScoreBadge value={app.match_score_value} /></td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: 12, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>
                    {app.location ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)' }}>
                    {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                    <ChevronRight size={16} strokeWidth={1.75} color="var(--fg-3)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
