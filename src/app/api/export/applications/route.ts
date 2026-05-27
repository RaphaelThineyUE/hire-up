import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { formatApplicationsCSV } from '@/lib/csvExport'
import type { Application } from '@/lib/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  const csv = formatApplicationsCSV((data ?? []) as Application[])

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="applications.csv"',
    },
  })
}
