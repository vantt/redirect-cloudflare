# Installation Guide

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)** | **[Getting Started](./README.md)**

---

## Prerequisites

Before you begin, ensure you have:
- **Node.js 20+** ([Download](https://nodejs.org/))
- **npm 10+** (included with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Cloudflare Account** ([Sign up free](https://dash.cloudflare.com/sign-up))

---

## Step 1: Clone Repository

```bash
git clone <repository-url>
cd redirect_bmadv6
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This will install:
- Hono (web framework)
- TypeScript (type safety)
- Zod (validation)
- Vitest (testing)
- Wrangler (Cloudflare CLI)

---

## Step 3: Cloudflare Setup

### Login to Cloudflare

```bash
npx wrangler login
```

This opens a browser window to authorize Wrangler CLI.

### Create KV Namespace (Optional)

If you plan to use KV-backed short URLs:

```bash
npx wrangler kv:namespace create REDIRECT_KV
npx wrangler kv:namespace create REDIRECT_KV --preview
```

Save the namespace IDs and update `wrangler.toml`.

---

## Step 4: Configuration

### Copy Environment Template

```bash
cp .env.example .env
```

### Edit `.env` File

```bash
# Basic configuration
DEFAULT_REDIRECT_URL=https://example.com
ENABLE_TRACKING=false

# Optional: Analytics (see Configuration guide)
# ANALYTICS_PROVIDERS=ga4
# GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## Step 5: Verify Installation

### Start Development Server

```bash
npm run dev
```

You should see:
```
⛅️ wrangler 3.x.x
------------------
⎔ Starting local server...
⎔ Ready on http://localhost:8787
```

### Test Basic Redirect

In another terminal:
```bash
curl -I "http://localhost:8787/r?to=https://google.com"
```

Expected output:
```
HTTP/1.1 302 Found
Location: https://google.com
```

**Success!** ✅ Your installation is complete.

---

## Step 6: Run Tests

```bash
npm test
```

Expected output:
```
✓ test/unit/... (XXX tests)
✓ test/integration/... (XXX tests)

Test Files  XX passed (XX)
Tests  XXX passed (XXX)
```

---

## Troubleshooting

### Port 8787 Already in Use?

```bash
# Kill existing process
# Windows:
netstat -ano | findstr :8787
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:8787 | xargs kill
```

Or use a different port:
```bash
npx wrangler dev --port 8788
```

### Wrangler Login Fails?

Try manual authentication:
```bash
npx wrangler login --scopes-list
# Follow browser prompts carefully
```

### Dependencies Won't Install?

```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

- ✅ Installation complete
- → **[Your First Redirect](./first-redirect.md)** - Create and test redirects
- → **[Configuration](./configuration.md)** - Configure analytics and settings

---

## Need Help?

- **Configuration Issues:** See [Configuration Guide](./configuration.md)
- **Deployment Issues:** See [Deployment Guide](../guides/deployment-guide.md)
- **General Questions:** Check [Developer Guide](../guides/developer-guide.md)

---

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)** | **[Getting Started](./README.md)**
