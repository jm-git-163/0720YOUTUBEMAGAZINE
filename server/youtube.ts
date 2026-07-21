import type { ChannelItem, VideoItem } from './types'
import { hasYouTubeKey } from './types'
import { mockChannels, mockVideos } from './mock'
import {
  curateMagazineFeed,
  FEED_MAX_AGE_DAYS,
  publishedAfterIso,
} from './curation'

const YT = 'https://www.googleapis.com/youtube/v3'

function thumb(snippet: {
  thumbnails?: Record<string, { url?: string }>
}): string {
  const t = snippet.thumbnails
  return (
    t?.maxres?.url ||
    t?.standard?.url ||
    t?.high?.url ||
    t?.medium?.url ||
    t?.default?.url ||
    ''
  )
}

function mapVideo(item: {
  id: string | { videoId?: string }
  snippet?: Record<string, unknown>
  statistics?: Record<string, string>
  contentDetails?: { duration?: string }
}): VideoItem {
  const id = typeof item.id === 'string' ? item.id : item.id.videoId || ''
  const sn = (item.snippet ?? {}) as {
    title?: string
    description?: string
    channelId?: string
    channelTitle?: string
    publishedAt?: string
    tags?: string[]
    categoryId?: string
    thumbnails?: Record<string, { url?: string }>
  }
  const st = item.statistics ?? {}
  return {
    id,
    title: sn.title ?? 'Untitled',
    description: sn.description ?? '',
    thumbnail: thumb(sn),
    channelId: sn.channelId ?? '',
    channelTitle: sn.channelTitle ?? '',
    publishedAt: sn.publishedAt ?? new Date().toISOString(),
    viewCount: Number(st.viewCount ?? 0),
    likeCount: Number(st.likeCount ?? 0),
    commentCount: Number(st.commentCount ?? 0),
    duration: item.contentDetails?.duration,
    tags: sn.tags,
    category: guessCategory(sn.title ?? '', sn.description ?? ''),
  }
}

function mapChannel(item: {
  id: string
  snippet?: Record<string, unknown>
  statistics?: Record<string, string>
}): ChannelItem {
  const sn = (item.snippet ?? {}) as {
    title?: string
    description?: string
    thumbnails?: Record<string, { url?: string }>
  }
  const st = item.statistics ?? {}
  return {
    id: item.id,
    title: sn.title ?? 'Channel',
    description: sn.description ?? '',
    thumbnail: thumb(sn),
    subscriberCount: Number(st.subscriberCount ?? 0),
    videoCount: Number(st.videoCount ?? 0),
    viewCount: Number(st.viewCount ?? 0),
    category: guessCategory(sn.title ?? '', sn.description ?? ''),
  }
}

export function guessCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase()
  if (/\b(ai|llm|gpt|openai|machine learning|neural)\b/.test(text)) return 'AI'
  if (/\b(finance|stock|invest|crypto|market)\b/.test(text)) return 'Finance'
  if (/\b(design|ui|ux|figma|typography)\b/.test(text)) return 'Design'
  if (/\b(game|gaming|esport)\b/.test(text)) return 'Gaming'
  if (/\b(travel|hotel|flight)\b/.test(text)) return 'Travel'
  if (/\b(music|song|album)\b/.test(text)) return 'Music'
  if (/\b(lifestyle|health|fitness)\b/.test(text)) return 'Lifestyle'
  return 'Technology'
}

