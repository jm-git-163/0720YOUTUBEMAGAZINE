import { handle } from '@hono/node-server/vercel'
import { app } from './app'

// Vercel Node runtime expects CommonJS (req, res) — not the Web Request default export.
module.exports = handle(app)
