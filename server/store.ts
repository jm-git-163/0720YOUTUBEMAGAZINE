import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { MagazineEditorial } from './types'

export interface StoredArticle {
  id: string
  videoId?: string
  status: 'published' | 'draft'
  thumbnail: string
  channelTitle: string
  editorial: MagazineEditorial
  createdAt: string
  updatedAt: string
}

interface StoreShape {
  articles: StoredArticle[]
  hiddenVideoIds: string[]
}

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'youtube-magazine-ai')
  : path.resolve(process.cwd(), 'data')
const STORE_PATH = path.join(DATA_DIR, 'magazine.json')

function emptyStore(): StoreShape {
  return { articles: [], hiddenVideoIds: [] }
}

function ensureStore(): StoreShape {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(STORE_PATH)) {
    const initial = emptyStore()
    writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8')
    return initial
  }
  try {
    return JSON.parse(readFileSync(STORE_PATH, 'utf8')) as StoreShape
  } catch {
    return emptyStore()
  }
}

function save(store: StoreShape): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
}

export function listArticles(includeDrafts = false): StoredArticle[] {
  const store = ensureStore()
  return store.articles
    .filter((a) => includeDrafts || a.status === 'published')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getArticle(id: string): StoredArticle | null {
  return ensureStore().articles.find((a) => a.id === id) ?? null
}

export function getArticleByVideoId(videoId: string): StoredArticle | null {
  return (
    ensureStore().articles.find((a) => a.videoId === videoId) ?? null
  )
}

export function isVideoHidden(videoId: string): boolean {
  return ensureStore().hiddenVideoIds.includes(videoId)
}

export function createArticle(input: {
  videoId?: string
  status?: 'published' | 'draft'
  thumbnail: string
  channelTitle: string
  editorial: MagazineEditorial
}): StoredArticle {
  const store = ensureStore()
  const now = new Date().toISOString()
  const article: StoredArticle = {
    id: input.videoId ? `yt-${input.videoId}` : `m-${randomUUID().slice(0, 8)}`,
    videoId: input.videoId,
    status: input.status ?? 'published',
    thumbnail: input.thumbnail,
    channelTitle: input.channelTitle,
    editorial: input.editorial,
    createdAt: now,
    updatedAt: now,
  }
  store.articles = store.articles.filter(
    (a) => a.id !== article.id && a.videoId !== input.videoId,
  )
  store.articles.unshift(article)
  if (input.videoId) {
    store.hiddenVideoIds = store.hiddenVideoIds.filter((id) => id !== input.videoId)
  }
  save(store)
  return article
}

export function updateArticle(
  id: string,
  patch: Partial<
    Pick<StoredArticle, 'status' | 'thumbnail' | 'channelTitle' | 'editorial'>
  >,
): StoredArticle | null {
  const store = ensureStore()
  const idx = store.articles.findIndex((a) => a.id === id)
  if (idx < 0) return null
  const current = store.articles[idx]
  const updated: StoredArticle = {
    ...current,
    ...patch,
    editorial: patch.editorial ?? current.editorial,
    updatedAt: new Date().toISOString(),
  }
  store.articles[idx] = updated
  save(store)
  return updated
}

export function deleteArticle(id: string): boolean {
  const store = ensureStore()
  const article = store.articles.find((a) => a.id === id)
  if (!article) return false
  store.articles = store.articles.filter((a) => a.id !== id)
  if (article.videoId && !store.hiddenVideoIds.includes(article.videoId)) {
    store.hiddenVideoIds.push(article.videoId)
  }
  save(store)
  return true
}

export function hideVideo(videoId: string): void {
  const store = ensureStore()
  store.articles = store.articles.filter((a) => a.videoId !== videoId)
  if (!store.hiddenVideoIds.includes(videoId)) {
    store.hiddenVideoIds.push(videoId)
  }
  save(store)
}

export function unhideVideo(videoId: string): void {
  const store = ensureStore()
  store.hiddenVideoIds = store.hiddenVideoIds.filter((id) => id !== videoId)
  save(store)
}

export function listHiddenVideoIds(): string[] {
  return [...ensureStore().hiddenVideoIds]
}
