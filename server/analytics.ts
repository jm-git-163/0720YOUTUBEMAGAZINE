import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export type ContentType = 'article' | 'page' | 'media'

export const MONTHLY_PV_GOAL = 10_000

export interface TrackInput {
  path: string
  contentType: ContentType
  contentId?: string
  title?: string
  referrer?: string
  locale?: string
}

interface ContentAgg {
  views: number
  title: string
  contentType: ContentType
}

interface DayAgg {
  total: number
  article: number
  page: number
  media: number
  byContent: Record<string, ContentAgg>
}

interface AnalyticsStore {
  version: 1
  days: Record<string, DayAgg>
}

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'youtube-magazine-ai')
  : path.resolve(process.cwd(), 'data')
const STORE_PATH = path.join(DATA_DIR, 'analytics.json')
const REDIS_KEY = 'ym:analytics:v1'

function emptyDay(): DayAgg {
  return { total: 0, article: 0, page: 0, media: 0, byContent: {} }
}

function emptyStore(): AnalyticsStore {
  return { version: 1, days: {} }
}

function hasUpstash() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  )
}

async function redisGet(): Promise<AnalyticsStore | null> {
  if (!hasUpstash()) return null
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, '')
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['GET', REDIS_KEY]),
    })
    if (!res.ok) return null
    const body = (await res.json()) as { result?: string | null }
    if (!body.result) return null
    return JSON.parse(body.result) as AnalyticsStore
  } catch (err) {
    console.warn('analytics redis get failed', err)
    return null
  }
}

async function redisSet(store: AnalyticsStore): Promise<void> {
  if (!hasUpstash()) return
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, '')
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['SET', REDIS_KEY, JSON.stringify(store)]),
    })
  } catch (err) {
    console.warn('analytics redis set failed', err)
  }
}

function readFileStore(): AnalyticsStore {
  try {
    if (!existsSync(STORE_PATH)) return emptyStore()
    return JSON.parse(readFileSync(STORE_PATH, 'utf8')) as AnalyticsStore
  } catch {
    return emptyStore()
  }
}

function writeFileStore(store: AnalyticsStore) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(STORE_PATH, JSON.stringify(store), 'utf8')
}

let memory: AnalyticsStore | null = null
let hydrated = false

async function loadStore(): Promise<AnalyticsStore> {
  if (memory && hydrated) return memory
  const fromRedis = await redisGet()
  memory = fromRedis ?? readFileStore()
  hydrated = true
  return memory
}

async function persist(store: AnalyticsStore) {
  memory = store
  writeFileStore(store)
  await redisSet(store)
}

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function classifyPath(pathname: string): {
  contentType: ContentType
  contentId?: string
} | null {
  if (
    pathname.startsWith('/editor') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api')
  ) {
    return null
  }
  const article = pathname.match(/^\/article\/([^/]+)\/?$/)
  if (article) {
    return { contentType: 'article', contentId: article[1] }
  }
  if (pathname === '/' || pathname === '') {
    return { contentType: 'page', contentId: 'home' }
  }
  if (pathname.startsWith('/brief')) {
    return { contentType: 'page', contentId: 'brief' }
  }
  if (pathname.startsWith('/channels')) {
    return { contentType: 'page', contentId: 'channels' }
  }
  if (pathname.startsWith('/creators') || pathname.startsWith('/rankings')) {
    return { contentType: 'page', contentId: 'creators' }
  }
  if (pathname.startsWith('/search')) {
    return { contentType: 'media', contentId: 'search' }
  }
  return null
}

export async function recordPageview(input: TrackInput): Promise<void> {
  const store = await loadStore()
  const key = dayKey()
  const day = store.days[key] ?? emptyDay()
  day.total += 1
  day[input.contentType] += 1

  const id =
    input.contentId ||
    (input.contentType === 'article' ? input.path : input.path || 'unknown')
  const prev = day.byContent[id]
  day.byContent[id] = {
    views: (prev?.views ?? 0) + 1,
    title: input.title?.trim() || prev?.title || id,
    contentType: input.contentType,
  }

  store.days[key] = day
  await persist(store)
}

export interface DashboardDay {
  day: number
  date: string
  total: number
  article: number
  page: number
  media: number
}

export interface TopPost {
  rank: number
  contentId: string
  title: string
  views: number
  contentType: ContentType
  href?: string
}

export interface AnalyticsDashboard {
  month: string
  goal: number
  monthTotal: number
  prevMonthTotal: number
  momPct: number | null
  uniquePages: number
  peakDay: { day: number; date: string; total: number } | null
  avgDaily: number
  byType: { article: number; page: number; media: number }
  topPageType: ContentType | null
  goalProgress: number
  neededPerDay: number
  daysRemaining: number
  today: number
  yesterday: number
  todayDeltaPct: number | null
  persistent: boolean
  days: DashboardDay[]
  topPosts: TopPost[]
  summary: string[]
  locale: string
}

