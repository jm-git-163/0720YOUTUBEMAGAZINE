import type { AppLocale } from './openai'

const CATEGORY_LABELS: Record<AppLocale, Record<string, string>> = {
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

export function localizeLabel(
  value: string | undefined,
  locale: AppLocale,
  fallback = 'Technology',
): string {
  const key = value?.trim() || fallback
  return CATEGORY_LABELS[locale][key] ?? CATEGORY_LABELS.en[key] ?? key
}

export function localizedCategories(locale: AppLocale): string[] {
  return [
    'Technology',
    'AI',
    'Finance',
    'Lifestyle',
    'Gaming',
    'Travel',
    'Music',
    'Design',
  ].map((c) => localizeLabel(c, locale))
}

export function localizedSectors(locale: AppLocale) {
  return [
    { name: localizeLabel('AI & Robotics', locale), change: 14.2, width: 85 },
    { name: localizeLabel('Fintech', locale), change: 5.8, width: 45 },
    { name: localizeLabel('Design Systems', locale), change: 9.1, width: 62 },
  ]
}
