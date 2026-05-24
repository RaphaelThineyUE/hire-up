'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Application, ApplicationCreate, ApplicationUpdate, RemoteType, ContractType } from '@/lib/types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}

export async function listApplications(): Promise<Application[]> {
  const { supabase } = await getUser()
  const { data } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as Application[]
}

export async function getApplication(id: string): Promise<Application | null> {
  const { supabase } = await getUser()
  const { data } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .single()
  return (data ?? null) as Application | null
}

export async function createApplication(formData: FormData): Promise<void> {
  const { supabase, userId } = await getUser()

  const payload: ApplicationCreate & { user_id: string } = {
    user_id:         userId,
    company:         formData.get('company') as string,
    role:            formData.get('role') as string,
    url:             (formData.get('url') as string) || null,
    job_description: (formData.get('job_description') as string) || null,
    status:          (formData.get('status') as string || 'applied') as Application['status'],
    notes:           (formData.get('notes') as string) || null,
    salary_range:    (formData.get('salary_range') as string) || null,
    location:        (formData.get('location') as string) || null,
    remote_type:     ((formData.get('remote_type') as string) || null) as RemoteType,
    contract_type:   ((formData.get('contract_type') as string) || null) as ContractType,
    posted_at:       (formData.get('posted_at') as string) || null,
  }

  await supabase.from('applications').insert(payload).select().single()
  revalidatePath('/app/applications')
  revalidatePath('/app/dashboard')
}

export async function updateApplication(id: string, updates: ApplicationUpdate): Promise<void> {
  const { supabase } = await getUser()
  await supabase.from('applications').update(updates).eq('id', id)
  revalidatePath('/app/applications')
  revalidatePath(`/app/applications/${id}`)
  revalidatePath('/app/dashboard')
}

export async function deleteApplication(id: string): Promise<void> {
  const { supabase } = await getUser()
  await supabase.from('applications').delete().eq('id', id)
  revalidatePath('/app/applications')
  revalidatePath('/app/dashboard')
}
