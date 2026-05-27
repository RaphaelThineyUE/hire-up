import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserSettings } from './types'
import { decrypt } from './crypto'
import { extractJobTitles, batchMatchScore } from './ai'
import { searchJobs } from './jobSearch'

export type ScanEvent =
  | { type: 'step';   n: number; of: number; label: string }
  | { type: 'query';  text: string }
  | { type: 'source'; name: string; count: number }
  | { type: 'match';  company: string; role: string; location: string; score: number | null; url: string | null; posted_at: string | null; publisher: string | null }
  | { type: 'done';   saved: number; total: number }
  | { type: 'error';  code: string; message: string }

function mapContract(type: string | null) {
  if (!type) return null
  const t = type.toUpperCase()
  if (t.includes('FULL'))    return 'full-time' as const
  if (t.includes('PART'))    return 'part-time' as const
  if (t.includes('CONTRACT') || t === 'CONTRACTOR') return 'contract' as const
  if (t.includes('INTERN'))  return 'internship' as const
  return null
}

export async function findJobs(
  supabase: SupabaseClient,
  userId: string,
  settings: UserSettings,
  cvText: string,
  emit: (e: ScanEvent) => void,
): Promise<void> {
  if (!settings.jsearch_api_key_enc) {
    emit({ type: 'error', code: 'no_jsearch_key', message: 'Add a JSearch API key in Settings → Job Search.' })
    return
  }

  const apiKey = decrypt(settings.jsearch_api_key_enc)

  // Step 1/4: Extract job titles (or use override)
  let query = settings.jsearch_query_override?.trim() || ''
  if (!query) {
    emit({ type: 'step', n: 1, of: 4, label: 'Extracting job titles from CV…' })
    const titles = await extractJobTitles(cvText, settings)
    query = titles.length ? titles.join(' OR ') : 'software engineer'
  }

  emit({ type: 'query', text: query })

  // Step 2/4: Search JSearch API
  emit({ type: 'step', n: 2, of: 4, label: 'Searching job boards…' })
  let raw
  try {
    raw = await searchJobs(query, apiKey, {
      num_pages:        settings.jsearch_num_pages    || '2',
      country:          settings.jsearch_country      || 'us',
      language:         settings.jsearch_language     || '',
      location:         settings.jsearch_location     || '',
      date_posted:      settings.jsearch_date_posted  || 'month',
      work_from_home:   settings.jsearch_work_from_home,
      employment_types: settings.jsearch_employment_types || '',
      job_requirements: settings.jsearch_job_requirements || '',
      radius:           settings.jsearch_radius       || '',
    })
  } catch (e: unknown) {
    const code = e instanceof Error ? e.message : 'jsearch_error'
    emit({ type: 'error', code, message: 'Job board search failed. Check your JSearch API key.' })
    return
  }

  if (!raw.length) {
    emit({ type: 'error', code: 'jsearch_no_results', message: 'No results from job boards for this query.' })
    return
  }

  // Deduplicate against existing applications
  const { data: existing } = await supabase
    .from('applications')
    .select('url')
    .eq('user_id', userId)
    .not('url', 'is', null)
  const seen = new Set((existing ?? []).map((r: { url: string }) => r.url))

  const excluded = (settings.jsearch_exclude_publishers || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

  const fresh = raw.filter(j =>
    j.job_apply_link &&
    !seen.has(j.job_apply_link) &&
    !excluded.includes((j.job_publisher ?? '').toLowerCase()),
  )

  if (!fresh.length) {
    emit({ type: 'error', code: 'all_duplicates', message: 'All found jobs are already in your tracker.' })
    return
  }

  // Emit per-publisher source counts
  const byPublisher: Record<string, number> = {}
  for (const j of fresh) {
    const pub = j.job_publisher || 'Other'
    byPublisher[pub] = (byPublisher[pub] || 0) + 1
  }
  for (const [name, count] of Object.entries(byPublisher)) {
    emit({ type: 'source', name, count })
  }

  const candidates = fresh.slice(0, settings.find_jobs_candidates || 25)

  // Step 3/4: Score candidates
  emit({ type: 'step', n: 3, of: 4, label: 'Scoring matches against your CV…' })
  let scored: Array<{ job: typeof candidates[number]; score: number | null }>
  try {
    const scores = await batchMatchScore(
      cvText,
      candidates.map((j, i) => ({
        index: i,
        title: j.job_title,
        company: j.employer_name,
        descriptionSnippet: (j.job_description || '').slice(0, 300),
      })),
      settings,
    )
    scored = candidates.map((job, i) => ({
      job,
      score: scores.find(s => s.index === i)?.score ?? null,
    }))
  } catch {
    scored = candidates.map(job => ({ job, score: null }))
  }

  scored.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))

  const toSave = scored.slice(0, settings.find_jobs_save_count || 10)

  for (const { job, score } of toSave) {
    emit({
      type: 'match',
      company: job.employer_name,
      role:    job.job_title,
      location: [job.job_city, job.job_country].filter(Boolean).join(', '),
      score,
      url:       job.job_apply_link || null,
      posted_at: job.job_posted_at_datetime_utc
        ? job.job_posted_at_datetime_utc.split('T')[0]
        : null,
      publisher: job.job_publisher || null,
    })
  }

  // Step 4/4: Insert into DB
  emit({ type: 'step', n: 4, of: 4, label: 'Saving top matches…' })
  const rows = toSave.map(({ job, score }) => ({
    user_id: userId,
    company: job.employer_name,
    role: job.job_title,
    url: job.job_apply_link || null,
    job_description: (job.job_description || '').slice(0, 5000) || null,
    match_score_value: score,
    status: 'found',
    location: [job.job_city, job.job_country].filter(Boolean).join(', ') || null,
    remote_type: job.job_is_remote ? 'remote' : null,
    contract_type: mapContract(job.job_employment_type),
    source_board: job.job_publisher || null,
    posted_at: job.job_posted_at_datetime_utc
      ? job.job_posted_at_datetime_utc.split('T')[0]
      : null,
  }))

  await supabase.from('applications').insert(rows)

  emit({ type: 'done', saved: toSave.length, total: fresh.length })
}
