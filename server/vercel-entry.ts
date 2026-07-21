import type { IncomingMessage, ServerResponse } from 'node:http'
import { app } from './app'

/**
 * Custom Vercel Node handler.
 * @hono/node-server/vercel + Vercel body helpers hang on POST (c.req.json never resolves).
 * We buffer the Node stream ourselves, then call app.fetch.
 */
function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function handler(req: IncomingMessage, res: ServerResponse) {
  const host = req.headers.host ?? 'localhost'
  const protoHeader = req.headers['x-forwarded-proto']
  const proto = Array.isArray(protoHeader)
    ? protoHeader[0]
    : protoHeader?.split(',')[0]?.trim() || 'https'
  const url = `${proto}://${host}${req.url ?? '/'}`

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item)
    } else {
      headers.set(key, value)
    }
  }

  const method = req.method ?? 'GET'
  const init: RequestInit & { duplex?: 'half' } = { method, headers }

  if (method !== 'GET' && method !== 'HEAD') {
    const raw = await readBody(req)
    if (raw.length > 0) {
      init.body = new Uint8Array(raw)
      init.duplex = 'half'
    }
  }

  const response = await app.fetch(new Request(url, init))
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return
    res.setHeader(key, value)
  })
  const buf = Buffer.from(await response.arrayBuffer())
  res.end(buf)
}

module.exports = handler