async function ytFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.YOUTUBE_API_KEY!
  const url = new URL(`${YT}/${path}`)
  url.searchParams.set('key', key)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`YouTube API error ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

export type SearchLocale = 'ko' | 'en' | 'ja'

const LOCALE_SEARCH: Record<
  SearchLocale,
  { relevanceLanguage: string; regionCode: string; primary: string; secondary: string }
> = {
  ko: {
    relevanceLanguage: 'ko',
    regionCode: 'KR',
    primary: 'AI 인공지능 GPT Claude Gemini 뉴스',
    secondary: '인공지능 기술 트렌드',
  },
  en: {
    relevanceLanguage: 'en',
    regionCode: 'US',
    primary: 'AI news GPT Claude Gemini',
    secondary: 'artificial intelligence technology',
  },
  ja: {
    relevanceLanguage: 'ja',
    regionCode: 'JP',
    primary: 'AI 人工知能 GPT Claude Gemini ニュース',
    secondary: '人工知能 テクノロジー',
  },
}

export async function searchVideos(
  query: string,
  maxResults = 12,
  options?: {
    publishedAfterDays?: number
    order?: 'relevance' | 'date' | 'viewCount' | 'rating'
    locale?: SearchLocale
  },
): Promise<VideoItem[]> {
  if (!hasYouTubeKey()) {
    const q = query.toLowerCase()
    let filtered = mockVideos.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.category?.toLowerCase().includes(q) ||
        q.includes((v.category ?? '').toLowerCase()),
    )
    if (!filtered.length) filtered = [...mockVideos]
    if (options?.publishedAfterDays) {
      const cutoff = Date.now() - options.publishedAfterDays * 86_400_000
      filtered = filtered.filter(
        (v) => new Date(v.publishedAt).getTime() >= cutoff,
      )
    }
    return filtered
  }

  const loc = LOCALE_SEARCH[options?.locale ?? 'en']
  const params: Record<string, string> = {
    part: 'snippet',
    type: 'video',
    q: query,
    maxResults: String(Math.min(maxResults, 50)),
    order: options?.order ?? 'relevance',
    regionCode: loc.regionCode,
    relevanceLanguage: loc.relevanceLanguage,
  }

  if (options?.publishedAfterDays) {
    params.publishedAfter = publishedAfterIso(options.publishedAfterDays)
  }

  const search = await ytFetch<{
    items: { id: { videoId?: string } }[]
  }>('search', params)

  const ids = (search.items ?? [])
    .map((i) => i.id.videoId)
    .filter((id): id is string => Boolean(id))

  if (!ids.length) return []
  return getVideosByIds(ids)
}

export async function getVideosByIds(ids: string[]): Promise<VideoItem[]> {
  if (!ids.length) return []
  if (!hasYouTubeKey()) {
    return mockVideos.filter((v) => ids.includes(v.id))
  }

  try {
    const data = await ytFetch<{
      items?: Parameters<typeof mapVideo>[0][]
    }>('videos', {
      part: 'snippet,statistics,contentDetails',
      id: ids.join(','),
    })
    const mapped = (data.items ?? []).map(mapVideo)
    if (mapped.length) return mapped
  } catch (err) {
    console.warn('getVideosByIds failed, trying mock', err)
  }
  return mockVideos.filter((v) => ids.includes(v.id))
}

export async function getVideo(id: string): Promise<VideoItem | null> {
  // Prefer curated mock cards so home titles match article pages
  // (mock IDs are real YouTube ids used only for thumbnails/watch links).
  const mock = mockVideos.find((v) => v.id === id)
  if (mock) return mock

  const list = await getVideosByIds([id])
  return list[0] ?? null
}

export async function getChannelsByIds(ids: string[]): Promise<ChannelItem[]> {
  if (!ids.length) return []
  if (!hasYouTubeKey()) {
    return mockChannels.filter((c) => ids.includes(c.id))
  }
  try {
    const data = await ytFetch<{
      items?: Parameters<typeof mapChannel>[0][]
    }>('channels', {
      part: 'snippet,statistics',
      id: ids.join(','),
    })
    const mapped = (data.items ?? []).map(mapChannel)
    if (mapped.length) return mapped
  } catch (err) {
    console.warn('getChannelsByIds failed, trying mock', err)
  }
  return mockChannels.filter((c) => ids.includes(c.id))
}

export async function getChannel(id: string): Promise<ChannelItem | null> {
  const list = await getChannelsByIds([id])
  return list[0] ?? mockChannels.find((c) => c.id === id) ?? null
}

export async function searchChannels(
  query: string,
  maxResults = 10,
): Promise<ChannelItem[]> {
  if (!hasYouTubeKey()) {
    const q = query.toLowerCase()
    if (q === 'all' || q.includes('creator') || q.includes('technology')) {
      return mockChannels.slice(0, maxResults)
    }
    const filtered = mockChannels.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        q.includes((c.category ?? '').toLowerCase()),
    )
    return (filtered.length ? filtered : mockChannels).slice(0, maxResults)
  }

  const search = await ytFetch<{
    items: { id: { channelId?: string } }[]
  }>('search', {
    part: 'snippet',
    type: 'channel',
    q: query === 'all' ? 'technology creator' : query,
    maxResults: String(maxResults),
    order: 'relevance',
  })

  const ids = search.items
    .map((i) => i.id.channelId)
    .filter((id): id is string => Boolean(id))

  return getChannelsByIds(ids)
}

/**
 * Shared desk feed for Home / Brief (language-agnostic).
 * Uses ONE search call when possible — search.list costs 100 quota units.
 * Locale display is handled by translateVideos; do not call this per-language.
 * On quota errors, falls back to curated mock so the magazine still renders.
 */
export async function trendingTechVideos(maxResults = 12): Promise<VideoItem[]> {
  if (!hasYouTubeKey()) {
    return curateMagazineFeed(mockVideos, maxResults)
  }

  // Fixed EN desk query so KO/EN/JA share one YouTube raw cache.
  const locale: SearchLocale = 'en'
  const loc = LOCALE_SEARCH[locale]
  const byId = new Map<string, VideoItem>()
  let quotaHit = false

  const merge = (list: VideoItem[]) => {
    for (const v of list) byId.set(v.id, v)
  }

  try {
    merge(
      await searchVideos(loc.primary, 25, {
        publishedAfterDays: FEED_MAX_AGE_DAYS,
        order: 'relevance',
        locale,
      }),
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    quotaHit = msg.includes('429') || msg.toLowerCase().includes('quota')
    console.warn('magazine primary search failed', err)
  }

  // Only burn a second search.list when primary is clearly short.
  const needSecondary = byId.size < Math.ceil(maxResults * 0.6)
  if (needSecondary && !quotaHit) {
    try {
      merge(
        await searchVideos(loc.secondary, 15, {
          publishedAfterDays: FEED_MAX_AGE_DAYS,
          order: 'date',
          locale,
        }),
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      quotaHit = msg.includes('429') || msg.toLowerCase().includes('quota')
      console.warn('magazine secondary search failed', err)
    }
  }

  let curated = curateMagazineFeed([...byId.values()], maxResults)

  if (!curated.length && byId.size) {
    curated = [...byId.values()]
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      )
      .slice(0, maxResults)
  }

  if (!curated.length) {
    console.warn(
      quotaHit
        ? 'YouTube search quota exceeded — serving curated mock feed'
        : 'YouTube returned no videos — serving curated mock feed',
    )
    return curateMagazineFeed(mockVideos, maxResults)
  }

  return curated
}
