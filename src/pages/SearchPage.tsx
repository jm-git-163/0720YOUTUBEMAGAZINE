import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ArticleCard } from '@/components/ArticleCard'
import { ErrorState, LoadingState } from '@/components/States'
import { FetchingBanner } from '@/components/GlobalLoadingIndicator'
import { CATEGORY_IDS, localizeCategory } from '@/i18n/categories'
import { useLocale } from '@/i18n/LocaleContext'

export function SearchPage() {
  const { t, locale } = useLocale()
  const [params, setParams] = useSearchParams()
  const defaultQ = t('search.defaultQuery')
  const initial = params.get('q') ?? defaultQ
  const [query, setQuery] = useState(initial)

  useEffect(() => {
    setQuery(params.get('q') ?? t('search.defaultQuery'))
  }, [params, t])

  const q = params.get('q') ?? defaultQ
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['search', q, locale],
    queryFn: () => api.search(q, locale),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = query.trim() || 'AI'
    setParams({ q: next })
  }

  return (
    <main className="mx-auto max-w-[1440px] px-8 pt-32 pb-section-gap">
      {isFetching && Boolean(data) && (
        <FetchingBanner label={t('search.loading')} />
      )}

      <header className="mb-12 max-w-3xl">
        <h1 className="mb-4 font-display text-display-lg">{t('search.title')}</h1>
        <p className="mb-8 font-body text-body-lg text-text-muted">
          {t('search.subtitle')}
        </p>
        <form onSubmit={submit} className="flex gap-0">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border border-border-subtle bg-surface px-4 py-4 font-body text-body-md transition-colors focus:border-2 focus:border-primary focus:outline-none"
            placeholder={t('search.placeholder')}
          />
          <button
            type="submit"
            className="bg-primary px-8 font-body text-label-md uppercase tracking-widest text-white"
          >
            {t('search.button')}
          </button>
        </form>
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORY_IDS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setQuery(cat)
                setParams({ q: cat })
              }}
              className="rounded-full bg-surface-container-low px-3 py-1 font-body text-label-sm text-text-muted transition-colors hover:text-primary"
            >
              {localizeCategory(cat, locale)}
            </button>
          ))}
        </div>
      </header>

      {isLoading && !data && <LoadingState label={t('search.loading')} />}
      {error && (
        <ErrorState
          message={error instanceof Error ? error.message : t('search.fail')}
          onRetry={() => refetch()}
        />
      )}
      {data && (
        <>
          <p className="mb-8 font-body text-label-md uppercase tracking-widest text-text-muted">
            {data.items.length} {t('search.results')} &ldquo;{data.query}&rdquo;
          </p>
          <div
            className={`grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3 ${isFetching ? 'opacity-70' : ''}`}
          >
            {data.items.map((video) => (
              <ArticleCard key={video.id} video={video} variant="compact" />
            ))}
          </div>
          {data.items.length === 0 && (
            <p className="font-body text-body-md text-text-muted">
              {t('search.empty')}{' '}
              <Link to="/" className="text-accent-crimson">
                {t('search.backHome')}
              </Link>
            </p>
          )}
        </>
      )}
    </main>
  )
}
