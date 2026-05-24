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

export async function getCV(): Promise<CV | null> {
  const { supabase, userId } = await getUser()
  const { data } = await supabase
    .from('cvs')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return (data ?? null) as CV | null
}

export async function uploadCV(formData: FormData): Promise<{ error?: string }> {
  const { supabase, userId } = await getUser()
  const file = formData.get('cv') as File | null
  if (!file) return { error: 'No file provided' }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['pdf', 'docx'].includes(ext ?? '')) return { error: 'Only PDF and DOCX are supported' }

  const storagePath = `${userId}/cv.${ext}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error: uploadError } = await supabase.storage.from('cvs').upload(storagePath, buffer, {
    contentType: file.type,
    upsert: true,
  })
  if (uploadError) return { error: uploadError.message }

  let extractedText = ''
  let wordCount = 0
  try {
    if (ext === 'pdf') {
      const pdfParse = (await import('pdf-parse')).default
      const result = await pdfParse(buffer)
      extractedText = result.text
    } else {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    }
    wordCount = extractedText.trim().split(/\s+/).filter(Boolean).length
  } catch (err) {
    console.log('CV text extraction failed (non-fatal)', { filename: file.name, ext, err })
    // extraction failure is non-fatal — save the file, text will be empty
  }

  const { error: dbError } = await supabase.from('cvs').upsert({
    user_id:        userId,
    filename:       file.name,
    storage_path:   storagePath,
    extracted_text: extractedText || null,
    word_count:     wordCount || null,
  }, { onConflict: 'user_id' })

  if (dbError) return { error: dbError.message }

  revalidatePath('/app/cv')
  return {}
}

export async function deleteCV(): Promise<void> {
  const { supabase, userId } = await getUser()
  const { data: cv } = await supabase
    .from('cvs')
    .select('storage_path')
    .eq('user_id', userId)
    .maybeSingle()
  if (cv) {
    await supabase.storage.from('cvs').remove([cv.storage_path])
    await supabase.from('cvs').delete().eq('user_id', userId)
  }
  revalidatePath('/app/cv')
}
