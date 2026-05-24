export interface JSearchJob {
  job_id: string
  employer_name: string
  job_title: string
  job_apply_link: string
  job_description: string
  job_city: string | null
  job_country: string | null
  job_is_remote: boolean
  job_employment_type: string | null
  job_posted_at_datetime_utc: string | null
  job_publisher: string | null
}

export async function searchJobs(
  query: string,
  key: string,
  opts: {
    num_pages: string
    country: string
    language: string
    location: string
    date_posted: string
    work_from_home: boolean
    employment_types: string
    job_requirements: string
    radius: string
  },
): Promise<JSearchJob[]> {
  const params = new URLSearchParams({ query, num_pages: opts.num_pages || '2' })
  if (opts.country)          params.set('country', opts.country)
  if (opts.date_posted)      params.set('date_posted', opts.date_posted)
  if (opts.language)         params.set('language', opts.language)
  if (opts.location)         params.set('location', opts.location)
  if (opts.work_from_home)   params.set('work_from_home', 'true')
  if (opts.employment_types) params.set('employment_types', opts.employment_types)
  if (opts.job_requirements) params.set('job_requirements', opts.job_requirements)
  if (opts.radius)           params.set('radius', opts.radius)

  const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
    headers: { 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com', 'X-RapidAPI-Key': key },
    cache: 'no-store',
  })

  if (res.status === 401) throw new Error('jsearch_401')
  if (res.status === 429) throw new Error('jsearch_429')
  if (!res.ok)             throw new Error(`jsearch_error`)

  const body = await res.json()
  return (body.data ?? []) as JSearchJob[]
}
