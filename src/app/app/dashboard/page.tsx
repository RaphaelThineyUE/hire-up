import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StatCard } from '@/components/app/StatCard'
import { Chip } from '@/components/app/Chip'
import { ScoreBadge } from '@/components/app/ScoreBadge'
import type { Application, DashboardStats } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: apps } = await supabase
    .from('applications')
    .select('id,company,role,status,match_score_value,match_score,applied_at,created_at')
    .order('created_at', { ascending: false })

  const all: Application[] = (apps ?? []) as Application[]

  const stats: DashboardStats = {
    total:        all.length,
    found:        all.filter(a => a.status === 'found').length,
    applied:      all.filter(a => a.status === 'applied').length,
    interviewing: all.filter(a => a.status === 'interviewing').length,
    offer:        all.filter(a => a.status === 'offer').length,
    rejected:     all.filter(a => a.status === 'rejected').length,
  }

  const recent = all.slice(0, 10)

  return (
    <div style={{ padding: 32, maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
          Overview
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--fg-0)' }}>
          Dashboard
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatCard label="Total"        value={stats.total}        />
        <StatCard label="Found"        value={stats.found}        />
        <StatCard label="Applied"      value={stats.applied}      />
        <StatCard label="Interviewing" value={stats.interviewing} tone="info"    />
        <StatCard label="Offer"        value={stats.offer}        tone="success" />
        <StatCard label="Rejected"     value={stats.rejected}     tone="danger"  />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, color: 'var(--fg-0)' }}>
            Recent applications
          </h2>
          <Link href="/app/applications" style={{ fontSize: 13, color: 'var(--fg-1)', textDecoration: 'underline', textDecorationColor: 'var(--border-1)' }}>
            See all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--fg-3)', fontSize: 14 }}>
            No applications yet. Add one from the Applications page.
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-1)', border: '1px solid var(--border-0)',
            borderRadius: 'var(--r-lg)', overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Role', 'Status', 'Score', 'Applied'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 16px',
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
                      letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)',
                      background: 'var(--bg-2)', borderBottom: '1px solid var(--border-0)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((app, i) => (
                  <tr key={app.id} style={{ borderBottom: i < recent.length - 1 ? '1px solid var(--border-0)' : 'none' }}>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--fg-0)' }}>{app.role}</div>
                      <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 1 }}>{app.company}</div>
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <Chip status={app.status} />
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <ScoreBadge value={app.match_score_value} />
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)' }}>
                      {app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
