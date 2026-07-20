import OpenAI from 'openai'
import { z } from 'zod'
import type { MagazineEditorial, VideoItem } from './types'
import { hasOpenAIKey } from './types'
import { localizeLabel } from './i18n'
import { isMockVideoId } from './mock'
import {
  applyOfflineStringLocale,
  applyOfflineVideoLocale,
  offlineBrief,
  offlineEditorial,
} from './offline-i18n'

/** Skip OpenAI after quota/billing failures for the rest of this process. */
let openaiUnavailableUntil = 0

function markOpenAIUnavailable(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err)
  const status = (err as { status?: number })?.status
  if (
    status === 429 ||
    msg.includes('insufficient_quota') ||
    msg.toLowerCase().includes('quota')
  ) {
    openaiUnavailableUntil = Date.now() + 30 * 60_000
    console.warn('OpenAI marked unavailable for 30m after quota/rate error')
  }
}

function canUseOpenAI(): boolean {
  return hasOpenAIKey() && Date.now() > openaiUnavailableUntil
}
const qualitySchema = z.object({
  originality: z.number(),
  educationalValue: z.number(),
  entertainment: z.number(),
  productionQuality: z.number(),
  thumbnail: z.number(),
  title: z.number(),
  seo: z.number(),
  storytelling: z.number(),
  total: z.number(),
})

const editorialSchema = z.object({
  headline: z.string(),
  dek: z.string(),
  category: z.string(),
  summary: z.array(z.string()).min(1).max(5),
  whyItMatters: z.string(),
  keyInsights: z.array(z.string()),
  trends: z.array(z.string()),
  similarVideos: z.array(z.string()),
  watchNext: z.array(z.string()),
  creatorStyle: z.string(),
  audience: z.string(),
  keyQuotes: z.array(z.string()),
  aiOpinion: z.string(),
  relatedNews: z.string(),
  qualityScore: qualitySchema,
  bodySections: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
      }),
    )
    .min(2)
    .max(6),
})

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function mockEditorial(video: VideoItem): MagazineEditorial {
  return {
    headline: video.title.replace(/\.$/, ''),
    dek: `AI-curated analysis of ${video.channelTitle}'s standout video.`,
    category: video.category ?? 'Technology',
    summary: [
      `${video.channelTitle} released a high-signal video now at ${video.viewCount.toLocaleString()} views.`,
      'The piece reframes a technical topic as an editorial narrative rather than a demo reel.',
      'Creators and operators should watch for the second-order cultural impact.',
    ],
    whyItMatters: `Instead of merely chasing views, this video changes how audiences understand ${video.category ?? 'technology'}. The craft is in the framing: ${video.title}`,
    keyInsights: [
      'Strong narrative arc beats feature laundry lists.',
      'Thumbnail and title work as a magazine cover, not clickbait.',
      'Engagement quality suggests a professional / founder audience.',
      'The creator leans into practical explanation over hype.',
    ],
    trends: [
      `${video.category ?? 'AI'} explainers becoming mainstream magazine content`,
      'Editorial pacing entering YouTube long-form',
    ],
    similarVideos: ['Related deep dives in the same niche'],
    watchNext: ['Creator spotlight follow-ups'],
    creatorStyle: `${video.channelTitle} focuses on clear visual explanation with authoritative tone.`,
    audience: 'Founders, developers, designers, and curious professionals.',
    keyQuotes: [
      'We are no longer designing screens; we are designing behaviors.',
    ],
    aiOpinion:
      'A high-quality editorial piece that earns magazine treatment — worth a full read, not a skim.',
    relatedNews: `Ongoing conversation around ${video.category ?? 'AI'} productization and culture.`,
    qualityScore: {
      originality: 82,
      educationalValue: 88,
      entertainment: 74,
      productionQuality: 86,
      thumbnail: 80,
      title: 84,
      seo: 78,
      storytelling: 90,
      total: 83,
    },
    bodySections: [
      {
        id: 'intro',
        title: 'Why This Video Matters',
        content: video.description?.slice(0, 600) ||
          'This release sits at the intersection of platform metrics and editorial craft.',
      },
      {
        id: 'insights',
        title: 'Key Insights',
        content:
          'The strongest signal is not raw virality — it is how cleanly the creator translates complexity into a story a sophisticated reader would finish.',
      },
      {
        id: 'audience',
        title: 'Who Should Watch',
        content:
          'Operators evaluating tools, creators studying narrative, and investors tracking cultural adoption curves.',
      },
      {
        id: 'conclusion',
        title: 'Editor\'s Close',
        content:
          'Treat this as a cover story: watch once for craft, again for strategy.',
      },
    ],
  }
}

