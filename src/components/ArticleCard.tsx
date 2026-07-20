import { Link } from 'react-router-dom'
import type { VideoItem } from '@/lib/types'
import { formatCount, formatPublishedDate } from '@/lib/utils'
import { useLocale } from '@/i18n/LocaleContext'
import { localizeCategory } from '@/i18n/categories'

interface ArticleCardProps {
  video: VideoItem
  variant?: 'large' | 'medium' | 'compact'
  category?: string
  score?: number
}

export function ArticleCard({
  video,
  variant = 'medium',
  category,
  score,
}: ArticleCardProps) {
  const { t, locale } = useLocale()
  const cat = localizeCategory(category ?? video.category, locale)
  const uploaded = formatPublishedDate(video.publishedAt, locale)

  if (variant === 'large') {
    return (
      <Link
        to={`/article/${video.id}`}
        className="group relative overflow-hidden rounded-lg md:col-span-2 md:row-span-2"
      >
        <div className="thumb-frame rounded-lg">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-8">
          <span className="mb-3 block font-body text-label-sm uppercase tracking-widest text-white/80">
            {cat}
          </span>
          <h3 className="mb-4 font-display text-headline-md leading-snug text-balance-safe text-white">
            {video.title}
          </h3>
          <div className="flex flex-wrap items-center gap-4 font-body text-label-sm text-white/80">
            <span>{video.channelTitle}</span>
            {uploaded && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    calendar_today
                  </span>
                  {uploaded}
                </span>
              </>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                visibility
              </span>
              {formatCount(video.viewCount)}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/article/${video.id}`} className="group block cursor-pointer">
      <div className="thumb-frame relative mb-4 rounded-lg">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="transition-transform duration-700 group-hover:scale-105"
        />
        {typeof score === 'number' && (
          <div className="glass-panel absolute top-4 right-4 flex items-center gap-1 rounded px-2 py-1">
            <span
              className="material-symbols-outlined text-[16px] text-accent-gold"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
            <span className="font-mono text-label-sm font-bold">
              {(score / 10).toFixed(1)}
            </span>
          </div>
        )}
      </div>
      <span className="mb-2 block font-body text-label-sm uppercase tracking-widest text-accent-crimson">
        {cat}
      </span>
      <h3 className="mb-2 font-body text-body-lg leading-snug font-bold text-balance-safe transition-opacity group-hover:opacity-70">
        {video.title}
      </h3>
      <p className="mb-2 line-clamp-2 font-body text-body-md leading-relaxed text-text-muted">
        {video.description || video.channelTitle}
      </p>
      <p className="flex flex-wrap items-center gap-2 font-body text-label-sm text-text-muted">
        <span>{video.channelTitle}</span>
        {uploaded && (
          <>
            <span>•</span>
            <span>{uploaded}</span>
          </>
        )}
        <span>•</span>
        <span>
          {formatCount(video.viewCount)} {t('common.views')}
        </span>
      </p>
    </Link>
  )
}
