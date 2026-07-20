import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useLocale } from '@/i18n/LocaleContext'
import { ErrorState, LoadingState } from '@/components/States'
import { FetchingBanner } from '@/components/GlobalLoadingIndicator'
import { formatCount, formatPublishedDate } from '@/lib/utils'
import type { MagazineEditorial } from '@/lib/types'

export function ArticlePage() {
  const { videoId = '' } = useParams()
  const { isEditor } = useAuth()
  const { t, locale } = useLocale()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<MagazineEditorial | null>(null)
  const [statusMsg, setStatusMsg] = useState('')

  const { data, isLoading, error, refetch, isFetching, isPlaceholderData } =
    useQuery({
      queryKey: ['editorial', videoId, locale],
      queryFn: () => api.editorial(videoId, locale),
      enabled: Boolean(videoId),
    })

  const saveMut = useMutation({
    mutationFn: (editorial: MagazineEditorial) =>
      api.saveEditorial(videoId, editorial),
    onSuccess: () => {
      setStatusMsg(t('article.saved'))
      setEditing(false)
      void qc.invalidateQueries({ queryKey: ['editorial', videoId] })
      void qc.invalidateQueries({ queryKey: ['home'] })
    },
    onError: (err: Error) => setStatusMsg(err.message),
  })

  const deleteMut = useMutation({
    mutationFn: () => api.deleteEditorial(videoId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['home'] })
      navigate('/')
    },
    onError: (err: Error) => setStatusMsg(err.message),
  })

  if (isLoading && !data) return <LoadingState label={t('article.loading')} />
  if (error || !data)
    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : t('article.fail')
        }
        onRetry={() => refetch()}
      />
    )

  const { video, editorial, channel, source } = data
  if (!video || !editorial) {
    return (
      <ErrorState message={t('article.fail')} onRetry={() => refetch()} />
    )
  }

  const view = editing && draft ? draft : editorial
  const why = view.whyItMatters?.trim() || view.dek || view.headline || ''
  const firstLetter = why.charAt(0) || ''
  const dropCapBody = why.slice(1)
  // Drop caps only work cleanly with Latin letters; CJK floats overlap body text.
  const useDropCap = /^[A-Za-z]$/.test(firstLetter)
  const sections = view.bodySections ?? []
  const summary = view.summary ?? []
  const insights = view.keyInsights ?? []
  const quotes = view.keyQuotes ?? []
  const score = view.qualityScore?.total ?? 0

  return (
    <main className="pt-24 pb-section-gap">
      {(isFetching || isPlaceholderData) && (
        <FetchingBanner
          label={
            isPlaceholderData ? t('article.translating') : t('common.updating')
          }
        />
      )}
      <article className="mx-auto max-w-[1440px] px-4 md:px-8">
        {isEditor && (
          <div className="mb-8 flex flex-wrap items-center gap-3 border border-border-subtle bg-surface-container-low p-4">
            <span className="font-body text-label-sm uppercase tracking-widest text-accent-crimson">
              {t('article.editorTools')} ·{' '}
              {source === 'editor'
                ? t('article.editedCopy')
                : t('article.aiDraft')}
            </span>
            {!editing ? (
              <button
                type="button"
                className="rounded-DEFAULT bg-primary px-4 py-2 font-body text-label-sm uppercase tracking-widest text-white"
                onClick={() => {
                  setDraft(structuredClone(editorial))
                  setEditing(true)
                  setStatusMsg('')
                }}
              >
                {t('article.edit')}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded-DEFAULT bg-primary px-4 py-2 font-body text-label-sm uppercase tracking-widest text-white"
                  disabled={saveMut.isPending || !draft}
                  onClick={() => draft && saveMut.mutate(draft)}
                >
                  {saveMut.isPending ? t('article.saving') : t('article.save')}
                </button>
                <button
                  type="button"
                  className="border border-border-subtle px-4 py-2 font-body text-label-sm uppercase tracking-widest"
                  onClick={() => {
                    setEditing(false)
                    setDraft(null)
                  }}
                >
                  {t('article.cancel')}
                </button>
              </>
            )}
            <button
              type="button"
              className="font-body text-label-sm uppercase tracking-widest text-accent-crimson"
              onClick={() => {
                if (confirm(t('article.confirmDelete'))) {
                  deleteMut.mutate()
                }
              }}
            >
              {t('article.delete')}
            </button>
            {statusMsg && (
              <span className="font-body text-label-sm text-text-muted">
                {statusMsg}
              </span>
            )}
          </div>
        )}

        <motion.div
          className="relative mb-12 overflow-hidden rounded-2xl shadow-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="thumb-frame">
            <img src={video.thumbnail} alt={view.headline} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-6 md:w-[85%] md:p-12 lg:p-16">
            <span className="mb-4 inline-block rounded-full border border-white/30 bg-surface-pure/20 px-3 py-1 font-body text-label-sm uppercase tracking-widest text-white backdrop-blur-md">
              {view.category}
            </span>
            {editing && draft ? (
              <input
                value={draft.headline}
                onChange={(e) =>
                  setDraft({ ...draft, headline: e.target.value })
                }
                className="mb-4 w-full bg-black/40 p-2 font-display text-display-lg leading-tight text-white outline-none"
              />
            ) : (
              <h1 className="mb-4 font-display text-display-lg leading-tight text-balance-safe text-white md:text-display-xl md:leading-[1.15]">
                {view.headline}
              </h1>
            )}
            {editing && draft ? (
              <textarea
                value={draft.dek}
                onChange={(e) => setDraft({ ...draft, dek: e.target.value })}
                className="w-full bg-black/40 p-2 font-body text-body-lg leading-relaxed text-white outline-none md:w-2/3"
                rows={2}
              />
            ) : (
              <p className="font-body text-body-lg leading-relaxed text-white/90 md:w-2/3">
                {view.dek}
              </p>
            )}
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noreferrer"
              className="pointer-events-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/20 md:h-24 md:w-24"
            >
              <span
                className="material-symbols-outlined ml-1 text-4xl text-white md:text-5xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                play_arrow
              </span>
            </a>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-gutter">
          <aside className="hidden md:col-span-3 md:block">
            <div className="sticky top-32">
              <h4 className="mb-6 font-body text-label-md uppercase tracking-widest text-text-muted">
                {t('article.toc')}
              </h4>
              <nav className="flex flex-col gap-4">
                {sections.map((s, i) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`font-body text-body-md transition-colors hover:text-accent-crimson ${
                      i === 0 ? 'font-medium text-primary' : 'text-text-muted'
                    }`}
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
              <div className="mt-12 rounded-xl border border-border-subtle bg-surface-container-low p-6">
                <h4 className="mb-3 flex items-center gap-2 font-body text-label-sm uppercase tracking-widest text-accent-gold">
                  <span className="material-symbols-outlined text-lg">
                    auto_awesome
                  </span>
                  {t('article.aiInsight')}
                </h4>
                {editing && draft ? (
                  <textarea
                    value={draft.aiOpinion}
                    onChange={(e) =>
                      setDraft({ ...draft, aiOpinion: e.target.value })
                    }
                    className="w-full bg-transparent font-body text-body-md text-text-muted outline-none"
                    rows={4}
                  />
                ) : (
                  <p className="font-body text-body-md text-text-muted italic">
                    &ldquo;{view.aiOpinion}&rdquo;
                  </p>
                )}
              </div>
              <div className="mt-6 space-y-2 font-body text-label-sm text-text-muted">
                {video.publishedAt && (
                  <p>
                    {t('article.uploaded')}{' '}
                    {formatPublishedDate(video.publishedAt, locale)}
                  </p>
                )}
                <p>
                  {t('article.views')} {formatCount(video.viewCount)}
                </p>
                <p>
                  {t('article.likes')} {formatCount(video.likeCount)}
                </p>
                {channel && (
                  <p>
                    {t('article.subs')} {formatCount(channel.subscriberCount)}
                  </p>
                )}
                <p>
                  {t('article.aiScore')}{' '}
                  <span className="font-mono font-bold text-primary">
                    {score}
                  </span>
                </p>
              </div>
            </div>
          </aside>

          <div className="md:col-span-8 lg:col-span-7">
            {editing && draft ? (
              <textarea
                value={draft.whyItMatters}
                onChange={(e) =>
                  setDraft({ ...draft, whyItMatters: e.target.value })
                }
                className="mb-8 w-full border border-border-subtle p-4 font-body text-body-lg text-text-muted outline-none"
                rows={5}
              />
            ) : useDropCap ? (
              <p className="mb-8 font-body text-body-lg leading-relaxed text-text-muted">
                <span className="float-left mr-3 font-display text-[56px] leading-[0.85] font-black text-primary md:mr-4 md:text-[72px]">
                  {firstLetter}
                </span>
                {dropCapBody}
              </p>
            ) : (
              <p className="mb-8 font-body text-body-lg leading-relaxed text-text-muted">
                {why}
              </p>
            )}

            <div className="mb-12 rounded-xl border border-border-subtle bg-surface-container-low p-6">
              <h3 className="mb-4 font-body text-label-md uppercase tracking-widest text-text-muted">
                {t('article.summary')}
              </h3>
              <ul className="space-y-2">
                {summary.map((line) => (
                  <li key={line} className="font-body text-body-md text-primary">
                    • {line}
                  </li>
                ))}
              </ul>
            </div>

            {sections.map((section, idx) => (
              <section key={section.id} id={section.id} className="mb-12">
                <h2 className="mb-6 mt-16 font-display text-headline-lg leading-snug text-balance-safe text-primary">
                  {section.title}
                </h2>
                {editing && draft ? (
                  <textarea
                    value={draft.bodySections[idx]?.content ?? ''}
                    onChange={(e) => {
                      const next = [...draft.bodySections]
                      next[idx] = { ...next[idx], content: e.target.value }
                      setDraft({ ...draft, bodySections: next })
                    }}
                    className="w-full border border-border-subtle p-4 font-body text-body-md leading-relaxed text-text-muted outline-none"
                    rows={6}
                  />
                ) : (
                  <p className="mb-6 font-body text-body-md leading-relaxed whitespace-pre-wrap text-text-muted">
                    {section.content}
                  </p>
                )}
              </section>
            ))}

            {quotes[0] && (
              <blockquote className="my-16 border-l-4 border-accent-crimson pl-8">
                <p className="font-display text-headline-lg leading-snug text-balance-safe italic text-primary md:text-display-lg">
                  &ldquo;{quotes[0]}&rdquo;
                </p>
              </blockquote>
            )}

            <div className="mb-16 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {insights.slice(0, 4).map((insight) => (
                <div
                  key={insight}
                  className="rounded-2xl border border-border-subtle bg-surface-pure p-6 shadow-[0_10px_40px_-10px_rgba(17,17,17,0.05)] transition-colors hover:border-primary"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container">
                    <span className="material-symbols-outlined text-primary">
                      lightbulb
                    </span>
                  </div>
                  <p className="font-body text-body-md text-text-muted">
                    {insight}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-12 space-y-4 border-t border-border-subtle pt-8">
              <p className="font-body text-body-md text-text-muted">
                <strong className="text-primary">{t('article.audience')}:</strong>{' '}
                {view.audience}
              </p>
              <p className="font-body text-body-md text-text-muted">
                <strong className="text-primary">
                  {t('article.creatorStyle')}:
                </strong>{' '}
                {view.creatorStyle}
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-DEFAULT bg-primary px-8 py-4 font-body text-label-md uppercase tracking-widest text-white"
              >
                {t('article.watch')}
              </a>
              <Link
                to="/brief"
                className="rounded-DEFAULT border border-border-subtle px-8 py-4 font-body text-label-md uppercase tracking-widest"
              >
                {t('article.brief')}
              </Link>
            </div>
          </div>
        </div>
      </article>
    </main>
  )
}
