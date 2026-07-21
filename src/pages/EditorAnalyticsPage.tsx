import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { ErrorState, LoadingState } from '@/components/States'
import { FetchingBanner } from '@/components/GlobalLoadingIndicator'
import { useLocale } from '@/i18n/LocaleContext'
import { formatCount } from '@/lib/utils'

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthLabel(month: string, locale: string) {
  const [y, m] = month.split('-').map(Number)
  try {
    return new Intl.DateTimeFormat(
      locale === 'ko' ? 'ko' : locale === 'ja' ? 'ja' : 'en',
      { year: 'numeric', month: 'long', timeZone: 'UTC' },
    ).format(new Date(Date.UTC(y, m - 1, 1)))
  } catch {
    return month
  }
}

function ViewsChart({
  days,
  series,
}: {
  days: {
    day: number
    total: number
    article: number
    page: number
    media: number
  }[]
  series: 'total' | 'article' | 'page' | 'media'
}) {
  const values = days.map((d) => d[series])
  const max = Math.max(1, ...values)
  const w = 640
  const h = 220
  const padX = 28
  const padY = 16
  const innerW = w - padX * 2
  const innerH = h - padY * 2

  const points = values.map((v, i) => {
    const x = padX + (i / Math.max(1, values.length - 1)) * innerW
    const y = padY + innerH - (v / max) * innerH
    return { x, y, v }
  })

  const line = points.map((p) => `${p.x},${p.y}`).join(' ')
  const area = [
    `${padX},${padY + innerH}`,
    ...points.map((p) => `${p.x},${p.y}`),
    `${padX + innerW},${padY + innerH}`,
  ].join(' ')

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t))

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img">
      {ticks.map((tick) => {
        const y = padY + innerH - (tick / max) * innerH
        return (
          <g key={tick}>
            <line
              x1={padX}
              x2={padX + innerW}
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-border-subtle"
              strokeWidth={1}
            />
            <text
              x={padX - 6}
              y={y + 3}
              textAnchor="end"
              className="fill-text-muted"
              style={{ fontSize: 10 }}
            >
              {tick >= 1000
                ? `${(tick / 1000).toFixed(tick % 1000 ? 1 : 0)}k`
                : tick}
            </text>
          </g>
        )
      })}
      <polygon points={area} className="fill-primary/15" />
      <polyline
        points={line}
        fill="none"
        className="stroke-primary"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p, i) =>
        p.v > 0 ? (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} className="fill-primary" />
        ) : null,
      )}
    </svg>
  )
}

function typeKey(type: 'article' | 'page' | 'media') {
  if (type === 'article') return 'analytics.series.article'
  if (type === 'page') return 'analytics.series.page'
  return 'analytics.series.media'
}

