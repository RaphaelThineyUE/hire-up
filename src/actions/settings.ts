'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt, mask } from '@/lib/crypto'
import type { UserSettings } from '@/lib/types'

const ENCRYPTED_FIELDS = ['claude_api_key_enc', 'openai_api_key_enc', 'jsearch_api_key_enc'] as const

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
    .single()
  if (error) throw new Error(error.message)
  return {
    ...data,
    claude_api_key_masked:  data.claude_api_key_enc  ? mask(decrypt(data.claude_api_key_enc))  : '',
    openai_api_key_masked:  data.openai_api_key_enc  ? mask(decrypt(data.openai_api_key_enc))  : '',
    jsearch_api_key_masked: data.jsearch_api_key_enc ? mask(decrypt(data.jsearch_api_key_enc)) : '',
  }
}

export async function updateSettings(updates: Partial<UserSettings>): Promise<void> {
  const { supabase, userId } = await getUser()

  const payload: Record<string, unknown> = { ...updates, user_id: userId }

  // Encrypt key fields; skip if the value contains **** (masked — user didn't change it)
  for (const field of ENCRYPTED_FIELDS) {
    const raw = payload[field] as string | undefined
    if (raw === undefined) continue
    if (raw === '' || raw.includes('****')) {
      delete payload[field]
    } else {
      payload[field] = encrypt(raw)
    }
  }

  const { error } = await supabase.from('user_settings').upsert(payload)
  if (error) throw new Error(error.message)
}
