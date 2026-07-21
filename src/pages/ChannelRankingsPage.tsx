import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { CategoryChip } from '@/components/CategoryChip'
import { ErrorState, LoadingState } from '@/components/States'
import { FetchingBanner } from '@/components/GlobalLoadingIndicator'
import { formatCount } from '@/lib/utils'
import { localizeCategory } from '@/i18n/categories'
import { useLocale } from '@/i18n/LocaleContext'

const FILTERS = [
  { id: 'all', labelKey: 'rankings.allSectors' },
  { id: 'Technology', labelKey: 'rankings.filter.technology' },
  { id: 'Finance', labelKey: 'rankings.filter.finance' },
  { id: 'AI', labelKey: 'rankings.filter.ai' },
  { id: 'Design', labelKey: 'rankings.filter.design' },
] as const

export function ChannelRankingsPage() {
  const { t, locale } = useLocale()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')

  const { data, isLoading, isFetching, error, refetch, isPlaceholderData } =
    useQuery({
      queryKey: ['channel-rankings', filter, locale],
      queryFn: () => api.rankings(filter, locale),
    })

  const items = useMemo(() => {
    if (!data?.items) return []
    return [...data.items]
      .sort((a, b) => {
        const sub = b.channel.subscriberCount - a.channel.subscriberCount
        if (sub !== 0) return sub
        return b.channel.viewCount - a.channel.viewCount
      })
      .map((item, index) => ({ ...item, rank: index + 1 }))
  }, [data?.items])

  if (isLoading && !data) return <LoadingState label={t('channels.loading')} />
  if (error || !data)
    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : t('channels.fail')
        }
        onRetry={() => refetch()}
      />
    )

  return (
    <main className="mx-auto w-full max-w-[1440px] px-8 pt-32 pb-section-gap">
      {(isFetching || isPlaceholderData) && (
        <FetchingBanner label={t('common.updating')} />
      )}
      <header className="mx-auto mb-section-gap max-w-4xl text-center">
        <h1 className="mb-stack-md font-display text-display-xl">
          {t('channels.title')}
        </h1>
        <p className="font-body text-body-lg text-text-muted">
          {t('channels.subtitle')}
        </p>
      </header>

      <section className="mb-section-gap grid grid-cols-1 gap-gutter md:grid-cols-12">
        <div className="flex flex-col justify-end md:col-span-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="mr-4 font-body text-label-sm uppercase tracking-widest text-text-muted">
              {t('rankings.filter')}
            </span>
            {FILTERS.map((f) => (
              <CategoryChip
                key={f.id}
                label={t(f.labelKey)}
                active={filter === f.id}
                onClick={() => setFilter(f.id)}
              />
            ))}
          </div>
        </div>
        <div className="ambient-shadow flex flex-col justify-between rounded-lg bg-surface-pure p-6 md:col-span-4">
          <div className="mb-4 flex items-start justify-between">
            <h3 className="font-body text-label-md uppercase tracking-widest text-text-muted">
              {t('rankings.sectorVelocity')}
            </h3>
            <span className="material-symbols-outlined text-sm text-accent-crimson">
              trending_up
            </span>
          </div>
          <div className="space-y-4">
            {data.sectorVelocity.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span
                    className={
                      s.change > 10 ? 'text-accent-crimson' : 'text-text-muted'
                    }
                  >
                    +{s.change.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container-low">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${s.width}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-gutter">
        {items.map((item) => (
          <article
            key={item.channel.id}
            className="ambient-shadow group grid cursor-pointer grid-cols-1 items-center gap-8 rounded-xl border border-transparent bg-surface-pure p-8 transition-all duration-500 hover:border-border-subtle md:grid-cols-12"
          >
            <div className="flex justify-center md:col-span-1 md:justify-start">
              <span className="font-display text-display-lg font-black text-primary opacity-20 transition-opacity group-hover:opacity-100">
                {String(item.rank).padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center gap-6 md:col-span-5">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-surface-container-low">
                <img
                  className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                  src={item.channel.thumbnail}
                  alt={item.channel.title}
                />
              </div>
              <div>
                <span className="mb-2 inline-block rounded-full bg-surface-container-low px-2 py-1 font-body text-label-sm uppercase tracking-wider text-text-muted">
                  {localizeCategory(item.channel.category, locale)}
                </span>
                <h2 className="mb-1 font-display text-headline-md">
                  {item.channel.title}
                </h2>
                <p className="font-body text-body-md text-text-muted">
                  {item.blurb}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-border-subtle md:col-span-4 md:border-l md:pl-8">
              <div>
                <span className="mb-1 block font-body text-label-sm uppercase tracking-widest text-text-muted">
                  {t('channels.subscribers')}
                </span>
                <span className="font-display text-headline-md">
                  {formatCount(item.channel.subscriberCount)}
                </span>
              </div>
              <div>
                <span className="mb-1 block font-body text-label-sm uppercase tracking-widest text-text-muted">
                  {t('channels.totalViews')}
                </span>
                <span className="font-display text-headline-md">
                  {formatCount(item.channel.viewCount)}
                </span>
              </div>
              <div>
                <span className="mb-1 block font-body text-label-sm uppercase tracking-widest text-text-muted">
                  {t('channels.videos')}
                </span>
                <span className="font-display text-headline-md">
                  {formatCount(item.channel.videoCount)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end md:col-span-2">
              <Link
                to={`/search?q=${encodeURIComponent(item.channel.title)}`}
                className="font-body text-label-sm uppercase tracking-widest text-primary transition-colors hover:text-accent-crimson"
              >
                {t('rankings.viewChannel')}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
