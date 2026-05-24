import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { findJobs, type ScanEvent } from '@/lib/findJobs'
import type { UserSettings } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id'> = {
  ai_provider:              'ollama',
  ai_base_url:              'http://127.0.0.1:1234/v1',
  ai_model:                 '',
  claude_api_key_enc:       '',
  openai_api_key_enc:       '',
  jsearch_api_key_enc:      '',
  find_jobs_candidates:     25,
  find_jobs_save_count:     10,
  jsearch_query_override:   '',
  jsearch_country:          'us',
  jsearch_language:         '',
  jsearch_location:         '',
  jsearch_date_posted:      'month',
  jsearch_work_from_home:   false,
  jsearch_employment_types: '',
  jsearch_job_requirements: '',
  jsearch_radius:           '',
  jsearch_exclude_publishers: '',
  jsearch_num_pages:        '2',
  cron_enabled:             false,
  cron_hour_utc:            8,
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth   = request.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentHourUtc = new Date().getUTCHours()
  const supabase = createServiceClient()

  const { data: settingsRows, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('cron_enabled', true)
    .eq('cron_hour_utc', currentHourUtc)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!settingsRows?.length) return NextResponse.json({ skipped: true, hour: currentHourUtc })

  const results: Array<{ userId: string; saved: number; error?: string }> = []

  for (const row of settingsRows) {
    const userId = row.user_id as string
    const settings: UserSettings = { ...DEFAULT_SETTINGS, ...row }

    const { data: cv } = await supabase
      .from('cvs')
      .select('extracted_text')
      .eq('user_id', userId)
      .maybeSingle()

    if (!cv?.extracted_text) {
      results.push({ userId, saved: 0, error: 'no_cv' })
      continue
    }

    let saved = 0
    let errorCode: string | undefined
    const events: ScanEvent[] = []

    await findJobs(supabase as unknown as SupabaseClient, userId, settings, cv.extracted_text, (e) => {
      events.push(e)
      if (e.type === 'done')  saved = e.saved
      if (e.type === 'error') errorCode = e.code
    })

    results.push({ userId, saved, error: errorCode })
  }

  return NextResponse.json({ hour: currentHourUtc, results })
}
