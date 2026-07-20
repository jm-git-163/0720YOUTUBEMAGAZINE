import { LOCALES, type Locale } from './dictionaries'
import { useLocale } from './LocaleContext'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale()

  return (
    <div
      className={`flex items-center gap-1 ${compact ? '' : 'rounded-full border border-border-subtle p-1'}`}
      role="group"
      aria-label={t('common.language')}
    >
      {LOCALES.map((item) => (
        <button
          key={item.code}
          type="button"
          onClick={() => setLocale(item.code as Locale)}
          className={`rounded-full px-2.5 py-1 font-body text-label-sm uppercase tracking-widest transition-colors ${
            locale === item.code
              ? 'bg-primary text-white'
              : 'text-text-muted hover:text-primary'
          }`}
        >
          {item.code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
