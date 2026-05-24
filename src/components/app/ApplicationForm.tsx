'use client'

import { useTransition } from 'react'
import { createApplication, updateApplication } from '@/actions/applications'
import type { Application, ApplicationStatus, RemoteType, ContractType } from '@/lib/types'

interface ApplicationFormProps {
  initial?: Partial<Application>
  onDone?: () => void
  mode: 'create' | 'edit'
}

const STATUS_OPTIONS: ApplicationStatus[] = ['found', 'applied', 'interviewing', 'offer', 'rejected']
const REMOTE_OPTIONS: Array<{ value: RemoteType; label: string }> = [
  { value: null, label: '—' }, { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' }, { value: 'onsite', label: 'On-site' },
]
const CONTRACT_OPTIONS: Array<{ value: ContractType; label: string }> = [
  { value: null, label: '—' }, { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' }, { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', boxSizing: 'border-box',
  background: 'var(--bg-0)', border: '1px solid var(--border-1)',
  borderRadius: 'var(--r-sm)', color: 'var(--fg-0)', fontSize: 13,
  outline: 'none', fontFamily: 'var(--font-body)',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)',
  letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--fg-3)',
  marginBottom: 4,
}

export function ApplicationForm({ initial, onDone, mode }: ApplicationFormProps) {
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (mode === 'create') {
        await createApplication(formData)
      } else if (initial?.id) {
        await updateApplication(initial.id, {
          company:         formData.get('company') as string,
          role:            formData.get('role') as string,
          url:             (formData.get('url') as string) || null,
          job_description: (formData.get('job_description') as string) || null,
          status:          formData.get('status') as ApplicationStatus,
          notes:           (formData.get('notes') as string) || null,
          salary_range:    (formData.get('salary_range') as string) || null,
          location:        (formData.get('location') as string) || null,
          remote_type:     (formData.get('remote_type') as string) as RemoteType || null,
          contract_type:   (formData.get('contract_type') as string) as ContractType || null,
          posted_at:       (formData.get('posted_at') as string) || null,
        })
      }
      onDone?.()
    })
  }

  function Field({ name, label, required }: { name: string; label: string; required?: boolean }) {
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <input name={name} defaultValue={initial?.[name as keyof Application] as string ?? ''} required={required} style={inputStyle} />
      </div>
    )
  }

  return (
    <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field name="company" label="Company" required />
        <Field name="role"    label="Role"    required />
      </div>

      <Field name="url" label="Job URL" />

      <div>
        <label style={labelStyle}>Status</label>
        <select name="status" defaultValue={initial?.status ?? 'applied'} style={{ ...inputStyle, appearance: 'none' }}>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Remote</label>
          <select name="remote_type" defaultValue={initial?.remote_type ?? ''} style={{ ...inputStyle, appearance: 'none' }}>
            {REMOTE_OPTIONS.map(o => <option key={String(o.value)} value={o.value ?? ''}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Contract</label>
          <select name="contract_type" defaultValue={initial?.contract_type ?? ''} style={{ ...inputStyle, appearance: 'none' }}>
            {CONTRACT_OPTIONS.map(o => <option key={String(o.value)} value={o.value ?? ''}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field name="salary_range" label="Salary range" />
        <Field name="location"     label="Location"     />
      </div>

      <Field name="posted_at" label="Posted at (YYYY-MM-DD)" />

      <div>
        <label style={labelStyle}>Notes</label>
        <textarea name="notes" defaultValue={initial?.notes ?? ''} rows={3}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
      </div>

      <div>
        <label style={labelStyle}>Job description</label>
        <textarea name="job_description" defaultValue={initial?.job_description ?? ''} rows={6}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
        <button
          type="button"
          onClick={onDone}
          style={{
            padding: '8px 16px', background: 'transparent',
            border: '1px solid var(--border-1)', borderRadius: 'var(--r-sm)',
            color: 'var(--fg-1)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '8px 16px', background: 'var(--accent)',
            border: 'none', borderRadius: 'var(--r-sm)',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: isPending ? 'default' : 'pointer', opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? 'Saving…' : mode === 'create' ? 'Add application' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
