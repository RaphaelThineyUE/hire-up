import { createClient } from '@/lib/supabase/server'
import { findJobs, type ScanEvent } from '@/lib/findJobs'
import type { UserSettings } from '@/lib/types'

const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id'> = {
  ai_provider: 'ollama',
  ai_base_url: 'http://127.0.0.1:1234/v1',
  ai_model: '',
  claude_api_key_enc: '',
  openai_api_key_enc: '',
  jsearch_api_key_enc: '',
  find_jobs_candidates: 25,
  find_jobs_save_count: 10,
  jsearch_query_override: '',
  jsearch_country: 'us',
  jsearch_language: '',
  jsearch_location: '',
  jsearch_date_posted: 'month',
  jsearch_work_from_home: false,
  jsearch_employment_types: '',
  jsearch_job_requirements: '',
  jsearch_radius: '',
  jsearch_exclude_publishers: '',
  jsearch_num_pages: '2',
  cron_enabled: false,
  cron_hour_utc: 8,
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: settingsRow } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  const settings: UserSettings = { ...DEFAULT_SETTINGS, ...settingsRow, user_id: user.id }

  const { data: cvRow } = await supabase
    .from('cvs')
    .select('extracted_text')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!cvRow?.extracted_text) {
    return Response.json({ error: 'no_cv', message: 'Upload a CV first.' }, { status: 422 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function emit(event: ScanEvent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }
      try {
        await findJobs(supabase, user.id, settings, cvRow.extracted_text!, emit)
      } catch (e: unknown) {
        emit({ type: 'error', code: 'unknown', message: e instanceof Error ? e.message : 'Unknown error' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
