export interface QualityScoreBreakdown {
  originality: number
  educationalValue: number
  entertainment: number
  productionQuality: number
  thumbnail: number
  title: number
  seo: number
  storytelling: number
  total: number
}

export interface MagazineEditorial {
  headline: string
  dek: string
  category: string
  summary: string[]
  whyItMatters: string
  keyInsights: string[]
  trends: string[]
  similarVideos: string[]
  watchNext: string[]
  creatorStyle: string
  audience: string
  keyQuotes: string[]
  aiOpinion: string
  relatedNews: string
  qualityScore: QualityScoreBreakdown
  bodySections: { id: string; title: string; content: string }[]
}

export interface VideoItem {
  id: string
  title: string
  description: string
  thumbnail: string
  channelId: string
  channelTitle: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  duration?: string
  tags?: string[]
  category?: string
}

export interface ChannelItem {
  id: string
  title: string
  description: string
  thumbnail: string
  subscriberCount: number
  videoCount: number
  viewCount: number
  category?: string
}

export interface RankedCreator {
  rank: number
  channel: ChannelItem
  compositeScore: number
  viewVelocity: number
  engagement: number
  gptQuality: number
  trendScore: number
  blurb: string
}

export function hasYouTubeKey(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY !== 'your_youtube_data_api_key')
}

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key')
}
