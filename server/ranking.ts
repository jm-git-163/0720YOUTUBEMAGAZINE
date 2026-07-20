import type { ChannelItem, RankedCreator, VideoItem } from './types'
import { scoreChannelQuality } from './openai'
import {
  ageInDays,
  dailyVelocityScore,
  engagementQualityScore,
  freshnessScore,
  magazineFeedScore,
} from './curation'

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export function uploadFrequencyScore(videoCount: number): number {
  return clamp(Math.log10(Math.max(videoCount, 1)) * 25)
}

/**
 * Creator Index for an AI magazine desk.
 * Recency and breakout velocity outweigh raw subscriber vanity metrics.
 *
 * 30% freshness of latest sample · 25% daily velocity · 20% engagement
 * 15% GPT quality · 10% upload activity
 */
export function creatorCompositeScore(parts: {
  freshness: number
  velocity: number
  engagement: number
  gptQuality: number
  activity: number
}): number {
  return (
    0.3 * parts.freshness +
    0.25 * parts.velocity +
    0.2 * parts.engagement +
    0.15 * parts.gptQuality +
    0.1 * parts.activity
  )
}

export async function rankCreators(
  channels: ChannelItem[],
  sampleVideos: VideoItem[],
): Promise<RankedCreator[]> {
  const videosByChannel = new Map<string, VideoItem[]>()
  for (const v of sampleVideos) {
    const list = videosByChannel.get(v.channelId) ?? []
    list.push(v)
    videosByChannel.set(v.channelId, list)
  }

  const ranked: RankedCreator[] = []

  for (const channel of channels) {
    const vids = (videosByChannel.get(channel.id) ?? []).sort(
      (a, b) => magazineFeedScore(b) - magazineFeedScore(a),
    )
    const top = vids[0]
    const freshness = top ? freshnessScore(top) : 20
    const velocity = top ? dailyVelocityScore(top) : 25
    const engagement = top ? engagementQualityScore(top) : 30
    const activity = uploadFrequencyScore(channel.videoCount)
    const gptQuality = await scoreChannelQuality(
      channel.title,
      channel.description,
    )

    // Soft-downrank channels whose sample content is very old
    const agePenalty =
      top && ageInDays(top.publishedAt) > 120 ? 0.85 : 1

    const score =
      creatorCompositeScore({
        freshness,
        velocity,
        engagement,
        gptQuality,
        activity,
      }) * agePenalty

    ranked.push({
      rank: 0,
      channel,
      compositeScore: score,
      viewVelocity: velocity,
      engagement,
      gptQuality,
      trendScore: freshness,
      blurb:
        channel.description?.slice(0, 100) ||
        'Synthesizing deep-tech for a sophisticated audience.',
    })
  }

  ranked.sort((a, b) => b.compositeScore - a.compositeScore)
  ranked.forEach((r, i) => {
    r.rank = i + 1
  })
  return ranked
}

// Re-export naming used elsewhere if needed
export {
  freshnessScore,
  dailyVelocityScore as viewVelocityScore,
  engagementQualityScore as engagementScore,
}
