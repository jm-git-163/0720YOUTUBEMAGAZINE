import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AiScoreMeter } from '@/components/AiScoreMeter'
import { ArticleCard } from '@/components/ArticleCard'
import { ErrorState, LoadingState } from '@/components/States'
import { FetchingBanner } from '@/components/GlobalLoadingIndicator'
import { useLocale } from '@/i18n/LocaleContext'
import { localizeCategory } from '@/i18n/categories'

export function BriefPage() {
  const { t, locale } = useLocale()
  const { data, isLoading, isFetching, error, refetch, isPlaceholderData } =
    useQuery({
      queryKey: ['brief', locale],
      queryFn: () => api.brief(locale),
    })

  if (isLoading && !data) return <LoadingState label={t('brief.loading')} />
  if (error || !data)
    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : t('brief.fail')
        }
        onRetry={() => refetch()}
      />
    )

  return (
    <main className="mx-auto max-w-[1440px] px-8 pt-[120px] pb-section-gap md:px-16">
      {(isFetching || isPlaceholderData) && (
        <FetchingBanner label={t('common.updating')} />
      )}
      <section className="mb-section-gap">
        <div className="grid grid-cols-1 items-center gap-gutter md:grid-cols-12">
          <div className="group relative order-2 overflow-hidden rounded-xl ambient-shadow md:order-1 md:col-span-7 lg:col-span-8">
            {data.cover && (
              <>
                <div className="thumb-frame">
                  <img
                    className="transition-transform duration-700 ease-out group-hover:scale-105"
                    src={data.cover.thumbnail}
                    alt={data.cover.title}
                  />
                </div>
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-primary/90 to-transparent p-8 md:p-12">
                  <span className="mb-4 inline-block rounded-full bg-surface-pure px-3 py-1 font-body text-label-sm uppercase tracking-widest text-text-muted">
                    {localizeCategory(data.cover.category, locale)}
                  </span>
                  <h1 className="mb-4 font-display text-display-lg leading-tight text-balance-safe text-on-primary">
                    {data.headline}
                  </h1>
                  <p className="max-w-2xl font-body text-body-lg leading-relaxed text-inverse-on-surface opacity-90">
                    {data.dek}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="order-1 flex flex-col justify-center space-y-8 md:order-2 md:col-span-5 lg:col-span-4">
            <div className="glass-panel ambient-shadow space-y-4 rounded-lg border border-border-subtle p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-body text-label-md uppercase tracking-widest text-text-muted">
                  {t('brief.intelligenceIndex')}
                </h3>
                <span
                  className="material-symbols-outlined text-accent-gold"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  analytics
                </span>
              </div>
              <AiScoreMeter
                label={t('brief.marketSentiment')}
                value={data.sentiment}
              />
              <AiScoreMeter
                label={t('brief.velocity')}
                value={data.velocity}
                accent="crimson"
              />
            </div>
            <div className="space-y-6">
              <h2 className="font-display text-headline-md text-primary">
                {t('brief.notes')}
              </h2>
              <ul className="space-y-4 font-body text-body-md text-text-muted">
                {data.notes.map((note) => (
                  <li key={note} className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-1 text-[20px] text-accent-crimson">
                      play_arrow
                    </span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-section-gap">
        <div className="mb-12 flex items-baseline justify-between border-b border-border-subtle pb-4">
          <h2 className="font-display text-headline-md tracking-tight text-primary">
            {t('brief.digest')}
          </h2>
          <Link
            to="/search"
            className="font-body text-label-md uppercase tracking-widest text-text-muted transition-colors hover:text-primary"
          >
            {t('brief.viewAll')}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {data.digest.map((video, i) => (
            <ArticleCard
              key={video.id}
              video={video}
              variant="compact"
              score={88 - i * 2}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
