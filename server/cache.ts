import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

type Entry<T> = { value: T; expiresAt: number }

const memory = new Map<string, Entry<unknown>>()

const CACHE_DIR = process.env.VERCEL
  ? path.join('/tmp', 'youtube-magazine-ai-cache')
  : path.resolve(process.cwd(), 'data')
const CACHE_FILE = path.join(CACHE_DIR, 'api-cache.json')

/** Shared YouTube trending raw feed — language-agnostic, long-lived. */
export const YT_TRENDING_TTL_MS = 3 * 60 * 60_000
/** Locale-translated home / rankings payloads. */
export const FEED_TTL_MS = 20 * 60_000
export const BRIEF_TTL_MS = 30 * 60_000
export const SEARCH_TTL_MS = 15 * 60_000
export const VIDEO_TTL_MS = 30 * 60_000
export const EDITORIAL_TTL_MS = 30 * 60_000

let diskHydrated = false
let persistTimer: ReturnType<typeof setTimeout> | null = null

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true })
}

function hydrateFromDisk() {
  if (diskHydrated) return
  diskHydrated = true
  try {
    if (!existsSync(CACHE_FILE)) return
    const raw = JSON.parse(readFileSync(CACHE_FILE, 'utf8')) as Record<
      string,
      Entry<unknown>
    >
    const now = Date.now()
    for (const [key, entry] of Object.entries(raw)) {
      if (!entry || typeof entry.expiresAt !== 'number') continue
      if (entry.expiresAt <= now) continue
      if (!memory.has(key)) memory.set(key, entry)
    }
  } catch (err) {
    console.warn('cache hydrate failed', err)
  }
}

function schedulePersist() {
  if (persistTimer) return
  persistTimer = setTimeout(() => {
    persistTimer = null
    try {
      ensureCacheDir()
      const now = Date.now()
      const dump: Record<string, Entry<unknown>> = {}
      for (const [key, entry] of memory.entries()) {
        if (entry.expiresAt > now) dump[key] = entry
      }
      writeFileSync(CACHE_FILE, JSON.stringify(dump), 'utf8')
    } catch (err) {
      console.warn('cache persist failed', err)
    }
  }, 250)
  persistTimer.unref?.()
}

export function cacheGet<T>(key: string): T | null {
  hydrateFromDisk()
  const hit = memory.get(key)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    memory.delete(key)
    schedulePersist()
    return null
  }
  return hit.value as T
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  hydrateFromDisk()
  memory.set(key, { value, expiresAt: Date.now() + ttlMs })
  schedulePersist()
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const existing = cacheGet<T>(key)
  if (existing !== null) return existing
  const value = await loader()
  cacheSet(key, value, ttlMs)
  return value
}
