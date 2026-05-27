import { describe, it, expect } from 'vitest'
import { formatApplicationsCSV } from '../../lib/csvExport'
import type { Application } from '../../lib/types'

const BASE_APP: Application = {
  id: '1',
  user_id: 'u1',
  company: 'Acme',
  role: 'Engineer',
  url: 'https://example.com/job',
  job_description: null,
  match_score_value: 85,
  match_score: 'high',
  status: 'applied',
  notes: null,
  salary_range: '$100k',
  location: 'NYC',
  remote_type: 'hybrid',
  contract_type: 'full-time',
  source_board: 'LinkedIn',
  applied_at: '2025-01-01T00:00:00Z',
  posted_at: '2024-12-20',
  created_at: '2025-01-01T00:00:00Z',
}

describe('formatApplicationsCSV', () => {
  it('produces a header row with expected columns', () => {
    const csv = formatApplicationsCSV([])
    const header = csv.split('\r\n')[0]
    expect(header).toContain('"Company"')
    expect(header).toContain('"Role"')
    expect(header).toContain('"Source Board"')
    expect(header).toContain('"Score"')
  })

  it('serializes all application fields into the data row', () => {
    const csv = formatApplicationsCSV([BASE_APP])
    const lines = csv.split('\r\n')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain('"Acme"')
    expect(lines[1]).toContain('"Engineer"')
    expect(lines[1]).toContain('"85"')
    expect(lines[1]).toContain('"LinkedIn"')
    expect(lines[1]).toContain('"applied"')
  })

  it('emits empty string for null fields', () => {
    const app: Application = { ...BASE_APP, location: null, source_board: null, salary_range: null }
    const csv = formatApplicationsCSV([app])
    const row = csv.split('\r\n')[1]
    expect(row).toContain('""')
  })

  it('escapes double-quotes inside cell values', () => {
    const app: Application = { ...BASE_APP, company: 'Say "Hello"' }
    const csv = formatApplicationsCSV([app])
    expect(csv).toContain('"Say ""Hello"""')
  })

  it('uses CRLF line endings', () => {
    const csv = formatApplicationsCSV([BASE_APP])
    expect(csv).toContain('\r\n')
  })

  it('produces one row per application', () => {
    const csv = formatApplicationsCSV([BASE_APP, { ...BASE_APP, id: '2', company: 'Beta' }])
    expect(csv.split('\r\n')).toHaveLength(3)
  })
})
