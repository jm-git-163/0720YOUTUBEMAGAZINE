import type { ChannelItem, VideoItem } from './types'

const img = (seed: string) =>
  `https://i.ytimg.com/vi/${seed}/hqdefault.jpg`

export const mockVideos: VideoItem[] = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'The Silicon Valley Paradox: AI and Human Emotion',
    description:
      'How the world\'s most advanced AI models are struggling to understand the basic nuances of human emotion, and what it means for the future of synthetic media.',
    thumbnail: img('dQw4w9WgXcQ'),
    channelId: 'ch1',
    channelTitle: 'Elena Rostova',
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    viewCount: 2_400_000,
    likeCount: 180_000,
    commentCount: 12_400,
    category: 'AI',
  },
  {
    id: 'jNQXAC9IVRw',
    title: 'The Renaissance of Generative Creativity',
    description: 'Abstract visualization of generative AI art and creative workflows.',
    thumbnail: img('jNQXAC9IVRw'),
    channelId: 'ch2',
    channelTitle: 'Design Intelligence',
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    viewCount: 890_000,
    likeCount: 42_000,
    commentCount: 3_100,
    category: 'Design',
  },
  {
    id: '9bZkp7q19f0',
    title: 'Automated Luxury: The New Commute',
    description: 'How autonomous systems are redefining the passenger experience.',
    thumbnail: img('9bZkp7q19f0'),
    channelId: 'ch3',
    channelTitle: 'Mobility Lab',
    publishedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    viewCount: 560_000,
    likeCount: 21_000,
    commentCount: 1_800,
    category: 'Technology',
  },
  {
    id: 'kJQP7kiw5Fk',
    title: 'The Silicon Limit Reached?',
    description: 'Exploring alternative materials as Moore\'s Law slows down.',
    thumbnail: img('kJQP7kiw5Fk'),
    channelId: 'ch4',
    channelTitle: 'Hardware Weekly',
    publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    viewCount: 410_000,
    likeCount: 19_000,
    commentCount: 2_200,
    category: 'Technology',
  },
  {
    id: 'fJ9rUzIMcZQ',
    title: 'The Ethics of Synthetic Voice',
    description: 'Episode on cloned voices and consent in media.',
    thumbnail: img('fJ9rUzIMcZQ'),
    channelId: 'ch5',
    channelTitle: 'Intelligence Audio',
    publishedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    viewCount: 320_000,
    likeCount: 15_000,
    commentCount: 4_500,
    category: 'AI',
  },
  {
    id: 'OPf0YbXqdm0',
    title: 'Dawn of Sentient Algorithms in Markets',
    description: 'How proprietary AI models rewrite liquidity rules.',
    thumbnail: img('OPf0YbXqdm0'),
    channelId: 'ch6',
    channelTitle: 'Fintech Frontier',
    publishedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    viewCount: 1_100_000,
    likeCount: 55_000,
    commentCount: 6_200,
    category: 'Finance',
  },
]

export const mockChannels: ChannelItem[] = [
  {
    id: 'ch1',
    title: 'Elena Rostova',
    description: 'Synthesizing deep-tech for the masses.',
    thumbnail: 'https://i.pravatar.cc/200?u=elena',
    subscriberCount: 4_200_000,
    videoCount: 312,
    viewCount: 420_000_000,
    category: 'Technology',
  },
  {
    id: 'ch2',
    title: 'Design Intelligence',
    description: 'Minimalist luxury meets generative UI.',
    thumbnail: 'https://i.pravatar.cc/200?u=design',
    subscriberCount: 1_800_000,
    videoCount: 148,
    viewCount: 95_000_000,
    category: 'Design',
  },
  {
    id: 'ch3',
    title: 'Mobility Lab',
    description: 'The future of automated luxury transport.',
    thumbnail: 'https://i.pravatar.cc/200?u=mobility',
    subscriberCount: 980_000,
    videoCount: 89,
    viewCount: 40_000_000,
    category: 'Technology',
  },
  {
    id: 'ch4',
    title: 'Hardware Weekly',
    description: 'Chips, materials, and physical AI.',
    thumbnail: 'https://i.pravatar.cc/200?u=hardware',
    subscriberCount: 2_100_000,
    videoCount: 520,
    viewCount: 210_000_000,
    category: 'Technology',
  },
  {
    id: 'ch5',
    title: 'Intelligence Audio',
    description: 'Voice, ethics, and synthetic media.',
    thumbnail: 'https://i.pravatar.cc/200?u=audio',
    subscriberCount: 760_000,
    videoCount: 164,
    viewCount: 52_000_000,
    category: 'AI',
  },
  {
    id: 'ch6',
    title: 'Fintech Frontier',
    description: 'Markets, algorithms, and wealth tech.',
    thumbnail: 'https://i.pravatar.cc/200?u=fintech',
    subscriberCount: 1_450_000,
    videoCount: 210,
    viewCount: 120_000_000,
    category: 'Finance',
  },
]

export function findMockVideo(id: string): VideoItem | undefined {
  return mockVideos.find((v) => v.id === id)
}

export function isMockVideoId(id: string): boolean {
  return mockVideos.some((v) => v.id === id)
}
