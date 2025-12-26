# 🚀 Cloudflare Workers Deployment Guide

Hướng dẫn triển khai Cloudflare Redirect Service với 3 môi trường: Development, Staging, và Production.

## 📋 Table of Contents

- [Environment Overview](#environment-overview)
- [Initial Setup](#initial-setup)
- [Environment Configuration](#environment-configuration)
- [Common Wrangler Commands](#common-wrangler-commands)
- [Environment-Specific Commands](#environment-specific-commands)
- [Secrets Management](#secrets-management)
- [KV Namespaces Management](#kv-namespaces-management)
- [Deployment Workflow](#deployment-workflow)
- [Testing and Verification](#testing-and-verification)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## 🌍 Environment Overview

| Environment    | Purpose                | URL Pattern                                                   | GA4 Property         | Notes               |
| -------------- | ---------------------- | ------------------------------------------------------------- | -------------------- | ------------------- |
| **dev**        | Local development      | `http://localhost:8787`                                       | `G-DEV123456789`     | Testing & debugging |
| **staging**    | Pre-production testing | `https://cloudflare-redirect-staging.[subdomain].workers.dev` | `G-STAGING123456789` | Integration testing |
| **production** | Live production        | `https://your-domain.com` (custom domain)                     | `G-PROD123456789`    | Real user traffic   |

## 🛠️ Initial Setup

### 1. Prerequisites

```bash
# Check Node.js version (requires v20+)
node --version

# Check Wrangler CLI
npx wrangler --version

# Login to Cloudflare
npx wrangler login
```

### 2. Project Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start local development
npm run dev
```

## ⚙️ Environment Configuration

### Environment Variables & Secrets Strategy

Understanding the difference between `.env` and `wrangler.toml` is critical for secure Deployment:

| Feature        | `.env` File                           | `wrangler.toml` File                                 |
| :------------- | :------------------------------------ | :--------------------------------------------------- |
| **Purpose**    | Local development secrets & overrides | Infrastructure definition & Deployment configuration |
| **Git Status** | **IGNORED** (Never commit)            | **COMMITTED** (Version controlled)                   |
| **Usage**      | `npm run dev` / `wrangler dev`        | `npm run deploy` / `wrangler deploy`                 |
| **Secrets?**   | Yes, safe for local secrets           | **NO** (Use `wrangler secret put`)                   |

#### Precedence Rules

1.  **Local Development (`npm run dev`)**:

    - **`.env` > `wrangler.toml`**: Variables in `.env` **OVERWRITE** variables in `wrangler.toml`.
    - _Example_: If `ENABLED_TRACKING=false` in `wrangler.toml` but `true` in `.env`, local dev uses `true`.

2.  **Deployment (Cloudflare)**:
    - **`.env` IS IGNORED**: This file is not uploaded.
    - **Secrets > Environment Vars**: Encrypted secrets (set via CLI/Dashboard) take precedence over plain text variables.
    - **Secrets > `wrangler.toml`**: `wrangler.toml` provides default values, but Dashboard/CLI config often overrides.

> [!WARNING] > **NEVER put secrets (API keys, passwords) in `wrangler.toml`**. Use `npx wrangler secret put KEY_NAME` instead.

### Development Environment (Local)

**URL**: `http://localhost:8787`

```toml
[env.dev]
name = "cloudflare-redirect-dev"
vars = {
  DEFAULT_REDIRECT_URL = "https://dev.example.com",
  GA4_MEASUREMENT_ID = "G-DEV123456789",
  ENVIRONMENT = "dev",
  ENABLE_TRACKING = "true",
  ANALYTICS_PROVIDERS = "ga4",
  ALLOWED_DOMAINS = "example.com,test.com,localhost"
}
```

### Staging Environment

**URL**: `https://cloudflare-redirect-staging.[subdomain].workers.dev`

```toml
[env.staging]
name = "cloudflare-redirect-staging"
vars = {
  DEFAULT_REDIRECT_URL = "https://staging.example.com",
  GA4_MEASUREMENT_ID = "G-STAGING123456789",
  ENVIRONMENT = "staging",
  ENABLE_TRACKING = "true",
  ANALYTICS_PROVIDERS = "ga4",
  ALLOWED_DOMAINS = "example.com,test.com"
}
```

### Production Environment

**URL**: `https://your-domain.com` (custom domain)

```toml
[env.production]
name = "cloudflare-redirect-production"
vars = {
  DEFAULT_REDIRECT_URL = "https://example.com",
  GA4_MEASUREMENT_ID = "G-PROD123456789",
  ENVIRONMENT = "production",
  ENABLE_TRACKING = "true",
  ANALYTICS_PROVIDERS = "ga4",
  ALLOWED_DOMAINS = "example.com,trusted.org"
}
```

## 🔧 Common Wrangler Commands

### Development Commands

```bash
# Start local development server
npm run dev
# hoặc
npx wrangler dev --env dev

# Run with live reload
npx wrangler dev --env dev --live-reload

# Run with specific port
npx wrangler dev --env dev --port 8787
```

### Build Commands

```bash
# Build for production
npm run build

# Build without deploy
npx wrangler deploy --dry-run --env production
```

### Configuration Commands

```bash
# View configuration
npx wrangler whoami

# List workers
npx wrangler workers list

# View worker details
npx wrangler tail --env production
```

## 🎯 Environment-Specific Commands

### Development Commands

```bash
# Deploy to development
npx wrangler deploy --env dev

# View dev logs
npx wrangler tail --env dev

# Test dev endpoint
curl "http://localhost:8787/r?to=https://example.com"
```

### Staging Commands

```bash
# Deploy to staging
npm run deploy:staging
# hoặc
npx wrangler deploy --env staging

# View staging logs
npx wrangler tail --env staging

# Test staging endpoint
curl "https://cloudflare-redirect-staging.[subdomain].workers.dev/r?to=https://example.com"
```

### Production Commands

```bash
# Deploy to production (use with caution)
npm run deploy:prod
# hoặc
npx wrangler deploy --env production

# View production logs
npx wrangler tail --env production

# Test production endpoint
curl "https://your-domain.com/r?to=https://example.com"
```

## 🔐 Secrets Management

### GA4 API Secret Setup

```bash
# Development secrets
npx wrangler secret put GA4_API_SECRET --env dev
# Input: your-ga4-dev-api-secret

# Staging secrets
npx wrangler secret put GA4_API_SECRET --env staging
# Input: your-ga4-staging-api-secret

# Production secrets
npx wrangler secret put GA4_API_SECRET --env production
# Input: your-ga4-production-api-secret
```

### Additional Secrets (Optional)

```bash
# Set other secrets if needed
npx wrangler secret put ALLOWED_DOMAINS --env production
npx wrangler secret put API_KEY --env staging
```

### List Secrets

```bash
# List secrets (values hidden)
npx wrangler secret list --env production

# Delete secret (use with caution)
npx wrangler secret delete GA4_API_SECRET --env production
```

## 📦 KV Namespaces Management

### Create KV Namespaces

```bash
# Staging KV namespaces
npx wrangler kv:namespace create REDIRECT_KV --env staging

# Production KV namespaces
npx wrangler kv:namespace create REDIRECT_KV --env production

# Note: ANALYTICS_KV removed - retry queue deferred to Epic 9
# Current analytics implementation is fire-and-forget without persistence
```

### Update wrangler.toml with KV IDs

After creating namespaces, update `wrangler.toml`:

```toml
[[env.staging.kv_namespaces]]
binding = "REDIRECT_KV"
id = "staging-redirect-kv-id"  # Replace with actual ID

# Note: ANALYTICS_KV removed - retry queue deferred to Epic 9
```

### KV Operations

```bash
# List KV keys
npx wrangler kv:namespace list --env staging --binding REDIRECT_KV

# Get KV value
npx wrangler kv:key get "test-key" --env staging --binding REDIRECT_KV

# Put KV value
npx wrangler kv:key put "test-key" "test-value" --env staging --binding REDIRECT_KV

# Delete KV key
npx wrangler kv:key delete "test-key" --env staging --binding REDIRECT_KV
```

### KV Bulk Operations

```bash
# Bulk delete (careful!)
npx wrangler kv:bulk delete "test-key" --env staging --binding REDIRECT_KV

# Bulk put from JSON file
npx wrangler kv:bulk put ./data.json --env staging --binding REDIRECT_KV
```

## 🚀 Deployment Workflow

### 1. Development Workflow

```bash
# 1. Start development
npm run dev

# 2. Test locally
curl "http://localhost:8787/r?to=https://example.com"

# 3. Run tests
npm test

# 4. Deploy to dev (optional)
npx wrangler deploy --env dev
```

### 2. Staging Deployment Workflow

```bash
# 1. Deploy to staging
npm run deploy:staging

# 2. Verify deployment
npx wrangler tail --env staging

# 3. Test staging endpoints
curl "https://cloudflare-redirect-staging.[subdomain].workers.dev/r?to=https://example.com"

# 4. Test with tracking parameters
curl "https://cloudflare-redirect-staging.[subdomain].workers.dev/r?to=https://example.com?utm_source=test&utm_medium=link"

# 5. Verify GA4 tracking (check GA4 real-time reports)
```

### 3. Production Deployment Workflow

```bash
# 1. Ensure staging is working
# (Run all staging tests first)

# 2. Deploy to production
npm run deploy:prod

# 3. Verify deployment
npx wrangler tail --env production

# 4. Test production endpoints
curl "https://your-domain.com/r?to=https://example.com"

# 5. Monitor for issues
npx wrangler tail --env production --format=json
```

## 🧪 Testing and Verification

### Health Check Endpoints

```bash
# Health check
curl "https://your-domain.com/r/health"

# Debug mode
curl "https://your-domain.com/r?to=https://example.com&debug=1"
```

### Performance Testing

```bash
# Test performance
time curl "https://your-domain.com/r?to=https://example.com"

# Load testing (example with Apache Bench)
ab -n 100 -c 10 "https://your-domain.com/r?to=https://example.com"
```

### Analytics Testing

```bash
# Test tracking parameters
curl "https://your-domain.com/r?to=https://example.com?utm_source=github&utm_medium=social&utm_campaign=test"

# Test with custom parameters
curl "https://your-domain.com/r?to=https://example.com?xptdk=custom123&ref=source"
```

### Error Handling Testing

```bash
# Test missing parameter
curl "https://your-domain.com/r"

# Test invalid URL
curl "https://your-domain.com/r?to=invalid-url"

# Test blocked domain
curl "https://your-domain.com/r?to=https://blocked-site.com"
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Deployment Fails

```bash
# Check configuration
npx wrangler whoami

# Validate wrangler.toml
npx wrangler validate

# Check for syntax errors
npm run build
```

#### 2. KV Namespace Issues

```bash
# Check KV namespace exists
npx wrangler kv:namespace list

# Verify KV binding
npx wrangler kv:namespace list --env production --binding REDIRECT_KV

# Test KV access
npx wrangler kv:key get "test" --env production --binding REDIRECT_KV
```

#### 3. Secrets Issues

```bash
# Check if secret exists
npx wrangler secret list --env production

# Reset GA4 secret if needed
npx wrangler secret put GA4_API_SECRET --env production
```

#### 4. Performance Issues

```bash
# Monitor logs
npx wrangler tail --env production --format=json

# Check for errors
npx wrangler tail --env production | grep ERROR

# Monitor CPU/memory usage
npx wrangler tail --env production --format=json | jq '.metrics'
```

### Debug Commands

```bash
# View detailed logs
npx wrangler tail --env production --since 1h

# Filter by log level
npx wrangler tail --env production | grep -i error

# Monitor specific requests
npx wrangler tail --env production | grep "your-test-url"
```

## 📋 Best Practices

### 1. Environment Management

- ✅ Always test in staging before production
- ✅ Use different GA4 properties for each environment
- ✅ Keep production secrets separate and secure
- ✅ Use descriptive environment names

### 2. Deployment Safety

- ✅ Never deploy directly to production
- ✅ Always run tests before deployment
- ✅ Monitor logs after deployment
- ✅ Have rollback plan ready

### 3. KV Management

- ✅ Use separate KV namespaces per environment
- ✅ Document KV data structure
- ✅ Implement KV backup strategy
- ✅ Use appropriate KV keys naming

### 4. Monitoring

- ✅ Set up log monitoring
- ✅ Monitor GA4 tracking effectiveness
- ✅ Track error rates and performance
- ✅ Set up alerts for critical issues

### 5. Security

- ✅ Never commit secrets to repository
- ✅ Use custom domains for production
- ✅ Implement domain allowlist properly
- ✅ Regularly rotate API secrets

## 📚 Useful Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [KV Storage Guide](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Analytics Implementation](./stories/story-8.3.md)
- [Architecture Overview](./architecture.md)

## 🆘 Support

If you encounter issues:

1. Check Cloudflare status: https://www.cloudflarestatus.com/
2. Review logs: `npx wrangler tail --env [environment]`
3. Check configuration: `npx wrangler validate`
4. Review this guide for common solutions

---

**Last Updated**: 2025-11-02
**Version**: 1.0.0
**Project**: Cloudflare Redirect Service