export function EditorAnalyticsPage() {
  const { isEditor, loading: authLoading } = useAuth()
  const { t, locale } = useLocale()
  const nowMonth = new Date().toISOString().slice(0, 7)
  const [month, setMonth] = useState(nowMonth)
  const [series, setSeries] = useState<'total' | 'article' | 'page' | 'media'>(
    'total',
  )

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['analytics-dashboard', month, locale],
    queryFn: () => api.analyticsDashboard(month, locale),
    enabled: isEditor,
  })

  const canGoNext = useMemo(() => month < nowMonth, [month, nowMonth])
  const typeMax = useMemo(() => {
    if (!data) return 1
    return Math.max(1, data.byType.article, data.byType.page, data.byType.media)
  }, [data])

  if (authLoading) return <LoadingState label={t('editor.checking')} />
  if (!isEditor) return <Navigate to="/login" replace />
  if (isLoading && !data) return <LoadingState label={t('analytics.loading')} />
  if (error || !data) {
    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : t('analytics.fail')
        }
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <main className="mx-auto max-w-[1440px] px-8 pt-32 pb-section-gap">
      {isFetching && <FetchingBanner label={t('common.updating')} />}

      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-3 block font-body text-label-md uppercase tracking-widest text-accent-crimson">
            {t('analytics.badge')}
          </span>
          <h1 className="font-display text-display-lg">{t('analytics.title')}</h1>
          <p className="mt-2 max-w-2xl font-body text-body-md text-text-muted">
            {t('analytics.subtitle')}
          </p>
        </div>
        <Link
          to="/editor"
          className="border border-border-subtle px-6 py-3 font-body text-label-md uppercase tracking-widest"
        >
          {t('analytics.backDesk')}
        </Link>
      </div>

      {!data.persistent && (
        <p className="mb-6 rounded-lg border border-border-subtle bg-surface-container-low px-4 py-3 font-body text-body-sm text-text-muted">
          {t('analytics.ephemeralHint')}
        </p>
      )}

      {/* KPI row */}
      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="ambient-shadow rounded-xl bg-surface-pure p-6">
          <div className="font-body text-label-sm uppercase tracking-widest text-text-muted">
            {t('analytics.kpi.total')}
          </div>
          <div className="mt-2 font-display text-display-lg">
            {formatCount(data.monthTotal)}
          </div>
        </div>
        <div className="ambient-shadow rounded-xl bg-surface-pure p-6">
          <div className="font-body text-label-sm uppercase tracking-widest text-text-muted">
            {t('analytics.kpi.mom')}
          </div>
          <div
            className={`mt-2 font-display text-display-lg ${
              (data.momPct ?? 0) >= 0 ? 'text-accent-crimson' : 'text-text-muted'
            }`}
          >
            {data.momPct == null
              ? '—'
              : `${data.momPct >= 0 ? '+' : ''}${Math.round(data.momPct)}%`}
          </div>
        </div>
        <div className="ambient-shadow rounded-xl bg-surface-pure p-6">
          <div className="font-body text-label-sm uppercase tracking-widest text-text-muted">
            {t('analytics.kpi.unique')}
          </div>
          <div className="mt-2 font-display text-display-lg">
            {formatCount(data.uniquePages)}
          </div>
        </div>
        <div className="ambient-shadow rounded-xl bg-surface-pure p-6">
          <div className="font-body text-label-sm uppercase tracking-widest text-text-muted">
            {t('analytics.kpi.peak')}
          </div>
          <div className="mt-2 font-display text-display-lg">
            {data.peakDay
              ? formatCount(data.peakDay.total)
              : '—'}
          </div>
          {data.peakDay && (
            <div className="mt-1 font-body text-label-sm text-text-muted">
              {t('analytics.kpi.peakDay', { n: String(data.peakDay.day) })}
            </div>
          )}
        </div>
      </section>

      {/* Goal */}
      <section className="ambient-shadow mb-8 rounded-xl bg-surface-pure p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-body text-label-sm uppercase tracking-widest text-text-muted">
            {t('analytics.goal')} ({formatCount(data.goal)})
          </span>
          <span className="font-mono text-sm font-bold">
            {Math.round(data.goalProgress * 100)}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-surface-container-low">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, data.goalProgress * 100)}%` }}
          />
        </div>
        <p className="mt-3 font-body text-body-sm text-text-muted">
          {data.neededPerDay > 0
            ? t('analytics.neededPerDay', {
                n: String(Math.ceil(data.neededPerDay)),
              })
            : t('analytics.goalMet')}
        </p>
      </section>

      <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Chart */}
        <section className="ambient-shadow rounded-xl border border-border-subtle bg-surface-pure p-6 md:p-8 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-headline-md">
              {t('analytics.postViews')}
            </h2>
            <div className="flex items-center gap-4 font-body text-label-sm uppercase tracking-widest text-text-muted">
              <button
                type="button"
                className="hover:text-primary"
                onClick={() => setMonth(shiftMonth(month, -1))}
              >
                ← {monthLabel(shiftMonth(month, -1), locale)}
              </button>
              <span className="text-primary">{monthLabel(month, locale)}</span>
              <button
                type="button"
                className={`hover:text-primary ${!canGoNext ? 'opacity-40' : ''}`}
                disabled={!canGoNext}
                onClick={() => canGoNext && setMonth(shiftMonth(month, 1))}
              >
                {monthLabel(shiftMonth(month, 1), locale)} →
              </button>
            </div>
          </div>

          <ViewsChart days={data.days} series={series} />

          <div className="mt-4 flex flex-wrap gap-4">
            {(
              [
                ['total', 'analytics.series.total'],
                ['article', 'analytics.series.article'],
                ['page', 'analytics.series.page'],
                ['media', 'analytics.series.media'],
              ] as const
            ).map(([key, labelKey]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSeries(key)}
                className={`flex items-center gap-2 font-body text-label-sm uppercase tracking-widest ${
                  series === key ? 'text-primary' : 'text-text-muted'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 rounded-sm ${
                    series === key ? 'bg-primary' : 'bg-outline'
                  }`}
                />
                {t(labelKey)}
              </button>
            ))}
          </div>
        </section>

        {/* Views by type */}
        <section className="ambient-shadow rounded-xl border border-border-subtle bg-surface-pure p-6">
          <h2 className="mb-6 font-display text-headline-md">
            {t('analytics.byType')}
          </h2>
          {(
            [
              ['article', data.byType.article],
              ['page', data.byType.page],
              ['media', data.byType.media],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className="mb-5">
              <div className="mb-1 flex justify-between font-body text-label-sm uppercase tracking-widest text-text-muted">
                <span>{t(typeKey(key))}</span>
                <span className="font-mono text-primary">
                  {value.toLocaleString()}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-container-low">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(value / typeMax) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <p className="mt-6 font-body text-body-sm text-text-muted">
            {t('analytics.avgDaily')}:{' '}
            <span className="font-mono text-primary">
              {Math.round(data.avgDaily).toLocaleString()}
            </span>
          </p>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <section className="ambient-shadow rounded-xl border border-border-subtle bg-surface-pure p-6 lg:col-span-3">
          <h2 className="mb-6 font-display text-headline-md">
            {t('analytics.topPages')}
          </h2>
          {data.topPosts.length === 0 ? (
            <p className="font-body text-body-md text-text-muted">
              {t('analytics.topEmpty')}
            </p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle font-body text-label-sm uppercase tracking-widest text-text-muted">
                  <th className="pb-3 pr-3">#</th>
                  <th className="pb-3 pr-3">{t('analytics.colPost')}</th>
                  <th className="pb-3 pr-3">{t('analytics.colType')}</th>
                  <th className="pb-3 text-right">{t('analytics.colViews')}</th>
                </tr>
              </thead>
              <tbody>
                {data.topPosts.map((post) => (
                  <tr
                    key={post.contentId}
                    className="border-b border-border-subtle/60"
                  >
                    <td className="py-4 pr-3 font-display text-headline-md text-primary/30">
                      {post.rank}
                    </td>
                    <td className="py-4 pr-3 font-body text-body-md">
                      {post.href ? (
                        <Link
                          to={post.href}
                          className="text-primary hover:text-accent-crimson"
                        >
                          {post.title}
                        </Link>
                      ) : (
                        post.title
                      )}
                    </td>
                    <td className="py-4 pr-3 font-body text-label-sm uppercase tracking-widest text-text-muted">
                      {t(typeKey(post.contentType))}
                    </td>
                    <td className="py-4 text-right font-mono text-sm font-bold">
                      {post.views.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="ambient-shadow rounded-xl border border-border-subtle bg-surface-pure p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-headline-md">
            {t('analytics.insights')}
          </h2>
          <p className="mb-4 font-body text-label-sm uppercase tracking-widest text-text-muted">
            {t('analytics.insightsHint')}
          </p>
          <ul className="space-y-4">
            {data.summary.map((line, i) => (
              <li
                key={i}
                className="border-l-2 border-primary/40 pl-4 font-body text-body-md text-text-muted"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
