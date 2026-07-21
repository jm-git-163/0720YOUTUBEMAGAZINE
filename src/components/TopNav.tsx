import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useLocale } from '@/i18n/LocaleContext'
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher'

export function TopNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { isEditor, logout } = useAuth()
  const { t } = useLocale()

  const links = [
    { to: '/', label: t('nav.latest'), end: true },
    { to: '/brief', label: t('nav.intelligence') },
    { to: '/channels', label: t('nav.channels') },
    { to: '/creators', label: t('nav.creators') },
    { to: '/search', label: t('nav.archive') },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-colors duration-500 ${
        scrolled ? 'nav-glass' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-8 py-6">
        <div className="flex items-center gap-8 lg:gap-12">
          <Link
            to="/"
            className="font-display text-headline-md font-black tracking-tighter text-primary transition-opacity hover:opacity-70"
          >
            YouTube Magazine AI
          </Link>
          <div className="hidden items-center gap-8 lg:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `font-body text-label-md uppercase tracking-widest transition-colors hover:opacity-70 ${
                    isActive
                      ? 'border-b-2 border-primary pb-1 text-primary'
                      : 'text-text-muted hover:text-primary'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isEditor && (
              <NavLink
                to="/editor"
                className={({ isActive }) =>
                  `font-body text-label-md uppercase tracking-widest transition-colors hover:opacity-70 ${
                    isActive
                      ? 'border-b-2 border-accent-crimson pb-1 text-accent-crimson'
                      : 'text-accent-crimson'
                  }`
                }
              >
                {t('nav.desk')}
              </NavLink>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 lg:gap-5">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            aria-label={t('nav.search')}
            className="text-primary transition-opacity hover:opacity-70"
            onClick={() => navigate('/search')}
          >
            <span className="material-symbols-outlined">search</span>
          </button>
          {isEditor ? (
            <>
              <span className="hidden rounded-full bg-surface-container-low px-3 py-1 font-body text-label-sm uppercase tracking-widest text-accent-crimson lg:inline">
                {t('role.editor')}
              </span>
              <button
                type="button"
                onClick={logout}
                className="hidden rounded-DEFAULT border border-border-subtle px-6 py-3 font-body text-label-md uppercase tracking-widest lg:block"
              >
                {t('nav.signOut')}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-DEFAULT bg-primary px-6 py-3 font-body text-label-md uppercase tracking-widest text-white transition-all hover:bg-opacity-90 lg:block"
            >
              {t('nav.editor')}
            </Link>
          )}
          <button
            type="button"
            className="lg:hidden"
            aria-label={t('common.menu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="material-symbols-outlined">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-border-subtle bg-surface-pure px-8 py-4 lg:hidden">
          <div className="mb-4 sm:hidden">
            <LanguageSwitcher />
          </div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setMenuOpen(false)}
              className="block py-3 font-body text-label-md uppercase tracking-widest text-text-muted"
            >
              {link.label}
            </NavLink>
          ))}
          {isEditor ? (
            <>
              <NavLink
                to="/editor"
                onClick={() => setMenuOpen(false)}
                className="block py-3 font-body text-label-md uppercase tracking-widest text-accent-crimson"
              >
                {t('nav.desk')}
              </NavLink>
              <button
                type="button"
                className="block py-3 font-body text-label-md uppercase tracking-widest text-text-muted"
                onClick={() => {
                  logout()
                  setMenuOpen(false)
                }}
              >
                {t('nav.signOut')}
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="block py-3 font-body text-label-md uppercase tracking-widest text-primary"
            >
              {t('nav.editorLogin')}
            </NavLink>
          )}
        </div>
      )}
    </nav>
  )
}
