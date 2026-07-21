import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  BRIEF_TTL_MS,
  EDITORIAL_TTL_MS,
  FEED_TTL_MS,
  SEARCH_TTL_MS,
  VIDEO_TTL_MS,
  YT_TRENDING_TTL_MS,
  cached,
} from './cache'
import {
  generateDailyBrief,
  generateEditorial,
  normalizeLocale,
  translateBriefText,
  translateEditorial,
  translateStrings,
  translateVideos,
} from './openai'
import { rankCreators } from './ranking'
import {
  getChannel,
  getVideo,
  searchChannels,
  searchVideos,
  trendingTechVideos,
} from './youtube'
import { localizeLabel, localizedCategories, localizedSectors } from './i18n'
import { FEED_MAX_AGE_DAYS } from './curation'
import { hasOpenAIKey, hasYouTubeKey, type MagazineEditorial, type VideoItem } from './types'
import {
  createEditorToken,
  hasEditorSecret,
  requireEditor,
  roleFromAuthHeader,
  verifyEditorSecret,
} from './auth'
import {
  createArticle,
  deleteArticle,
  getArticle,
  getArticleByVideoId,
  hideVideo,
  isVideoHidden,
  listArticles,
  updateArticle,
} from './store'
import type { AppLocale } from './openai'

function formatCoverInsight(cover: VideoItem, lang: AppLocale): string {
  const views = cover.viewCount.toLocaleString()
  if (lang === 'ko') {
    return `핵심 인사이트: ${cover.channelTitle}의 「${cover.title}」이(가) ${views}회 조회로 화제를 모으고 있습니다.`
  }
  if (lang === 'ja') {
    return `キーインサイト: ${cover.channelTitle}の「${cover.title}」が${views}回再生され話題になっています。`
  }
  return `Key Insight: ${cover.channelTitle} is shaping the conversation with ${views} views on "${cover.title}".`
}
const app = new Hono()

app.use(
  '*',
  cors({
    origin: (origin) => origin ?? '*',
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

function authHeader(c: { req: { header: (name: string) => string | undefined } }) {
  return c.req.header('Authorization')
}

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    youtube: hasYouTubeKey(),
    openai: hasOpenAIKey(),
    editorAuth: hasEditorSecret(),
  }),
)

app.get('/api/auth/me', (c) => {
  const role = roleFromAuthHeader(authHeader(c))
  return c.json({ role })
})

app.post('/api/auth/login', async (c) => {
  if (!hasEditorSecret()) {
    return c.json({ error: 'EDITOR_SECRET_KEY is not configured on the server' }, 503)
  }
  const body = (await c.req.json().catch(() => ({}))) as { secret?: string }
  if (!body.secret || !verifyEditorSecret(body.secret)) {
    return c.json({ error: 'Invalid editor secret' }, 401)
  }
  const token = createEditorToken()
  return c.json({ token, role: 'editor' as const })
})

app.get('/api/home', async (c) => {
  const lang = normalizeLocale(c.req.query('lang'))
  try {
    const payload = await cached(`home-feed-v9:${lang}`, FEED_TTL_MS, async () => {
      const trendingRaw = await cached(`yt-trending-raw-v1`, YT_TRENDING_TTL_MS, () =>
        trendingTechVideos(12),
      )
      const base = trendingRaw.filter((v) => !isVideoHidden(v.id))
      const trending = await translateVideos(base, lang)
      const cover = trending[0] ?? null
      return {
        cover,
        coverInsight: cover ? formatCoverInsight(cover, lang) : undefined,
        trending,
        categories: localizedCategories(lang),
        lang,
        editorPicks: listArticles(false).slice(0, 6),
      }
    })
    return c.json(payload)
  } catch (err) {
    console.error(err)
    return c.json(
      { error: err instanceof Error ? err.message : 'Home failed' },
      500,
    )
  }
})

app.get('/api/search', async (c) => {
  const q = c.req.query('q')?.trim() || 'AI'
  const lang = normalizeLocale(c.req.query('lang'))
  try {
    const items = await cached(`search-v4:${q}:${lang}`, SEARCH_TTL_MS, async () => {
      // Raw YouTube results shared across locales; only translation is per-lang.
      const raw = await cached(`search-raw-v3:${q}`, SEARCH_TTL_MS, () =>
        searchVideos(q, 18, { order: 'relevance' }),
      )
      const visible = raw.filter((v) => !isVideoHidden(v.id))
      return translateVideos(visible, lang)
    })
    return c.json({
      query: q,
      items,
      lang,
    })
  } catch (err) {
    console.error(err)
    return c.json(
      { error: err instanceof Error ? err.message : 'Search failed' },
      500,
    )
  }
})

