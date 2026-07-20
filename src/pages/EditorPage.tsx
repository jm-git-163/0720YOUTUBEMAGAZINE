import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import type { MagazineEditorial } from '@/lib/types'
import { ErrorState, LoadingState } from '@/components/States'
import { useLocale } from '@/i18n/LocaleContext'

function blankEditorial(
  t: (key: string) => string = (k) => k,
): MagazineEditorial {
  return {
    headline: '',
    dek: '',
    category: 'Technology',
    summary: ['', '', ''],
    whyItMatters: '',
    keyInsights: [''],
    trends: [''],
    similarVideos: [],
    watchNext: [],
    creatorStyle: '',
    audience: '',
    keyQuotes: [''],
    aiOpinion: '',
    relatedNews: '',
    qualityScore: {
      originality: 80,
      educationalValue: 80,
      entertainment: 70,
      productionQuality: 80,
      thumbnail: 75,
      title: 80,
      seo: 75,
      storytelling: 80,
      total: 78,
    },
    bodySections: [
      { id: 'intro', title: t('editor.sectionIntro'), content: '' },
      { id: 'body', title: t('editor.sectionStory'), content: '' },
    ],
  }
}

export function EditorPage() {
  const { isEditor, loading: authLoading, logout } = useAuth()
  const { t } = useLocale()
  const qc = useQueryClient()
  const [form, setForm] = useState(() => blankEditorial())
  const [videoId, setVideoId] = useState('')
  const [message, setMessage] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['articles'],
    queryFn: api.articles,
    enabled: isEditor,
  })

  const createMut = useMutation({
    mutationFn: () =>
      api.createArticle({
        videoId: videoId.trim() || undefined,
        editorial: {
          ...form,
          summary: form.summary.filter(Boolean),
          keyInsights: form.keyInsights.filter(Boolean),
          trends: form.trends.filter(Boolean),
          keyQuotes: form.keyQuotes.filter(Boolean),
        },
        status: 'published',
      }),
    onSuccess: () => {
      setMessage(t('editor.published'))
      setForm(blankEditorial(t))
      setVideoId('')
      void qc.invalidateQueries({ queryKey: ['articles'] })
      void qc.invalidateQueries({ queryKey: ['home'] })
    },
    onError: (err: Error) => setMessage(err.message),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteArticle(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['articles'] })
      void qc.invalidateQueries({ queryKey: ['home'] })
    },
  })

  if (authLoading) return <LoadingState label={t('editor.checking')} />
  if (!isEditor) return <Navigate to="/login" replace />

  const onCreate = (e: FormEvent) => {
    e.preventDefault()
    setMessage('')
    createMut.mutate()
  }

  return (
    <main className="mx-auto max-w-[1440px] px-8 pt-32 pb-section-gap">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-3 block font-body text-label-md uppercase tracking-widest text-accent-crimson">
            {t('editor.badge')}
          </span>
          <h1 className="font-display text-display-lg">{t('editor.title')}</h1>
          <p className="mt-2 font-body text-body-md text-text-muted">
            {t('editor.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="border border-border-subtle px-6 py-3 font-body text-label-md uppercase tracking-widest"
        >
          {t('editor.signOut')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
        <section>
          <h2 className="mb-6 font-display text-headline-md">
            {t('editor.newStory')}
          </h2>
          <form onSubmit={onCreate} className="space-y-4">
            <input
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              placeholder={t('editor.videoId')}
              className="w-full border border-border-subtle bg-surface px-4 py-3 font-body text-body-md focus:border-primary focus:outline-none"
            />
            <input
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder={t('editor.headline')}
              required
              className="w-full border border-border-subtle bg-surface px-4 py-3 font-body text-body-md focus:border-primary focus:outline-none"
            />
            <input
              value={form.dek}
              onChange={(e) => setForm({ ...form, dek: e.target.value })}
              placeholder={t('editor.dek')}
              className="w-full border border-border-subtle bg-surface px-4 py-3 font-body text-body-md focus:border-primary focus:outline-none"
            />
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder={t('editor.category')}
              className="w-full border border-border-subtle bg-surface px-4 py-3 font-body text-body-md focus:border-primary focus:outline-none"
            />
            <textarea
              value={form.whyItMatters}
              onChange={(e) =>
                setForm({ ...form, whyItMatters: e.target.value })
              }
              placeholder={t('editor.why')}
              rows={4}
              className="w-full border border-border-subtle bg-surface px-4 py-3 font-body text-body-md focus:border-primary focus:outline-none"
            />
            <textarea
              value={form.aiOpinion}
              onChange={(e) => setForm({ ...form, aiOpinion: e.target.value })}
              placeholder={t('editor.opinion')}
              rows={3}
              className="w-full border border-border-subtle bg-surface px-4 py-3 font-body text-body-md focus:border-primary focus:outline-none"
            />
            <textarea
              value={form.bodySections[0]?.content ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  bodySections: [
                    {
                      id: 'intro',
                      title: t('editor.sectionIntro'),
                      content: e.target.value,
                    },
                    form.bodySections[1] ?? {
                      id: 'body',
                      title: t('editor.sectionStory'),
                      content: '',
                    },
                  ],
                })
              }
              placeholder={t('editor.body')}
              rows={6}
              className="w-full border border-border-subtle bg-surface px-4 py-3 font-body text-body-md focus:border-primary focus:outline-none"
            />
            {message && (
              <p className="font-body text-body-md text-text-muted">{message}</p>
            )}
            <button
              type="submit"
              disabled={createMut.isPending}
              className="rounded-DEFAULT bg-primary px-8 py-4 font-body text-label-md uppercase tracking-widest text-white disabled:opacity-60"
            >
              {createMut.isPending
                ? t('editor.publishing')
                : t('editor.publish')}
            </button>
          </form>
        </section>

        <section>
          <h2 className="mb-6 font-display text-headline-md">
            {t('editor.managed')}
          </h2>
          {isLoading && <LoadingState label={t('editor.loadingArticles')} />}
          {error && (
            <ErrorState
              message={error instanceof Error ? error.message : t('editor.fail')}
              onRetry={() => refetch()}
            />
          )}
          <ul className="space-y-4">
            {data?.items.map((article) => (
              <li
                key={article.id}
                className="flex items-start justify-between gap-4 border border-border-subtle bg-surface-pure p-6"
              >
                <div>
                  <span className="mb-2 block font-body text-label-sm uppercase tracking-widest text-accent-crimson">
                    {article.status} · {article.editorial.category}
                  </span>
                  <h3 className="font-display text-headline-md">
                    {article.editorial.headline}
                  </h3>
                  <p className="mt-1 font-body text-body-md text-text-muted">
                    {article.channelTitle}
                  </p>
                  {article.videoId && (
                    <Link
                      to={`/article/${article.videoId}`}
                      className="mt-2 inline-block font-body text-label-sm uppercase tracking-widest text-primary"
                    >
                      {t('editor.open')}
                    </Link>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(t('editor.confirmDelete'))) {
                      deleteMut.mutate(article.id)
                    }
                  }}
                  className="shrink-0 font-body text-label-sm uppercase tracking-widest text-accent-crimson"
                >
                  {t('editor.delete')}
                </button>
              </li>
            ))}
            {data?.items.length === 0 && (
              <p className="font-body text-body-md text-text-muted">
                {t('editor.empty')}
              </p>
            )}
          </ul>
        </section>
      </div>
    </main>
  )
}
