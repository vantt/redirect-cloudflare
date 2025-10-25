# cloudflareRedirect

Developer bootstrap for Cloudflare Workers + Hono.

## Prerequisites
- Node.js 18+
- Cloudflare `wrangler` CLI

## Setup
```
npm install
```

## Development
```
npm run dev
```

## Testing
```
npm test
```

## Deploy
```
wrangler deploy
```

## Configuration
- KV binding `REDIRECT_KV` is declared in `wrangler.toml`. Replace `id` with your namespace.
- Type bindings in `src/types/env.ts`.

