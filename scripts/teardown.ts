// scripts/teardown.ts
// Run: npm run seed:teardown
// Removes all applications (and cascade contacts) tagged with [[seed]].
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

async function teardown() {
  const { data, error } = await supabase
    .from('applications')
    .delete()
    .like('notes', '%[[seed]]%')
    .select('id')
  if (error) { console.error('Teardown failed:', error); process.exit(1) }
  console.log(`✓ Deleted ${data?.length ?? 0} seeded applications (contacts cascade-deleted)`)
}

teardown().catch(e => { console.error(e); process.exit(1) })