export async function generateEditorial(
  video: VideoItem,
): Promise<MagazineEditorial> {
  // Mock feed + exhausted OpenAI: return instantly so article pages open
  if (isMockVideoId(video.id) || !canUseOpenAI()) {
    return offlineEditorial(video, 'en')
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const client = getClient()

  const prompt = `You are the chief editor of YouTube Magazine AI — a premium digital magazine (GQ x The Verge x Apple News).
Turn this YouTube video metadata into a magazine article package.

VIDEO:
Title: ${video.title}
Channel: ${video.channelTitle}
Description: ${video.description?.slice(0, 2500)}
Views: ${video.viewCount}
Likes: ${video.likeCount}
Comments: ${video.commentCount}
Published: ${video.publishedAt}
Tags: ${(video.tags ?? []).slice(0, 20).join(', ')}

Return JSON matching the schema. qualityScore fields are 0-100 integers; total is weighted average.
bodySections: 3-5 magazine sections with slug ids (intro, glass, data, conclusion style).
Write in polished English editorial voice. headline should be magazine-worthy (not clickbait).`

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You output only valid JSON for a magazine editorial package.',
        },
        { role: 'user', content: prompt },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = editorialSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      console.warn('Editorial schema mismatch, using mock', parsed.error)
      return offlineEditorial(video, 'en')
    }
    return parsed.data as MagazineEditorial
  } catch (err) {
    console.error('OpenAI editorial failed', err)
    markOpenAIUnavailable(err)
    return offlineEditorial(video, 'en')
  }
}

const briefSchema = z.object({
  headline: z.string(),
  dek: z.string(),
  notes: z.array(z.string()).min(2).max(6),
  sentiment: z.number().min(0).max(100),
  velocity: z.number().min(0).max(100),
})

export async function generateDailyBrief(videos: VideoItem[]): Promise<{
  headline: string
  dek: string
  notes: string[]
  sentiment: number
  velocity: number
}> {
  const fallback = {
    headline: videos[0]?.title ?? "Today's AI Brief",
    dek: 'A curated digest of the videos shaping technology culture today.',
    notes: videos.slice(0, 3).map(
      (v) => `${v.channelTitle}: ${v.title} (${v.viewCount.toLocaleString()} views)`,
    ),
    sentiment: 84,
    velocity: 92,
  }

  if (!canUseOpenAI() || !videos.length) return fallback

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const client = getClient()
  const list = videos
    .slice(0, 8)
    .map(
      (v, i) =>
        `${i + 1}. ${v.title} — ${v.channelTitle} — ${v.viewCount} views`,
    )
    .join('\n')

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You write a daily AI magazine brief as JSON only.',
        },
        {
          role: 'user',
          content: `Write Today's AI Brief from these videos:\n${list}\nReturn JSON: headline, dek, notes (3-5 bullets), sentiment (0-100), velocity (0-100).`,
        },
      ],
    })
    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = briefSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return fallback
    return parsed.data as {
      headline: string
      dek: string
      notes: string[]
      sentiment: number
      velocity: number
    }
  } catch (err) {
    console.error('OpenAI brief failed', err)
    markOpenAIUnavailable(err)
    return fallback
  }
}

export async function scoreChannelQuality(
  title: string,
  description: string,
): Promise<number> {
  if (!hasOpenAIKey()) {
    return 70 + Math.min(25, Math.floor(description.length / 40))
  }
  try {
    const client = getClient()
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: `Rate this YouTube channel's content quality 0-100 as JSON {"score": number}.\nTitle: ${title}\nDescription: ${description.slice(0, 800)}`,
        },
      ],
    })
    const raw = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as {
      score?: number
    }
    return Math.max(0, Math.min(100, Number(raw.score ?? 75)))
  } catch {
    return 75
  }
}

export type AppLocale = 'ko' | 'en' | 'ja'

export function normalizeLocale(input?: string | null): AppLocale {
  const v = (input ?? 'en').toLowerCase()
  if (v === 'ko' || v === 'ja' || v === 'en') return v
  return 'en'
}

const localeLabel: Record<AppLocale, string> = {
  ko: 'Korean',
  en: 'English',
  ja: 'Japanese',
}

