'use client'

import { useEffect, useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { ApplicationsTable } from '@/components/app/ApplicationsTable'
import { SlideOver } from '@/components/app/SlideOver'
import { ApplicationDetail } from '@/components/app/ApplicationDetail'
import { ApplicationForm } from '@/components/app/ApplicationForm'
import { listApplications } from '@/actions/applications'
import type { Application } from '@/lib/types'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [selected, setSelected] = useState<Application | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [, startTransition] = useTransition()

  function reload() {
    startTransition(async () => {
      const data = await listApplications()
      setApplications(data)
    })
  }

  useEffect(() => { reload() }, [])

  return (
    <div style={{ padding: 32, maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
            Submissions ledger
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: 'var(--fg-0)' }}>
            Applications
          </h1>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', background: 'var(--accent)',
            border: 'none', borderRadius: 'var(--r-sm)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} strokeWidth={2} /> Add application
        </button>
      </div>

      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        <ApplicationsTable
          applications={applications}
          onRowClick={setSelected}
        />
      </div>

      <SlideOver
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.role} · ${selected.company}` : ''}
      >
        {selected && (
          <ApplicationDetail
            application={selected}
            onClose={() => { setSelected(null); reload() }}
          />
        )}
      </SlideOver>

      <SlideOver open={addOpen} onClose={() => setAddOpen(false)} title="New application">
        <ApplicationForm mode="create" onDone={() => { setAddOpen(false); reload() }} />
      </SlideOver>
    </div>
  )
}
