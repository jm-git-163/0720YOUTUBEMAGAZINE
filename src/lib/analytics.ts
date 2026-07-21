import { getStoredToken } from './token'

const DEBOUNCE_MS = 30_000
const lastSent = new Map<string, number>()

function shouldSkipPath(pathname: string) {
  return (
    pathname.startsWith('/editor') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api')
  )
}

/** Fire-and-forget pageview for major magazine surfaces. */
export function trackPageview(opts: {
  path: string
  title?: string
  locale?: string
  isEditor?: boolean
}) {
  const pathname = opts.path.split('?')[0] || '/'
  if (shouldSkipPath(pathname)) return

  const now = Date.now()
  const prev = lastSent.get(pathname) ?? 0
  if (now - prev < DEBOUNCE_MS) return
  lastSent.set(pathname, now)

  const payload = JSON.stringify({
    path: pathname,
    title: opts.title || document.title,
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    locale: opts.locale,
    skipEditor: Boolean(opts.isEditor),
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = getStoredToken()
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon && !token) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/analytics/track', blob)
      return
    }
    void fetch('/api/analytics/track', {
      method: 'POST',
      headers,
      body: payload,
      keepalive: true,
    })
  } catch {
    // ignore beacon failures
  }
}
