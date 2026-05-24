'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt, mask } from '@/lib/crypto'
import type { UserSettings } from '@/lib/types'

const ENCRYPTED_FIELDS = ['claude_api_key_enc', 'openai_api_key_enc', 'jsearch_api_key_enc'] as const

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

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}

export async function getSettings(): Promise<UserSettings & { claude_api_key_masked: string; openai_api_key_masked: string; jsearch_api_key_masked: string }> {
  const { supabase, userId } = await getUser()
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  const settings = data ?? { ...DEFAULT_SETTINGS, user_id: userId }
  return {
    ...settings,
    claude_api_key_masked:  settings.claude_api_key_enc  ? mask(decrypt(settings.claude_api_key_enc))  : '',
    openai_api_key_masked:  settings.openai_api_key_enc  ? mask(decrypt(settings.openai_api_key_enc))  : '',
    jsearch_api_key_masked: settings.jsearch_api_key_enc ? mask(decrypt(settings.jsearch_api_key_enc)) : '',
  }
}

export async function updateSettings(updates: Partial<UserSettings>): Promise<void> {
  const { supabase, userId } = await getUser()

  const payload: Record<string, unknown> = { ...updates, user_id: userId }

  // Encrypt key fields; skip if the value contains **** (masked — user didn't change it)
  for (const field of ENCRYPTED_FIELDS) {
    const raw = payload[field] as string | null | undefined
    if (raw == null || raw === '' || (typeof raw === 'string' && raw.includes('****'))) {
      delete payload[field]
    } else {
      payload[field] = encrypt(raw as string)
    }
  }

  const { error } = await supabase.from('user_settings').upsert(payload)
  if (error) throw new Error(error.message)
  revalidatePath('/app/settings')
}
