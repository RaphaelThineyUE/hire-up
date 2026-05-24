'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/app/dashboard')
      router.refresh()
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', boxSizing: 'border-box',
    background: 'var(--bg-0)', border: '1px solid var(--border-1)',
    borderRadius: 'var(--r-sm)', color: 'var(--fg-0)', fontSize: 14, outline: 'none',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 4px', color: 'var(--fg-0)' }}>
          Create account
        </h1>
        <p style={{ fontSize: 13, color: 'var(--fg-2)', margin: 0 }}>
          Already have one?{' '}
          <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>

      {error && (
        <p style={{ margin: 0, padding: '10px 12px', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', padding: '10px 20px', background: 'var(--accent)',
          color: '#fff', border: 'none', borderRadius: 'var(--r-sm)',
          fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
