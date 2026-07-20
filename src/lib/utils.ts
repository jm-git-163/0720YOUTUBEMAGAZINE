export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/** Format YouTube upload date for KO / EN / JA */
export function formatPublishedDate(
  iso: string | undefined,
  locale: 'ko' | 'en' | 'ja' = 'en',
): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const tag = locale === 'ko' ? 'ko-KR' : locale === 'ja' ? 'ja-JP' : 'en-US'
  return new Intl.DateTimeFormat(tag, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function readingMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(3, Math.round(words / 200))
}

export const CATEGORIES = [
  'Technology',
  'AI',
  'Finance',
  'Lifestyle',
  'Gaming',
  'Travel',
  'Music',
  'Design',
] as const
