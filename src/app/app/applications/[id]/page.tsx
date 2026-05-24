import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ApplicationDetail } from '@/components/app/ApplicationDetail'
import type { Application } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ApplicationDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!data) notFound()

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <ApplicationDetail application={data as Application} fullPage />
    </div>
  )
}
