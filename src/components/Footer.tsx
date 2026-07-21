import { Link } from 'react-router-dom'
import { useLocale } from '@/i18n/LocaleContext'

export function Footer() {
  const { t } = useLocale()

  return (
    <footer className="mt-24 w-full border-t border-border-subtle bg-surface-container-lowest px-8 py-24">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-section-gap md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="mb-8 font-display text-headline-lg font-black text-primary">
            YouTube Magazine AI
          </div>
          <p className="mb-8 font-body text-body-md text-text-muted">
            {t('footer.tagline')}
          </p>
          <div className="font-body text-label-sm uppercase tracking-widest text-text-muted">
            © {new Date().getFullYear()} YouTube Magazine AI. {t('footer.rights')}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 md:col-span-3 md:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Link
              to="/"
              className="font-body text-body-md text-text-muted transition-colors hover:text-accent-crimson"
            >
              {t('footer.about')}
            </Link>
            <a
              href="#"
              className="font-body text-body-md text-text-muted transition-colors hover:text-accent-crimson"
            >
              {t('footer.privacy')}
            </a>
            <a
              href="#"
              className="font-body text-body-md text-text-muted transition-colors hover:text-accent-crimson"
            >
              {t('footer.policy')}
            </a>
          </div>
          <div className="flex flex-col gap-4">
            <Link
              to="/brief"
              className="font-body text-body-md text-text-muted transition-colors hover:text-accent-crimson"
            >
              {t('footer.brief')}
            </Link>
            <Link
              to="/channels"
              className="font-body text-body-md text-text-muted transition-colors hover:text-accent-crimson"
            >
              {t('footer.rankings')}
            </Link>
            <Link
              to="/creators"
              className="font-body text-body-md text-text-muted transition-colors hover:text-accent-crimson"
            >
              {t('footer.creators')}
            </Link>
            <Link
              to="/search"
              className="font-body text-body-md text-text-muted transition-colors hover:text-accent-crimson"
            >
              {t('footer.search')}
            </Link>
          </div>
          <div className="flex flex-col items-start md:col-span-2 md:items-end">
            <span className="mb-4 font-body text-label-sm uppercase tracking-widest text-text-muted">
              {t('footer.stay')}
            </span>
            <div className="flex w-full max-w-sm">
              <input
                className="w-full border border-border-subtle bg-surface px-4 py-3 font-body text-body-md transition-colors focus:border-primary focus:outline-none"
                placeholder={t('footer.email')}
                type="email"
              />
              <button
                type="button"
                className="bg-primary px-6 font-body text-label-md uppercase tracking-widest text-white transition-colors hover:bg-opacity-90"
              >
                {t('footer.join')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
