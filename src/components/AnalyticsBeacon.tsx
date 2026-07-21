import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useLocale } from '@/i18n/LocaleContext'
import { trackPageview } from '@/lib/analytics'

/** Track major magazine pages (home, brief, rankings, search, articles). */
export function AnalyticsBeacon() {
  const location = useLocation()
  const { isEditor } = useAuth()
  const { locale } = useLocale()

  useEffect(() => {
    trackPageview({
      path: location.pathname + location.search,
      locale,
      isEditor,
    })
  }, [location.pathname, location.search, locale, isEditor])

  return null
}
