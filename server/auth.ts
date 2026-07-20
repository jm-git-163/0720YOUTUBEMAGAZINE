import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export type Role = 'reader' | 'editor'

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

function getSecret(): string {
  const secret = process.env.EDITOR_SECRET_KEY?.trim()
  if (!secret || secret === 'your_editor_secret_key') {
    throw new Error('EDITOR_SECRET_KEY is not configured')
  }
  return secret
}

export function hasEditorSecret(): boolean {
  const secret = process.env.EDITOR_SECRET_KEY?.trim()
  return Boolean(secret && secret !== 'your_editor_secret_key')
}

export function verifyEditorSecret(input: string): boolean {
  if (!hasEditorSecret()) return false
  const expected = Buffer.from(getSecret())
  const received = Buffer.from(input.trim())
  if (expected.length !== received.length) return false
  return timingSafeEqual(expected, received)
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export function createEditorToken(): string {
  const exp = Date.now() + TOKEN_TTL_MS
  const nonce = randomBytes(8).toString('hex')
  const payload = `editor:${exp}:${nonce}`
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`
}

export function verifyEditorToken(token: string | undefined | null): boolean {
  if (!token || !hasEditorSecret()) return false
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return false
  try {
    const payload = Buffer.from(encoded, 'base64url').toString('utf8')
    const expectedSig = sign(payload)
    const a = Buffer.from(signature)
    const b = Buffer.from(expectedSig)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false
    const [, expStr] = payload.split(':')
    const exp = Number(expStr)
    if (!Number.isFinite(exp) || Date.now() > exp) return false
    return payload.startsWith('editor:')
  } catch {
    return false
  }
}

export function roleFromAuthHeader(header: string | undefined): Role {
  if (!header?.startsWith('Bearer ')) return 'reader'
  const token = header.slice(7).trim()
  return verifyEditorToken(token) ? 'editor' : 'reader'
}

export function requireEditor(header: string | undefined): boolean {
  return roleFromAuthHeader(header) === 'editor'
}
