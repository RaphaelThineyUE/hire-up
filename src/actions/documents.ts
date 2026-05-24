'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSettings } from './settings'
import { getCV } from './cv'
import { generateDocument as aiGenerateDocument, scoreMatch } from '@/lib/ai'
import type { AppDocument } from '@/lib/types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}

export async function listDocuments(applicationId: string): Promise<AppDocument[]> {
  const { supabase } = await getUser()
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
  return (data ?? []) as AppDocument[]
}

export async function generateDocumentForApplication(
  applicationId: string,
  jobDescription: string,
  type: 'cover_letter' | 'tailored_cv',
): Promise<{ id: string } | { error: string }> {
  const { supabase, userId } = await getUser()

  const cv = await getCV()
  if (!cv?.extracted_text) return { error: 'No CV found. Upload your CV first.' }

  const settings = await getSettings()
  const markdown = await aiGenerateDocument(cv.extracted_text, jobDescription, type, settings)

  const filename = `${type}-${Date.now()}.md`
  const storagePath = `${userId}/${applicationId}/${filename}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, Buffer.from(markdown, 'utf-8'), { contentType: 'text/markdown', upsert: false })
  if (uploadError) return { error: uploadError.message }

  const { data, error: dbError } = await supabase.from('documents').insert({
    user_id:          userId,
    application_id:   applicationId,
    type,
    filename,
    storage_path:     storagePath,
    content_markdown: markdown,
  }).select('id').single()

  if (dbError) return { error: dbError.message }

  revalidatePath(`/app/applications/${applicationId}`)
  return { id: data.id }
}

export async function scoreApplication(
  applicationId: string,
  jobDescription: string,
): Promise<{ score: number } | { error: string }> {
  const { supabase } = await getUser()

  const cv = await getCV()
  if (!cv?.extracted_text) return { error: 'No CV found. Upload your CV first.' }

  const settings = await getSettings()
  const score = await scoreMatch(cv.extracted_text, jobDescription, settings)
  if (score === null) return { error: 'AI scoring failed. Check your AI provider settings.' }

  await supabase.from('applications').update({ match_score_value: score }).eq('id', applicationId)
  revalidatePath(`/app/applications/${applicationId}`)
  revalidatePath('/app/applications')
  revalidatePath('/app/dashboard')

  return { score }
}

export async function deleteDocument(id: string, applicationId: string): Promise<void> {
  const { supabase } = await getUser()
  const { data } = await supabase.from('documents').select('storage_path').eq('id', id).single()
  if (data?.storage_path) await supabase.storage.from('documents').remove([data.storage_path])
  await supabase.from('documents').delete().eq('id', id)
  revalidatePath(`/app/applications/${applicationId}`)
}
