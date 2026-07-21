import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from '@/i18n/LocaleContext'

const HOME_STALE_MS = 15 * 60_000

/** Prefetch home only on `/` — avoid burning YouTube quota on other routes. */
export function PrefetchOnMount() {
  const qc = useQueryClient()
  const { locale } = useLocale()
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname !== '/') return
    const existing = qc.getQueryState(['home', locale])
    if (existing?.dataUpdatedAt && Date.now() - existing.dataUpdatedAt < HOME_STALE_MS) {
      return
    }
    void qc.prefetchQuery({
      queryKey: ['home', locale],
      queryFn: () => api.home(locale),
      staleTime: HOME_STALE_MS,
    })
  }, [qc, locale, pathname])

  return null
}
