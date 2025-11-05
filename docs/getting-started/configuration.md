# Configuration Guide

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)** | **[Getting Started](./README.md)**

---

## Overview

This guide covers essential configuration for the cloudflareRedirect service.

---

## Environment Variables

### Basic Configuration

```bash
# .env file (for local development)

# Default redirect when no destination specified
DEFAULT_REDIRECT_URL=https://example.com

# Enable/disable analytics tracking
ENABLE_TRACKING=false
```

### Analytics Configuration (Optional)

```bash
# Analytics provider(s) to use (comma-separated)
ANALYTICS_PROVIDERS=ga4

# Google Analytics 4
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=your-api-secret-here

# Timeout for analytics requests (milliseconds)
ANALYTICS_TIMEOUT_MS=2000
```

### Security Configuration (Optional)

```bash
# Comma-separated list of allowed redirect domains
ALLOWED_DOMAINS=example.com,trusted-site.com
```

---

## Configuration by Environment

### Development (Local)

**File:** `.env`

```bash
DEFAULT_REDIRECT_URL=https://dev.example.com
ENABLE_TRACKING=false
ALLOWED_DOMAINS=example.com,localhost
```

### Staging

**File:** `wrangler.toml`

```toml
[env.staging]
name = "cloudflare-redirect-staging"

[env.staging.vars]
DEFAULT_REDIRECT_URL = "https://staging.example.com"
GA4_MEASUREMENT_ID = "G-STAGING123"
ENVIRONMENT = "staging"
ENABLE_TRACKING = "true"
ANALYTICS_PROVIDERS = "ga4"
```

**Secrets (via CLI):**
```bash
npx wrangler secret put GA4_API_SECRET --env staging
```

### Production

**File:** `wrangler.toml`

```toml
[env.production]
name = "cloudflare-redirect-production"

[env.production.vars]
DEFAULT_REDIRECT_URL = "https://example.com"
GA4_MEASUREMENT_ID = "G-PROD456"
ENVIRONMENT = "production"
ENABLE_TRACKING = "true"
ANALYTICS_PROVIDERS = "ga4"
ALLOWED_DOMAINS = "example.com,trusted.org"
```

**Secrets (via CLI):**
```bash
npx wrangler secret put GA4_API_SECRET --env production
```

---

## Google Analytics 4 Setup

### Step 1: Get Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property
3. Admin → Data Streams → Select your stream
4. Copy **Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 2: Get API Secret

1. In the same Data Stream settings
2. Click **Measurement Protocol API secrets**
3. Click **Create**
4. Give it a name (e.g., "Cloudflare Worker")
5. Copy the **Secret Value**

### Step 3: Configure

**Local (.env):**
```bash
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=your-secret-here
ANALYTICS_PROVIDERS=ga4
ENABLE_TRACKING=true
```

**Production (wrangler.toml + CLI):**
```toml
[env.production.vars]
GA4_MEASUREMENT_ID = "G-XXXXXXXXXX"
ANALYTICS_PROVIDERS = "ga4"
ENABLE_TRACKING = "true"
```

```bash
npx wrangler secret put GA4_API_SECRET --env production
# Paste your secret when prompted
```

### Step 4: Test

```bash
# Start dev server
npm run dev

# Test redirect with tracking
curl "http://localhost:8787/r?to=https://example.com?utm_source=test"

# Check GA4 Realtime report (may take 1-2 minutes)
```

---

## Domain Allowlist (Security)

Restrict redirects to specific domains only.

### Configuration

```bash
# .env or wrangler.toml
ALLOWED_DOMAINS=example.com,partner.com,trusted.org
```

### Behavior

**Allowed:**
```bash
curl "http://localhost:8787/r?to=https://example.com/page"
# → 302 redirect ✅

curl "http://localhost:8787/r?to=https://www.example.com/page"
# → 302 redirect ✅ (subdomain allowed)
```

**Blocked:**
```bash
curl "http://localhost:8787/r?to=https://untrusted.com"
# → 403 Forbidden ❌
```

### Notes

- Subdomains are automatically allowed (e.g., `www.example.com`, `blog.example.com`)
- If `ALLOWED_DOMAINS` is not set, all domains are allowed
- Use this in production to prevent open redirect abuse

---

## Configuration Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DEFAULT_REDIRECT_URL` | Fallback URL when no destination | `https://example.com` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_TRACKING` | `false` | Enable analytics tracking |
| `ANALYTICS_PROVIDERS` | - | Comma-separated provider list |
| `GA4_MEASUREMENT_ID` | - | GA4 Measurement ID |
| `GA4_API_SECRET` | - | GA4 API Secret |
| `ANALYTICS_TIMEOUT_MS` | `2000` | Analytics timeout (ms) |
| `ALLOWED_DOMAINS` | - | Domain allowlist |

---

## Testing Configuration

### Check Environment Variables

```bash
# Development
npm run dev
# Check console output for loaded config

# Production
npx wrangler tail --env production
# Check logs for configuration
```

### Test Analytics

```bash
# Send test redirect
curl "http://localhost:8787/r?to=https://example.com?utm_source=test"

# Check logs
# Should see: "Analytics tracking successful" or similar
```

### Test Domain Allowlist

```bash
# Set ALLOWED_DOMAINS=example.com

# This should work
curl -I "http://localhost:8787/r?to=https://example.com"

# This should fail (403)
curl -I "http://localhost:8787/r?to=https://blocked.com"
```

---

## Troubleshooting

### Analytics Not Tracking?

1. Check `ENABLE_TRACKING=true`
2. Check `ANALYTICS_PROVIDERS` includes `ga4`
3. Verify `GA4_MEASUREMENT_ID` format
4. Verify `GA4_API_SECRET` is set correctly
5. Check GA4 Realtime report (wait 1-2 min)

### Domain Allowlist Not Working?

1. Check `ALLOWED_DOMAINS` format (comma-separated, no spaces)
2. Restart dev server after changing `.env`
3. For subdomains, only list root domain

### Secrets Not Loading?

```bash
# List secrets
npx wrangler secret list --env production

# Re-set if needed
npx wrangler secret put GA4_API_SECRET --env production
```

---

## Next Steps

- ✅ Configuration complete
- → **[How It Works](./how-it-works.md)** - Understand the system
- → **[Deployment Guide](../guides/deployment-guide.md)** - Deploy to production

---

## Related Documentation

- **[Deployment Guide](../guides/deployment-guide.md)** - Full deployment workflow
- **[Analytics System](../features/analytics/)** - Analytics architecture
- **[GA4 Integration](../features/ga4/)** - GA4 details

---

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)** | **[Getting Started](./README.md)**