app.get('/api/videos/:id', async (c) => {
  const id = c.req.param('id')
  try {
    if (isVideoHidden(id) && !requireEditor(authHeader(c))) {
      return c.json({ error: 'Not found' }, 404)
    }
    const video = await cached(`video:${id}`, VIDEO_TTL_MS, () => getVideo(id))
    if (!video) return c.json({ error: 'Not found' }, 404)
    return c.json(video)
  } catch (err) {
    console.error(err)
    return c.json(
      { error: err instanceof Error ? err.message : 'Video failed' },
      500,
    )
  }
})

app.get('/api/rankings', async (c) => {
  const category = c.req.query('category') || 'all'
  const lang = normalizeLocale(c.req.query('lang'))
  try {
    const payload = await cached(
      `rankings-v4:${category}:${lang}`,
      FEED_TTL_MS,
      async () => {
        let items
        try {
          const query =
            category === 'all'
              ? 'AI LLM creator'
              : `${category} AI YouTube creator`
          const channels = await searchChannels(query, 8)
          const sampleVideos = await searchVideos(
            category === 'all' ? 'AI GPT Claude Gemini' : category,
            15,
            { publishedAfterDays: FEED_MAX_AGE_DAYS, order: 'date' },
          )
          items = await rankCreators(channels, sampleVideos)
        } catch (err) {
          console.warn('rankings falling back after YouTube error', err)
          const { mockChannels, mockVideos } = await import('./mock')
          items = await rankCreators(mockChannels, mockVideos)
        }

        const blurbMap = await translateStrings(
          items.map((item) => ({
            id: item.channel.id,
            text: item.blurb,
          })),
          lang,
        )

        return {
          category,
          lang,
          items: items.map((item) => ({
            ...item,
            blurb: blurbMap[item.channel.id] ?? item.blurb,
            channel: {
              ...item.channel,
              category: localizeLabel(item.channel.category, lang),
            },
          })),
          sectorVelocity: localizedSectors(lang),
        }
      },
    )
    return c.json(payload)
  } catch (err) {
    console.error(err)
    return c.json(
      { error: err instanceof Error ? err.message : 'Rankings failed' },
      500,
    )
  }
})

app.get('/api/brief', async (c) => {
  const lang = normalizeLocale(c.req.query('lang'))
  try {
    const payload = await cached(`brief-v8:${lang}`, BRIEF_TTL_MS, async () => {
      const trendingRaw = await cached(`yt-trending-raw-v1`, YT_TRENDING_TTL_MS, () =>
        trendingTechVideos(12),
      )
      const digestRaw = trendingRaw.slice(0, 9)
      const digestBase = digestRaw.filter((v) => !isVideoHidden(v.id))
      const digest = await translateVideos(digestBase, lang)
      const brief = await generateDailyBrief(digestBase)
      const localized = await translateBriefText(
        {
          headline: brief.headline,
          dek: brief.dek,
          notes: brief.notes,
        },
        lang,
        digest,
      )
      return {
        date: new Date().toISOString().slice(0, 10),
        headline: localized.headline,
        dek: localized.dek,
        notes: localized.notes,
        sentiment: brief.sentiment,
        velocity: brief.velocity,
        digest,
        cover: digest[0] ?? null,
        lang,
      }
    })
    return c.json(payload)
  } catch (err) {
    console.error(err)
    return c.json(
      { error: err instanceof Error ? err.message : 'Brief failed' },
      500,
    )
  }
})

