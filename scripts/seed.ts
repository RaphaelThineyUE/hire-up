// scripts/seed.ts
// Run: npm run seed
// Inserts 50 fake applications + contacts for TEST_USER_EMAIL.
// All rows have notes containing [[seed]] for safe teardown.
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const USER_EMAIL   = process.env.TEST_USER_EMAIL!

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const COMPANIES = [
  'Stripe', 'Linear', 'Vercel', 'Figma', 'Notion', 'Anthropic', 'OpenAI', 'GitHub',
  'Cloudflare', 'Supabase', 'PlanetScale', 'Railway', 'Loom', 'Pitch', 'Retool',
  'Grafana', 'Datadog', 'Sentry', 'Segment', 'Twilio',
]

const ROLES = [
  'Senior Software Engineer', 'Staff Engineer', 'Principal Engineer',
  'Engineering Manager', 'Senior Frontend Engineer', 'Senior Backend Engineer',
  'Full Stack Engineer', 'Design Engineer', 'DevOps Engineer', 'Platform Engineer',
  'Senior Product Engineer', 'Lead Engineer',
]

const LOCATIONS = [
  'Remote (US)', 'Remote (EU)', 'Remote (Worldwide)', 'San Francisco, CA',
  'New York, NY', 'London, UK', 'Berlin, Germany', 'Amsterdam, NL',
]

const SALARY_RANGES = [
  '$120,000 – $160,000', '$150,000 – $200,000', '$170,000 – $230,000',
  '$180,000 – $250,000', '$200,000 – $280,000 + equity', null, null,
]

const STATUSES: Array<'found' | 'applied' | 'interviewing' | 'offer' | 'rejected'> = [
  'found', 'found', 'found', 'found', 'found', 'found', 'found', 'found', 'found', 'found',
  'applied', 'applied', 'applied', 'applied', 'applied',
  'applied', 'applied', 'applied', 'applied', 'applied',
  'applied', 'applied', 'applied', 'applied', 'applied',
  'applied', 'applied', 'applied', 'applied', 'applied',
  'interviewing', 'interviewing', 'interviewing',
  'interviewing', 'interviewing', 'interviewing',
  'interviewing', 'interviewing', 'interviewing', 'interviewing',
  'offer', 'offer', 'offer', 'offer', 'offer',
  'rejected', 'rejected', 'rejected', 'rejected', 'rejected',
]

const JOB_DESCRIPTIONS = [
  `We're looking for a Senior Engineer to join our infrastructure team. You'll design and build systems that process millions of events per day, work closely with the platform team, and mentor junior engineers.\n\n**You'll do:** architect distributed services; lead technical design reviews; drive reliability initiatives across our stack.`,
  `Join our product engineering team to build features used by thousands of developers every day. You'll work across the full stack (TypeScript, React, PostgreSQL), ship fast, and collaborate directly with design and product.\n\n**What we value:** strong product intuition, clean code, and clear communication.`,
  `We need a passionate engineer to help scale our data pipeline from 1B to 100B events/month. You'll work on Kafka, Flink, and Snowflake, and partner with analytics and ML teams to deliver real-time insights.\n\n**Stack:** Python, Go, Kafka, Flink, dbt, Snowflake.`,
  `As a Design Engineer, you'll sit at the intersection of engineering and design — building our component library, prototyping new product ideas, and ensuring pixel-perfect implementation across web and mobile.\n\n**Stack:** React, Figma, TypeScript, CSS-in-JS.`,
  `Our platform team is looking for an experienced engineer to own our CI/CD infrastructure, developer tooling, and internal platforms. You'll make every engineer at the company faster.\n\n**Responsibilities:** manage Kubernetes clusters; build internal tooling; lead oncall rotation.`,
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

async function seed() {
  const { data: usersPage } = await supabase.auth.admin.listUsers({ perPage: 500 })
  const user = usersPage?.users.find(u => u.email === USER_EMAIL)
  if (!user) {
    console.error(`User not found: ${USER_EMAIL}`)
    process.exit(1)
  }
  console.log(`Seeding for user: ${user.email} (${user.id})`)

  const rows = STATUSES.map((status, i) => {
    const company = COMPANIES[i % COMPANIES.length]
    const role    = pick(ROLES)
    const daysOld = Math.floor(Math.random() * 90) + 1
    const score   = status === 'found'
      ? 70 + Math.floor(Math.random() * 30)
      : status === 'rejected'
      ? 20 + Math.floor(Math.random() * 40)
      : 50 + Math.floor(Math.random() * 45)

    return {
      user_id:           user.id,
      company,
      role,
      url:               `https://${company.toLowerCase().replace(/\s/g, '')}.com/jobs/${1000 + i}`,
      job_description:   pick(JOB_DESCRIPTIONS),
      match_score_value: score,
      status,
      location:          pick(LOCATIONS),
      salary_range:      pick(SALARY_RANGES),
      remote_type:       'remote' as const,
      contract_type:     'full-time' as const,
      applied_at:        daysAgo(daysOld),
      posted_at:         daysAgo(daysOld + Math.floor(Math.random() * 7)),
      created_at:        daysAgo(daysOld),
      notes:             '[[seed]]',
    }
  })

  const { data: inserted, error } = await supabase.from('applications').insert(rows).select('id, company, role, status')
  if (error) { console.error('Insert failed:', error); process.exit(1) }

  console.log(`✓ Inserted ${inserted?.length} applications`)

  const CONTACT_NAMES = ['Mira Acharya', 'James Park', 'Sofia Reyes', 'Tom Chen', 'Aisha Nkosi', 'Luke Foster', 'Priya Patel', 'Marcus Webb']
  const CONTACT_ROLES = ['Engineering Manager', 'VP Engineering', 'Tech Lead', 'Head of Talent', 'Recruiter', 'Director of Engineering', 'CTO', 'Senior Recruiter']

  if (inserted && inserted.length >= 8) {
    const contactRows = inserted.slice(0, 8).map((app, i) => ({
      user_id:        user.id,
      application_id: app.id,
      name:           CONTACT_NAMES[i],
      email:          `${CONTACT_NAMES[i].split(' ')[0].toLowerCase()}@${app.company.toLowerCase().replace(/\s/g, '')}.com`,
      role:           CONTACT_ROLES[i],
    }))
    const { error: ce } = await supabase.from('contacts').insert(contactRows)
    if (ce) console.error('Contacts insert failed:', ce)
    else console.log(`✓ Inserted ${contactRows.length} contacts`)
  }

  console.log('\nDone! Run `npm run seed:teardown` to remove seeded data.')
}

seed().catch(e => { console.error(e); process.exit(1) })
