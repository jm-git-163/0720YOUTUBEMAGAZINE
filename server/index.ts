import 'dotenv/config'
import { serve } from '@hono/node-server'
import { app } from './app'

const port = Number(process.env.API_PORT || 8787)

const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`YouTube Magazine AI API on http://localhost:${port}`)
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${port} is already in use. Stop the other process or change API_PORT.`,
    )
    process.exit(1)
  }
  throw err
})