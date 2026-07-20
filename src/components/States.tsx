import { useLocale } from '@/i18n/LocaleContext'

export function LoadingState({ label }: { label?: string }) {
  const { t } = useLocale()
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-8">
      <span className="material-symbols-outlined animate-pulse text-4xl text-accent-gold">
        auto_awesome
      </span>
      <p className="font-body text-label-md uppercase tracking-widest text-text-muted">
        {label ?? t('common.loading')}
      </p>
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  const { t } = useLocale()
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-8 text-center">
      <span className="material-symbols-outlined text-4xl text-accent-crimson">
        error
      </span>
      <p className="max-w-md font-body text-body-md text-text-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-DEFAULT bg-primary px-6 py-3 font-body text-label-md uppercase tracking-widest text-white"
        >
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}
