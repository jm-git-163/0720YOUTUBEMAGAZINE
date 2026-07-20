import type { Locale } from './dictionaries'

/** Canonical category IDs used in search/API queries (English). */
export const CATEGORY_IDS = [
  'Technology',
  'AI',
  'Finance',
  'Lifestyle',
  'Gaming',
  'Travel',
  'Music',
  'Design',
] as const

export type CategoryId = (typeof CATEGORY_IDS)[number]

const labels: Record<Locale, Record<string, string>> = {
  en: {
    Technology: 'Technology',
    AI: 'AI',
    Finance: 'Finance',
    Lifestyle: 'Lifestyle',
    Gaming: 'Gaming',
    Travel: 'Travel',
    Music: 'Music',
    Design: 'Design',
    'Artificial Intelligence': 'Artificial Intelligence',
    'AI & Robotics': 'AI & Robotics',
    Fintech: 'Fintech',
    'Design Systems': 'Design Systems',
  },
  ko: {
    Technology: '테크',
    AI: 'AI',
    Finance: '금융',
    Lifestyle: '라이프스타일',
    Gaming: '게임',
    Travel: '여행',
    Music: '음악',
    Design: '디자인',
    'Artificial Intelligence': '인공지능',
    'AI & Robotics': 'AI & 로보틱스',
    Fintech: '핀테크',
    'Design Systems': '디자인 시스템',
  },
  ja: {
    Technology: 'テクノロジー',
    AI: 'AI',
    Finance: 'ファイナンス',
    Lifestyle: 'ライフスタイル',
    Gaming: 'ゲーム',
    Travel: '旅行',
    Music: '音楽',
    Design: 'デザイン',
    'Artificial Intelligence': '人工知能',
    'AI & Robotics': 'AI & ロボティクス',
    Fintech: 'フィンテック',
    'Design Systems': 'デザインシステム',
  },
}

export function localizeCategory(
  category: string | undefined,
  locale: Locale,
  fallback = 'Technology',
): string {
  const key = category?.trim() || fallback
  return labels[locale][key] ?? labels.en[key] ?? key
}
