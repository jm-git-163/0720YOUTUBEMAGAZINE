import type { VideoItem } from './types'

/** AI magazine feed: hard cutoff — older than this leaves the main desk */
export const FEED_MAX_AGE_DAYS = 90

/** Soft preference: content inside this window scores highest on freshness */
export const FEED_PEAK_AGE_DAYS = 21

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export function ageInDays(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.max(0, ms / 86_400_000)
}

/**
 * Freshness for fast-moving AI coverage.
 * Half-life ~3 weeks: a 2-month-old "latest model" piece is already stale.
 */
export function freshnessScore(video: VideoItem): number {
  const days = ageInDays(video.publishedAt)
  if (days > FEED_MAX_AGE_DAYS) return 0
  // Exponential decay: ~100 at day 0, ~50 at day 21, ~12 at day 90
  return clamp(100 * Math.exp(-days / FEED_PEAK_AGE_DAYS))
}

/**
 * Views per day since publish — rewards breakout recent videos
 * over old evergreen clips with high cumulative views.
 */
export function dailyVelocityScore(video: VideoItem): number {
  const days = Math.max(ageInDays(video.publishedAt), 0.5)
  const perDay = video.viewCount / days
  // 50k views/day ≈ strong; 5k/day ≈ solid; log curve soft-caps mega-hits
  return clamp(Math.log10(Math.max(perDay, 1)) * 22)
}

export function engagementQualityScore(video: VideoItem): number {
  if (!video.viewCount) return 0
  const rate =
    (video.likeCount + video.commentCount * 3) / Math.max(video.viewCount, 1)
  return clamp(rate * 6000)
}

/** Prefer AI / frontier-tech topicality for this magazine */
export function scoreTopicalRelevance(video: VideoItem): number {
  const text = `${video.title} ${video.description} ${(video.tags ?? []).join(' ')}`.toLowerCase()
  let score = 35
  const boosts: [RegExp, number][] = [
    [/\b(gpt|claude|gemini|llm|openai|anthropic|deepseek)\b/, 25],
    [/\b(ai|artificial intelligence|machine learning|neural)\b/, 20],
    [/\b(agent|rag|multimodal|reasoning|frontier)\b/, 15],
    [/\b(2025|2026|this week|breaking|launch|release)\b/, 10],
  ]
  for (const [re, pts] of boosts) {
    if (re.test(text)) score += pts
  }
  // Soft-penalize evergreen tutorial clickbait that ages poorly as "news"
  if (/\b(for beginners|complete course|full course|in 10 minutes)\b/.test(text) && ageInDays(video.publishedAt) > 30) {
    score -= 15
  }
  return clamp(score)
}

/**
 * Magazine desk score for cover / trending / brief.
 * Designed for AI media where currency beats archival popularity.
 *
 * 40% freshness · 30% daily velocity · 20% engagement · 10% topical relevance
 */
export function magazineFeedScore(video: VideoItem): number {
  return (
    0.4 * freshnessScore(video) +
    0.3 * dailyVelocityScore(video) +
    0.2 * engagementQualityScore(video) +
    0.1 * scoreTopicalRelevance(video)
  )
}

export function isWithinFeedWindow(video: VideoItem): boolean {
  return ageInDays(video.publishedAt) <= FEED_MAX_AGE_DAYS
}

/**
 * Rank candidates for the magazine desk.
 * - Drop anything older than FEED_MAX_AGE_DAYS
 * - Cap videos per channel so one creator cannot dominate the cover grid
 */
export function curateMagazineFeed(
  candidates: VideoItem[],
  limit: number,
  maxPerChannel = 2,
): VideoItem[] {
  const recent = candidates.filter(isWithinFeedWindow)
  const pool = recent.length >= Math.min(limit, 4) ? recent : candidates

  const scored = [...pool].sort(
    (a, b) => magazineFeedScore(b) - magazineFeedScore(a),
  )

  const picked: VideoItem[] = []
  const perChannel = new Map<string, number>()
  const seen = new Set<string>()

  for (const video of scored) {
    if (seen.has(video.id)) continue
    const count = perChannel.get(video.channelId) ?? 0
    if (count >= maxPerChannel) continue
    picked.push(video)
    seen.add(video.id)
    perChannel.set(video.channelId, count + 1)
    if (picked.length >= limit) break
  }

  return picked
}

export function publishedAfterIso(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86_400_000)
  // YouTube expects RFC 3339; strip ms for widest compatibility
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z')
}
