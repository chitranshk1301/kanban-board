import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { session } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session) return <Navigate to="/projects" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (err) setError(err.message)
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() } },
        })
        if (err) {
          setError(err.message)
        } else if (!data.session) {
          setNotice(
            'Check your email to confirm your account, then sign in.',
          )
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Kanban Board</h1>
        <p className={styles.subtitle}>
          {mode === 'signin'
            ? 'Sign in to your workspace'
            : 'Create your account'}
        </p>

        {mode === 'signup' && (
          <label className={styles.field}>
            <span>Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ada Lovelace"
              required
              autoComplete="name"
            />
          </label>
        )}

        <label className={styles.field}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </label>

        <label className={styles.field}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete={
              mode === 'signin' ? 'current-password' : 'new-password'
            }
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.notice}>{notice}</p>}

        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting
            ? 'Please wait…'
            : mode === 'signin'
              ? 'Sign in'
              : 'Sign up'}
        </button>

        <button
          type="button"
          className={styles.switchMode}
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
            setNotice(null)
          }}
        >
          {mode === 'signin'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