function typeLabel(type: ContentType, locale: string) {
  if (locale === 'ko') {
    if (type === 'article') return '글'
    if (type === 'page') return '페이지'
    return '미디어'
  }
  if (locale === 'ja') {
    if (type === 'article') return '記事'
    if (type === 'page') return 'ページ'
    return 'メディア'
  }
  if (type === 'article') return 'Posts'
  if (type === 'page') return 'Pages'
  return 'Media'
}

function buildRuleSummary(input: {
  monthTotal: number
  prevMonthTotal: number
  momPct: number | null
  uniquePages: number
  peakDay: { day: number; date: string; total: number } | null
  avgDaily: number
  topPageType: ContentType | null
  goalProgress: number
  neededPerDay: number
  topPosts: TopPost[]
  locale: string
}): string[] {
  const { locale } = input
  if (input.monthTotal === 0) {
    if (locale === 'ko') {
      return [
        '아직 수집된 트래픽이 없습니다. 홈·브리프·랭킹·검색·기사 등 주요 페이지 방문이 기록되면 요약이 표시됩니다.',
      ]
    }
    if (locale === 'ja') {
      return [
        'まだトラフィックがありません。主要ページへの訪問が記録されると要約が表示されます。',
      ]
    }
    return [
      'No traffic collected yet. Summaries appear once major pages receive visits.',
    ]
  }

  const lines: string[] = []
  const pct = Math.round(input.goalProgress * 100)

  if (locale === 'ko') {
    if (input.momPct != null) {
      const dir = input.momPct >= 0 ? '증가' : '감소'
      lines.push(
        `MoM: 전월 ${input.prevMonthTotal.toLocaleString()} PV 대비 ${Math.abs(Math.round(input.momPct))}% ${dir}.`,
      )
    } else {
      lines.push('MoM: 전월 데이터가 없어 비교할 수 없습니다.')
    }
    if (input.peakDay) {
      lines.push(
        `Peak Day: ${input.peakDay.day}일 (${input.peakDay.total.toLocaleString()} PV).`,
      )
    }
    if (input.topPageType) {
      lines.push(
        `Top Page Type: ${typeLabel(input.topPageType, locale)} 비중이 가장 큽니다.`,
      )
    }
    if (input.topPosts[0]) {
      lines.push(
        `Top Page: 「${input.topPosts[0].title}」 (${input.topPosts[0].views.toLocaleString()}회).`,
      )
    }
    lines.push(
      `Avg Daily: 일평균 ${Math.round(input.avgDaily).toLocaleString()} PV · Unique Pages ${input.uniquePages} · 월 목표 ${pct}%.`,
    )
    if (input.neededPerDay > 0) {
      lines.push(
        `목표까지 남은 기간 하루 약 ${Math.ceil(input.neededPerDay).toLocaleString()} PV가 필요합니다.`,
      )
    }
    return lines
  }

  if (locale === 'ja') {
    if (input.momPct != null) {
      const dir = input.momPct >= 0 ? '増' : '減'
      lines.push(
        `MoM: 先月 ${input.prevMonthTotal.toLocaleString()} PV から ${Math.abs(Math.round(input.momPct))}% ${dir}。`,
      )
    }
    if (input.peakDay) {
      lines.push(
        `Peak Day: ${input.peakDay.day}日 (${input.peakDay.total.toLocaleString()} PV)。`,
      )
    }
    if (input.topPageType) {
      lines.push(
        `Top Page Type: ${typeLabel(input.topPageType, locale)}。`,
      )
    }
    if (input.topPosts[0]) {
      lines.push(
        `Top Page: 「${input.topPosts[0].title}」 (${input.topPosts[0].views.toLocaleString()}回)。`,
      )
    }
    lines.push(
      `Avg Daily: 1日平均 ${Math.round(input.avgDaily).toLocaleString()} PV · Unique Pages ${input.uniquePages}。`,
    )
    return lines
  }

  if (input.momPct != null) {
    const dir = input.momPct >= 0 ? 'up' : 'down'
    lines.push(
      `MoM: ${Math.abs(Math.round(input.momPct))}% ${dir} vs prior month (${input.prevMonthTotal.toLocaleString()} PV).`,
    )
  } else {
    lines.push('MoM: no prior-month data to compare.')
  }
  if (input.peakDay) {
    lines.push(
      `Peak Day: day ${input.peakDay.day} with ${input.peakDay.total.toLocaleString()} PV.`,
    )
  }
  if (input.topPageType) {
    lines.push(`Top Page Type: ${typeLabel(input.topPageType, locale)}.`)
  }
  if (input.topPosts[0]) {
    lines.push(
      `Top Page: “${input.topPosts[0].title}” (${input.topPosts[0].views.toLocaleString()} views).`,
    )
  }
  lines.push(
    `Avg Daily: ${Math.round(input.avgDaily).toLocaleString()} PV · Unique Pages ${input.uniquePages} · ${pct}% of monthly goal.`,
  )
  if (input.neededPerDay > 0) {
    lines.push(
      `Need ~${Math.ceil(input.neededPerDay).toLocaleString()} PV/day to hit the 10k goal.`,
    )
  }
  return lines
}

