import type { Application } from './types'

const CSV_HEADERS = [
  'Company', 'Role', 'Status', 'Location', 'Remote', 'Contract',
  'Salary', 'Score', 'Source Board', 'URL', 'Applied At', 'Posted At', 'Created At',
]

function escapeCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  return `"${str.replace(/"/g, '""')}"`
}

function applicationToRow(app: Application): string[] {
  return [
    app.company,
    app.role,
    app.status,
    app.location ?? '',
    app.remote_type ?? '',
    app.contract_type ?? '',
    app.salary_range ?? '',
    app.match_score_value !== null && app.match_score_value !== undefined ? String(app.match_score_value) : '',
    app.source_board ?? '',
    app.url ?? '',
    app.applied_at,
    app.posted_at ?? '',
    app.created_at,
  ]
}

export function formatApplicationsCSV(applications: Application[]): string {
  const lines = [
    CSV_HEADERS.map(escapeCell).join(','),
    ...applications.map(app => applicationToRow(app).map(escapeCell).join(',')),
  ]
  return lines.join('\r\n')
}
