import { getCVs } from '@/actions/cv'
import { CVUploadForm } from '@/components/app/CVUploadForm'

export default async function CVPage() {
  const cvs = await getCVs()

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
          Your document
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: 'var(--fg-0)' }}>
          CV Manager
        </h1>
      </div>

      <CVUploadForm cvs={cvs} />
    </div>
  )
}