export async function getDashboard(
  month: string,
  locale = 'en',
): Promise<AnalyticsDashboard> {
  const store = await loadStore()
  const match = /^(\d{4})-(\d{2})$/.exec(month)
  const now = new Date()
  const year = match ? Number(match[1]) : now.getUTCFullYear()
  const monthNum = match ? Number(match[2]) : now.getUTCMonth() + 1
  const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`
  const dim = daysInMonth(year, monthNum)

  const days: DashboardDay[] = []
  const contentMonth: Record<string, ContentAgg> = {}
  let monthTotal = 0
  const byType = { article: 0, page: 0, media: 0 }

  for (let d = 1; d <= dim; d++) {
    const date = `${monthKey}-${String(d).padStart(2, '0')}`
    const agg = store.days[date] ?? emptyDay()
    days.push({
      day: d,
      date,
      total: agg.total,
      article: agg.article,
      page: agg.page,
      media: agg.media,
    })
    monthTotal += agg.total
    byType.article += agg.article
    byType.page += agg.page
    byType.media += agg.media
    for (const [id, c] of Object.entries(agg.byContent)) {
      const prev = contentMonth[id]
      contentMonth[id] = {
        views: (prev?.views ?? 0) + c.views,
        title: c.title || prev?.title || id,
        contentType: c.contentType,
      }
    }
  }

  // Prior month total for MoM
  const prevDate = new Date(Date.UTC(year, monthNum - 2, 1))
  const prevKey = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`
  const prevDim = daysInMonth(prevDate.getUTCFullYear(), prevDate.getUTCMonth() + 1)
  let prevMonthTotal = 0
  for (let d = 1; d <= prevDim; d++) {
    const date = `${prevKey}-${String(d).padStart(2, '0')}`
    prevMonthTotal += store.days[date]?.total ?? 0
  }
  const momPct =
    prevMonthTotal > 0
      ? ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100
      : null

  const peakDayRaw = [...days].sort((a, b) => b.total - a.total)[0]
  const peakDay =
    peakDayRaw && peakDayRaw.total > 0
      ? { day: peakDayRaw.day, date: peakDayRaw.date, total: peakDayRaw.total }
      : null

  const uniquePages = Object.keys(contentMonth).length
  const isCurrentMonth =
    now.getUTCFullYear() === year && now.getUTCMonth() + 1 === monthNum
  const elapsedDays = isCurrentMonth
    ? Math.max(1, now.getUTCDate())
    : Math.max(1, days.filter((d) => d.total > 0).length || dim)
  const avgDaily = monthTotal / elapsedDays

  const topPageTypeEntry = (
    [
      ['article', byType.article],
      ['page', byType.page],
      ['media', byType.media],
    ] as const
  ).sort((a, b) => b[1] - a[1])[0]
  const topPageType =
    topPageTypeEntry[1] > 0 ? (topPageTypeEntry[0] as ContentType) : null

  const todayKey = dayKey(now)
  const y = new Date(now)
  y.setUTCDate(y.getUTCDate() - 1)
  const yesterdayKey = dayKey(y)
  const today = store.days[todayKey]?.total ?? 0
  const yesterday = store.days[yesterdayKey]?.total ?? 0
  const todayDeltaPct =
    yesterday > 0 ? ((today - yesterday) / yesterday) * 100 : null

  const dayOfMonth = isCurrentMonth ? now.getUTCDate() : dim
  const daysRemaining = Math.max(1, dim - dayOfMonth + (isCurrentMonth ? 1 : 0))
  const remaining = Math.max(0, MONTHLY_PV_GOAL - monthTotal)
  const neededPerDay = remaining / daysRemaining
  const goalProgress = Math.min(1, monthTotal / MONTHLY_PV_GOAL)

  const topPosts: TopPost[] = Object.entries(contentMonth)
    .map(([contentId, c]) => ({
      rank: 0,
      contentId,
      title: c.title,
      views: c.views,
      contentType: c.contentType,
      href:
        c.contentType === 'article'
          ? `/article/${contentId}`
          : contentId === 'home'
            ? '/'
            : contentId === 'brief'
              ? '/brief'
              : contentId === 'channels'
                ? '/channels'
                : contentId === 'creators'
                  ? '/creators'
                  : contentId === 'search'
                    ? '/search'
                    : undefined,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)
    .map((p, i) => ({ ...p, rank: i + 1 }))

  const summary = buildRuleSummary({
    monthTotal,
    prevMonthTotal,
    momPct,
    uniquePages,
    peakDay,
    avgDaily,
    topPageType,
    goalProgress,
    neededPerDay: remaining > 0 ? neededPerDay : 0,
    topPosts,
    locale,
  })

  return {
    month: monthKey,
    goal: MONTHLY_PV_GOAL,
    monthTotal,
    prevMonthTotal,
    momPct,
    uniquePages,
    peakDay,
    avgDaily,
    byType,
    topPageType,
    goalProgress,
    neededPerDay: remaining > 0 ? neededPerDay : 0,
    daysRemaining,
    today,
    yesterday,
    todayDeltaPct,
    persistent: hasUpstash(),
    days,
    topPosts,
    summary,
    locale,
  }
}
