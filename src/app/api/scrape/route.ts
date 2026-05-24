import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scrapeJobPosting } from '@/lib/scraper'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { url?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const url = body.url
  if (typeof url !== 'string' || !url.startsWith('http')) {
    return NextResponse.json({ error: 'url must be a valid http/https string' }, { status: 400 })
  }

  try {
    const result = await scrapeJobPosting(url)
    return NextResponse.json(result)
  } catch (e) {
    const code = e instanceof Error ? e.message : 'scrape_error'
    return NextResponse.json({ error: code }, { status: 422 })
  }
}
