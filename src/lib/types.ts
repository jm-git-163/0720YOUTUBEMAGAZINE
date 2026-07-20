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

export interface HomePayload {
  cover: VideoItem | null
  coverInsight?: string
  trending: VideoItem[]
  categories: string[]
  editorPicks?: StoredArticle[]
}

export type Role = 'reader' | 'editor'

export interface StoredArticle {
  id: string
  videoId?: string
  status: 'published' | 'draft'
  thumbnail: string
  channelTitle: string
  editorial: MagazineEditorial
  createdAt: string
  updatedAt: string
}

export interface EditorialPayload {
  video: VideoItem
  editorial: MagazineEditorial
  channel?: ChannelItem
  storedId?: string
  source?: 'ai' | 'editor'
}

export interface BriefPayload {
  date: string
  headline: string
  dek: string
  notes: string[]
  sentiment: number
  velocity: number
  digest: VideoItem[]
  cover: VideoItem | null
}

export interface RankingsPayload {
  category: string
  items: RankedCreator[]
  sectorVelocity: { name: string; change: number; width: number }[]
}

export interface SearchPayload {
  query: string
  items: VideoItem[]
}
