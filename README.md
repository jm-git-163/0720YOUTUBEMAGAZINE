# YouTube Magazine AI

AI-curated YouTube magazine (React + Vite + Hono).

## Local development

```bash
cp .env.example .env
# fill YOUTUBE_API_KEY, OPENAI_API_KEY, EDITOR_SECRET_KEY
npm install
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:8787

## Deploy

Pushes to Vercel with `/api/*` handled by Hono serverless and the Vite SPA in `dist`.
Set env vars in the Vercel project: `YOUTUBE_API_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `EDITOR_SECRET_KEY`.
