import type {
  BriefPayload,
  EditorialPayload,
  HomePayload,
  MagazineEditorial,
  RankingsPayload,
  Role,
  SearchPayload,
  StoredArticle,
  VideoItem,
} from './types'
import { getStoredToken } from './token'

async function request<T>(
  path: string,
  init?: RequestInit & { token?: string | null },
): Promise<T> {
  const token = init?.token === undefined ? getStoredToken() : init.token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const { token: _t, ...rest } = init ?? {}
  const res = await fetch(path, { ...rest, headers })
  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      const text = await res.text().catch(() => '')
      if (text) message = text
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export const api = {
  home: (lang = 'en') =>
    request<HomePayload>(`/api/home?lang=${encodeURIComponent(lang)}`),
  search: (q: string, lang = 'en') =>
    request<SearchPayload>(
      `/api/search?q=${encodeURIComponent(q)}&lang=${encodeURIComponent(lang)}`,
    ),
  video: (id: string) => request<VideoItem>(`/api/videos/${id}`),
  rankings: (category = 'all', lang = 'en') =>
    request<RankingsPayload>(
      `/api/rankings?category=${encodeURIComponent(category)}&lang=${encodeURIComponent(lang)}`,
    ),
  brief: (lang = 'en') =>
    request<BriefPayload>(`/api/brief?lang=${encodeURIComponent(lang)}`),
  editorial: (videoId: string, lang = 'en') =>
    request<EditorialPayload>(
      `/api/editorial/${videoId}?lang=${encodeURIComponent(lang)}`,
      { method: 'POST' },
    ),
  me: (token?: string | null) =>
    request<{ role: Role }>('/api/auth/me', { token: token ?? null }),
  login: (secret: string) =>
    request<{ token: string; role: Role }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ secret }),
      token: null,
    }),

  articles: () => request<{ items: StoredArticle[] }>('/api/articles'),
  article: (id: string) => request<StoredArticle>(`/api/articles/${id}`),
  createArticle: (body: {
    videoId?: string
    status?: 'published' | 'draft'
    thumbnail?: string
    channelTitle?: string
    editorial: MagazineEditorial
  }) =>
    request<StoredArticle>('/api/articles', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateArticle: (
    id: string,
    body: Partial<{
      status: 'published' | 'draft'
      thumbnail: string
      channelTitle: string
      editorial: MagazineEditorial
    }>,
  ) =>
    request<StoredArticle>(`/api/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteArticle: (id: string) =>
    request<{ ok: boolean }>(`/api/articles/${id}`, { method: 'DELETE' }),
  saveEditorial: (videoId: string, editorial: MagazineEditorial) =>
    request<StoredArticle>(`/api/editorial/${videoId}/save`, {
      method: 'POST',
      body: JSON.stringify({ editorial, status: 'published' }),
    }),
  deleteEditorial: (videoId: string) =>
    request<{ ok: boolean }>(`/api/editorial/${videoId}`, { method: 'DELETE' }),
}
