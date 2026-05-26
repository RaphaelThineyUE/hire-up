'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { whyMatched } from '@/lib/ai'
import { getSettings } from '@/actions/settings'
import type { Application, Contact } from '@/lib/types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}

export async function listFoundApplications(): Promise<Application[]> {
  const { supabase, userId } = await getUser()
  const { data } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'found')
    .order('match_score_value', { ascending: false, nullsFirst: false })
  return (data ?? []) as Application[]
}

export async function explainMatch(applicationId: string): Promise<string[]> {
  const { supabase, userId } = await getUser()

  const { data: app } = await supabase
    .from('applications')
    .select('job_description')
    .eq('id', applicationId)
    .eq('user_id', userId)
    .single()

  if (!app?.job_description) return []

  const { data: cv } = await supabase
    .from('cvs')
    .select('extracted_text')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!cv?.extracted_text) return []

  const settings = await getSettings()
  return whyMatched(cv.extracted_text, app.job_description, settings)
}

export async function listContacts(applicationId: string): Promise<Contact[]> {
  const { supabase, userId } = await getUser()
  const { data } = await supabase
    .from('contacts')
    .select('*')
    .eq('application_id', applicationId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  return (data ?? []) as Contact[]
}

export async function bulkApplyByScore(minScore: number): Promise<{ count: number }> {
  const { supabase, userId } = await getUser()
  const { data, error } = await supabase
    .from('applications')
    .update({ status: 'applied' })
    .eq('user_id', userId)
    .eq('status', 'found')
    .gte('match_score_value', minScore)
    .select('id')
  if (error) throw new Error(error.message)
  revalidatePath('/app/scan')
  revalidatePath('/app/applications')
  revalidatePath('/app/dashboard')
  return { count: (data ?? []).length }
}