export async function translateEditorial(
  editorial: MagazineEditorial,
  locale: AppLocale,
  video?: VideoItem,
): Promise<MagazineEditorial> {
  if (locale === 'en') return editorial

  const offline = () => {
    if (video) {
      const [localizedVideo] = applyOfflineVideoLocale([video], locale)
      return offlineEditorial(localizedVideo, locale)
    }
    return {
      ...editorial,
      category: localizeLabel(editorial.category, locale),
    }
  }

  if (!canUseOpenAI()) return offline()

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const client = getClient()
  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a premium magazine translator. Translate JSON editorial fields into ${localeLabel[locale]}. Keep qualityScore numbers and bodySections.id unchanged. Preserve array lengths. Output valid JSON only.`,
        },
        {
          role: 'user',
          content: JSON.stringify(editorial),
        },
      ],
    })
    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = editorialSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return offline()
    return {
      ...(parsed.data as MagazineEditorial),
      qualityScore: editorial.qualityScore,
      bodySections: (parsed.data as MagazineEditorial).bodySections.map(
        (s, i) => ({
          ...s,
          id: editorial.bodySections[i]?.id ?? s.id,
        }),
      ),
    }
  } catch (err) {
    console.error('translateEditorial failed', err)
    markOpenAIUnavailable(err)
    return offline()
  }
}

export async function translateBriefText(
  brief: {
    headline: string
    dek: string
    notes: string[]
  },
  locale: AppLocale,
  videos: VideoItem[] = [],
): Promise<{ headline: string; dek: string; notes: string[] }> {
  if (locale === 'en') return brief

  const offline = () => {
    const o = offlineBrief(videos, locale)
    return { headline: o.headline, dek: o.dek, notes: o.notes }
  }

  if (!canUseOpenAI()) return offline()

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const client = getClient()
  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Translate magazine brief JSON into ${localeLabel[locale]}. Keep the same keys: headline, dek, notes. Output JSON only.`,
        },
        { role: 'user', content: JSON.stringify(brief) },
      ],
    })
    const raw = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as {
      headline?: string
      dek?: string
      notes?: string[]
    }
    return {
      headline: raw.headline ?? brief.headline,
      dek: raw.dek ?? brief.dek,
      notes: Array.isArray(raw.notes) ? raw.notes : brief.notes,
    }
  } catch (err) {
    markOpenAIUnavailable(err)
    return offline()
  }
}

/** Translate visible video card fields (title, description, category). Channel names stay as proper nouns. */
export async function translateVideos(
  videos: VideoItem[],
  locale: AppLocale,
): Promise<VideoItem[]> {
  if (!videos.length || locale === 'en') return videos

  // Prefer offline pack for curated mock feed (also avoids burning OpenAI quota)
  const offline = applyOfflineVideoLocale(videos, locale)
  const allOffline = videos.every(
    (v) => offline.find((o) => o.id === v.id)?.title !== v.title,
  )
  if (allOffline || !canUseOpenAI()) return offline

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const client = getClient()
  const payload = videos.map((v) => ({
    id: v.id,
    title: v.title,
    description: (v.description ?? '').slice(0, 400),
    category: v.category ?? 'Technology',
  }))

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You translate YouTube magazine card copy into ${localeLabel[locale]}. Return JSON {"items":[{"id":string,"title":string,"description":string,"category":string}]}. Keep the same ids and array length. Do not transliterate brand/product names unnecessarily.`,
        },
        { role: 'user', content: JSON.stringify({ items: payload }) },
      ],
    })
    const raw = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as {
      items?: Array<{
        id?: string
        title?: string
        description?: string
        category?: string
      }>
    }
    const byId = new Map(
      (raw.items ?? [])
        .filter((i) => i.id)
        .map((i) => [i.id as string, i] as const),
    )
    return videos.map((v) => {
      const hit = byId.get(v.id)
      if (!hit) {
        return applyOfflineVideoLocale([v], locale)[0]
      }
      return {
        ...v,
        title: hit.title?.trim() || v.title,
        description: hit.description?.trim() || v.description,
        category: hit.category?.trim() || v.category,
      }
    })
  } catch (err) {
    console.error('translateVideos failed', err)
    markOpenAIUnavailable(err)
    return offline
  }
}

export async function translateStrings(
  items: { id: string; text: string }[],
  locale: AppLocale,
): Promise<Record<string, string>> {
  if (!items.length || locale === 'en') {
    return Object.fromEntries(items.map((i) => [i.id, i.text]))
  }

  if (!canUseOpenAI()) {
    return applyOfflineStringLocale(items, locale)
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const client = getClient()
  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Translate each text into ${localeLabel[locale]}. Return JSON {"items":[{"id":string,"text":string}]}. Keep ids.`,
        },
        { role: 'user', content: JSON.stringify({ items }) },
      ],
    })
    const raw = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as {
      items?: Array<{ id?: string; text?: string }>
    }
    const out: Record<string, string> = {}
    for (const i of items) out[i.id] = i.text
    for (const i of raw.items ?? []) {
      if (i.id && i.text) out[i.id] = i.text
    }
    return out
  } catch (err) {
    markOpenAIUnavailable(err)
    return applyOfflineStringLocale(items, locale)
  }
}

