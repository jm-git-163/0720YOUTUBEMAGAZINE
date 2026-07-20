import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from '@/i18n/LocaleContext'

/** Warm only the home cache — avoid burning YouTube search quota on prefetch */
export function PrefetchOnMount() {
  const qc = useQueryClient()
  const { locale } = useLocale()

  useEffect(() => {
    void qc.prefetchQuery({
      queryKey: ['home', locale],
      queryFn: () => api.home(locale),
      staleTime: 5 * 60_000,
    })
  }, [qc, locale])

  return null
}