app.post('/api/editorial/:videoId', async (c) => {
  const videoId = c.req.param('videoId')
  const lang = normalizeLocale(c.req.query('lang'))
  try {
    if (isVideoHidden(videoId) && !requireEditor(authHeader(c))) {
      return c.json({ error: 'Article removed by editor' }, 404)
    }

    const override = getArticleByVideoId(videoId)
    if (override) {
      const videoRaw = await getVideo(videoId)
      if (!videoRaw) return c.json({ error: 'Video not found' }, 404)
      const channel = videoRaw.channelId
        ? await getChannel(videoRaw.channelId)
        : undefined
      const [editorial, video] = await Promise.all([
        cached(
          `editorial-override-v2:${videoId}:${lang}:${override.updatedAt}`,
          EDITORIAL_TTL_MS,
          () => translateEditorial(override.editorial, lang, videoRaw),
        ),
        cached(`video-localized-v2:${videoId}:${lang}`, EDITORIAL_TTL_MS, async () => {
          const [v] = await translateVideos([videoRaw], lang)
          return v
        }),
      ])
      return c.json({
        video,
        editorial,
        channel: channel ?? undefined,
        storedId: override.id,
        source: 'editor' as const,
        lang,
      })
    }

    const payload = await cached(
      `editorial-v4:${videoId}:${lang}`,
      EDITORIAL_TTL_MS,
      async () => {
        const videoRaw = await getVideo(videoId)
        if (!videoRaw) throw new Error('Video not found')
        const [baseEditorial, channel, localizedVideos] = await Promise.all([
          cached(`editorial-base-v2:${videoId}`, EDITORIAL_TTL_MS, () =>
            generateEditorial(videoRaw),
          ),
          videoRaw.channelId
            ? getChannel(videoRaw.channelId).catch(() => null)
            : Promise.resolve(null),
          translateVideos([videoRaw], lang),
        ])
        const editorial = await translateEditorial(
          baseEditorial,
          lang,
          videoRaw,
        )
        return {
          video: localizedVideos[0] ?? videoRaw,
          editorial,
          channel: channel ?? undefined,
          source: 'ai' as const,
          lang,
        }
      },
    )
    return c.json(payload)
  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Editorial failed'
    const status = message.includes('not found') ? 404 : 500
    return c.json({ error: message }, status)
  }
})
/* ?붴붴?Editor content CRUD (readers: read; editors: write) ?붴붴?*/

app.get('/api/articles', (c) => {
  const isEditor = requireEditor(authHeader(c))
  return c.json({ items: listArticles(isEditor) })
})

app.get('/api/articles/:id', (c) => {
  const article = getArticle(c.req.param('id'))
  if (!article) return c.json({ error: 'Not found' }, 404)
  if (article.status === 'draft' && !requireEditor(authHeader(c))) {
    return c.json({ error: 'Not found' }, 404)
  }
  return c.json(article)
})

app.post('/api/articles', async (c) => {
  if (!requireEditor(authHeader(c))) {
    return c.json({ error: 'Editor login required' }, 403)
  }
  const body = (await c.req.json()) as {
    videoId?: string
    status?: 'published' | 'draft'
    thumbnail?: string
    channelTitle?: string
    editorial: MagazineEditorial
  }
  if (!body.editorial?.headline) {
    return c.json({ error: 'editorial.headline is required' }, 400)
  }
  let thumbnail = body.thumbnail ?? ''
  let channelTitle = body.channelTitle ?? 'YouTube Magazine AI'
  if (body.videoId) {
    const video = await getVideo(body.videoId)
    if (video) {
      thumbnail = thumbnail || video.thumbnail
      channelTitle = channelTitle || video.channelTitle
    }
  }
  const article = createArticle({
    videoId: body.videoId,
    status: body.status ?? 'published',
    thumbnail:
      thumbnail ||
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200',
    channelTitle,
    editorial: body.editorial,
  })
  return c.json(article, 201)
})

app.put('/api/articles/:id', async (c) => {
  if (!requireEditor(authHeader(c))) {
    return c.json({ error: 'Editor login required' }, 403)
  }
  const body = (await c.req.json()) as Partial<{
    status: 'published' | 'draft'
    thumbnail: string
    channelTitle: string
    editorial: MagazineEditorial
  }>
  const updated = updateArticle(c.req.param('id'), body)
  if (!updated) return c.json({ error: 'Not found' }, 404)
  return c.json(updated)
})

app.delete('/api/articles/:id', (c) => {
  if (!requireEditor(authHeader(c))) {
    return c.json({ error: 'Editor login required' }, 403)
  }
  const ok = deleteArticle(c.req.param('id'))
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})

app.post('/api/editorial/:videoId/save', async (c) => {
  if (!requireEditor(authHeader(c))) {
    return c.json({ error: 'Editor login required' }, 403)
  }
  const videoId = c.req.param('videoId')
  const body = (await c.req.json()) as {
    editorial: MagazineEditorial
    status?: 'published' | 'draft'
  }
  const video = await getVideo(videoId)
  if (!video) return c.json({ error: 'Video not found' }, 404)
  const article = createArticle({
    videoId,
    status: body.status ?? 'published',
    thumbnail: video.thumbnail,
    channelTitle: video.channelTitle,
    editorial: body.editorial,
  })
  return c.json(article)
})

app.delete('/api/editorial/:videoId', (c) => {
  if (!requireEditor(authHeader(c))) {
    return c.json({ error: 'Editor login required' }, 403)
  }
  const videoId = c.req.param('videoId')
  const existing = getArticleByVideoId(videoId)
  if (existing) deleteArticle(existing.id)
  else hideVideo(videoId)
  return c.json({ ok: true })
})

export { app }
