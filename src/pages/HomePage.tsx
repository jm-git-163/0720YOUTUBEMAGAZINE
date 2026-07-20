import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { ArticleCard } from '@/components/ArticleCard'
import { ErrorState, LoadingState } from '@/components/States'
import { FetchingBanner } from '@/components/GlobalLoadingIndicator'
import { formatCount, formatPublishedDate } from '@/lib/utils'
import { useLocale } from '@/i18n/LocaleContext'

export function HomePage() {
  const { t, locale } = useLocale()
  const { data, isLoading, isFetching, error, refetch, isPlaceholderData } =
    useQuery({
      queryKey: ['home', locale],
      queryFn: () => api.home(locale),
    })

  if (isLoading && !data) return <LoadingState label={t('home.loading')} />
  if (error || !data)
    return (
      <ErrorState
        message={error instanceof Error ? error.message : t('home.fail')}
        onRetry={() => refetch()}
      />
    )

  const { cover, coverInsight, trending } = data
  const rest = trending.slice(1)

  if (!trending.length) {
    return (
      <main className="pt-32">
        <ErrorState
          message={t('home.empty')}
          onRetry={() => refetch()}
        />
      </main>
    )
  }

  return (
    <main className="pt-32">
      {(isFetching || isPlaceholderData) && (
        <FetchingBanner label={t('common.updating')} />
      )}
      {cover && (
        <section className="mx-auto mb-section-gap max-w-[1440px] px-8">
          <div className="grid min-h-[70vh] grid-cols-1 items-center gap-gutter lg:grid-cols-12">
            <motion.div
              className="z-10 flex flex-col justify-center pr-0 lg:col-span-5 lg:pr-8"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="mb-6 block font-body text-label-md uppercase tracking-widest text-accent-crimson">
                {t('home.coverStory')}
              </span>
              <h1 className="mb-8 font-display text-display-xl leading-tight text-balance-safe">
                {cover.title}
              </h1>
              <p className="mb-4 line-clamp-4 font-body text-body-lg leading-relaxed text-text-muted">
                {cover.description?.trim() ||
                  t('home.coverDek', { channel: cover.channelTitle })}
              </p>
              {coverInsight && (
                <p className="mb-6 font-body text-body-md leading-relaxed text-text-muted">
                  <span className="mr-2 font-body text-label-sm uppercase tracking-widest text-accent-gold">
                    {t('home.aiSummary')}
                  </span>
                  {coverInsight}
                </p>
              )}
              <p className="mb-10 flex flex-wrap items-center gap-3 font-body text-label-md text-text-muted">
                <span>{cover.channelTitle}</span>
                {cover.publishedAt && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">
                        calendar_today
                      </span>
                      {formatPublishedDate(cover.publishedAt, locale)}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>
                  {formatCount(cover.viewCount)} {t('home.views')}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  to={`/article/${cover.id}`}
                  className="rounded-DEFAULT bg-primary px-8 py-4 font-body text-label-md uppercase tracking-widest text-white transition-all hover:bg-opacity-90"
                >
                  {t('home.readStory')}
                </Link>
                <a
                  href={`https://www.youtube.com/watch?v=${cover.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-accent-crimson">
                    play_circle
                  </span>
                  <span className="font-body text-label-md uppercase tracking-widest text-primary transition-opacity hover:opacity-70">
                    {t('home.watchSegment')}
                  </span>
                </a>
              </div>
            </motion.div>
            <motion.div
              className="relative lg:col-span-7"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <div className="thumb-frame rounded-DEFAULT shadow-2xl">
                <img src={cover.thumbnail} alt={cover.title} />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <section className="mx-auto mb-section-gap max-w-[1440px] bg-surface px-8 py-24">
        <div className="mb-16 flex items-end justify-between">
          <h2 className="font-display text-display-lg">{t('home.trending')}</h2>
          <Link
            to="/search"
            className="flex items-center gap-2 font-body text-label-md uppercase tracking-widest transition-colors hover:text-accent-crimson"
          >
            {t('home.viewAll')}{' '}
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-component-gap md:grid-cols-4">
          {trending[0] && <ArticleCard video={trending[0]} variant="large" />}
          {rest.slice(0, 2).map((v) => (
            <ArticleCard key={v.id} video={v} />
          ))}
          {rest[2] && (
            <Link
              to={`/article/${rest[2].id}`}
              className="group flex cursor-pointer items-center justify-between rounded-lg border border-border-subtle bg-white p-8 transition-shadow duration-300 hover:shadow-lg md:col-span-2"
            >
              <div className="max-w-[70%]">
                <span className="mb-3 flex items-center gap-2 font-body text-label-sm uppercase tracking-widest text-text-muted">
                  <span className="material-symbols-outlined text-[16px]">
                    podcasts
                  </span>
                  {t('home.editorsPick')}
                </span>
                <h3 className="mb-2 font-display text-headline-md leading-snug text-balance-safe">
                  {rest[2].title}
                </h3>
                <p className="font-body text-body-md text-text-muted">
                  {rest[2].channelTitle} •{' '}
                  {formatPublishedDate(rest[2].publishedAt, locale)} •{' '}
                  {formatCount(rest[2].viewCount)} {t('home.views')}
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low transition-colors group-hover:bg-primary group-hover:text-white">
                <span className="material-symbols-outlined">play_arrow</span>
              </div>
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}
