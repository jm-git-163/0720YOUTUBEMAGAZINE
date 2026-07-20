import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useLocale } from '@/i18n/LocaleContext'

export function LoginPage() {
  const { login, isEditor, loading: authLoading } = useAuth()
  const { t } = useLocale()
  const navigate = useNavigate()
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!authLoading && isEditor) {
    return <Navigate to="/editor" replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(secret)
      navigate('/editor')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.fail'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-8 pt-32 pb-section-gap">
      <span className="mb-4 font-body text-label-md uppercase tracking-widest text-accent-crimson">
        {t('login.badge')}
      </span>
      <h1 className="mb-4 font-display text-display-lg">{t('login.title')}</h1>
      <p className="mb-10 font-body text-body-md text-text-muted">
        {t('login.body')}
      </p>
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="secret"
            className="mb-2 block font-body text-label-sm uppercase tracking-widest text-text-muted"
          >
            {t('login.label')}
          </label>
          <input
            id="secret"
            type="password"
            autoComplete="current-password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full border border-border-subtle bg-surface px-4 py-3 font-body text-body-md transition-colors focus:border-2 focus:border-primary focus:outline-none"
            placeholder={t('login.placeholder')}
            required
          />
        </div>
        {error && (
          <p className="font-body text-body-md text-accent-crimson">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-DEFAULT bg-primary px-8 py-4 font-body text-label-md uppercase tracking-widest text-white disabled:opacity-60"
        >
          {loading ? t('login.submitting') : t('login.submit')}
        </button>
      </form>
      <Link
        to="/"
        className="mt-8 font-body text-label-md uppercase tracking-widest text-text-muted hover:text-primary"
      >
        {t('login.back')}
      </Link>
    </main>
  )
}
