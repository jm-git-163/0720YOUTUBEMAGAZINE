import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { useLocale } from '@/i18n/LocaleContext'

/** Top progress bar + floating "loading" chip while any query/mutation is in flight */
export function GlobalLoadingIndicator() {
  const fetching = useIsFetching()
  const mutating = useIsMutating()
  const { t } = useLocale()
  const active = fetching + mutating > 0

  if (!active) return null

  return (
    <>
      <div
        className="pointer-events-none fixed top-0 right-0 left-0 z-[100] h-0.5 overflow-hidden bg-transparent"
        aria-hidden
      >
        <div className="loading-bar h-full w-1/3 bg-accent-crimson" />
      </div>
      <div
        className="fixed right-6 bottom-6 z-[100] flex items-center gap-2 rounded-full border border-border-subtle bg-surface-pure/95 px-4 py-2 shadow-[0_10px_40px_-10px_rgba(17,17,17,0.12)] backdrop-blur-md"
        role="status"
        aria-live="polite"
      >
        <span className="material-symbols-outlined animate-spin text-[18px] text-accent-gold">
          progress_activity
        </span>
        <span className="font-body text-label-sm uppercase tracking-widest text-text-muted">
          {t('common.loading')}
        </span>
      </div>
    </>
  )
}

/** Inline banner when refreshing while existing content is still shown */
export function FetchingBanner({ label }: { label?: string }) {
  const { t } = useLocale()
  return (
    <div
      className="sticky top-[88px] z-40 mb-6 flex items-center justify-center gap-2 border-b border-border-subtle bg-surface/90 px-4 py-2 backdrop-blur-md"
      role="status"
    >
      <span className="material-symbols-outlined animate-spin text-[16px] text-accent-gold">
        progress_activity
      </span>
      <span className="font-body text-label-sm uppercase tracking-widest text-text-muted">
        {label ?? t('common.updating')}
      </span>
    </div>
  )
}
