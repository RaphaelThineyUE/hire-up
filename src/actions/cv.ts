'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CV } from '@/lib/types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}

/** Returns the default CV (used by AI features). */
export async function getCV(): Promise<CV | null> {
  const { supabase, userId } = await getUser()
  const { data } = await supabase
    .from('cvs')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data ?? null) as CV | null
}

/** Returns all CVs for the user, default first. */
export async function getCVs(): Promise<CV[]> {
  const { supabase, userId } = await getUser()
  const { data } = await supabase
    .from('cvs')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  return (data ?? []) as CV[]
}

export async function uploadCV(formData: FormData): Promise<{ error?: string }> {
  const { supabase, userId } = await getUser()
  const file = formData.get('cv') as File | null
  if (!file) return { error: 'No file provided' }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['pdf', 'docx'].includes(ext ?? '')) return { error: 'Only PDF and DOCX are supported' }

  const storageId = crypto.randomUUID()
  const storagePath = `${userId}/${storageId}.${ext}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error: uploadError } = await supabase.storage.from('cvs').upload(storagePath, buffer, {
    contentType: file.type,
  })
  if (uploadError) return { error: uploadError.message }

  let extractedText = ''
  let wordCount = 0
  try {
    if (ext === 'pdf') {
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      extractedText = result.text
    } else {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    }
    wordCount = extractedText.trim().split(/\s+/).filter(Boolean).length
  } catch (err) {
    console.log('CV text extraction failed (non-fatal)', { filename: file.name, ext, err })
  }

  // First CV for this user becomes the default
  const { count } = await supabase
    .from('cvs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  const isFirst = (count ?? 0) === 0

  const { error: dbError } = await supabase.from('cvs').insert({
    user_id:        userId,
    filename:       file.name,
    storage_path:   storagePath,
    extracted_text: extractedText || null,
    word_count:     wordCount || null,
    is_default:     isFirst,
  })

  if (dbError) {
    await supabase.storage.from('cvs').remove([storagePath])
    return { error: dbError.message }
  }

  revalidatePath('/app/cv')
  return {}
}

export async function setDefaultCV(id: string): Promise<{ error?: string }> {
  const { supabase, userId } = await getUser()
  await supabase.from('cvs').update({ is_default: false }).eq('user_id', userId)
  const { error } = await supabase.from('cvs').update({ is_default: true }).eq('id', id).eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/app/cv')
  return {}
}

export async function deleteCV(id: string): Promise<void> {
  const { supabase, userId } = await getUser()
  const { data: cv } = await supabase
    .from('cvs')
    .select('storage_path, is_default')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()
  if (!cv) return

  await supabase.storage.from('cvs').remove([cv.storage_path])
  await supabase.from('cvs').delete().eq('id', id).eq('user_id', userId)

  // If deleted CV was the default, promote the next most recent
  if (cv.is_default) {
    const { data: remaining } = await supabase
      .from('cvs')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
    if (remaining?.[0]) {
      await supabase.from('cvs').update({ is_default: true }).eq('id', remaining[0].id)
    }
  }

  revalidatePath('/app/cv')
}
