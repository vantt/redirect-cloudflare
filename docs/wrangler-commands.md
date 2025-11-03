# 🚀 Wrangler Commands Quick Reference

Cheat sheet cho các lệnh Wrangler thường dùng của Cloudflare Redirect Service.

## 📋 Table of Contents

- [Development Commands](#development-commands)
- [Deployment Commands](#deployment-commands)
- [Testing Commands](#testing-commands)
- [Logs & Monitoring](#logs--monitoring)
- [KV Storage](#kv-storage)
- [Secrets Management](#secrets-management)
- [Environment Commands](#environment-commands)
- [Troubleshooting](#troubleshooting)

## 🛠️ Development Commands

### Local Development

```bash
# Start development server (dev environment)
npm run dev

# Start with live reload
npx wrangler dev --env dev --live-reload

# Start on specific port
npx wrangler dev --env dev --port 8787

# Start with debug logs
npx wrangler dev --env dev --log-level debug
```

### Build & Validation

```bash
# Build project
npm run build

# Validate configuration
npm run validate

# Check who you are logged in as
npm run whoami

# Preview deployment (dry run)
npm run deploy:dry
```

## 🚀 Deployment Commands

### Deploy to Environments

```bash
# Deploy to development
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production (use with caution!)
npm run deploy:prod

# Deploy without actually deploying (dry run)
npx wrangler deploy --dry-run --env production
```

### Deployment Workflow

```bash
# 1. Validate configuration
npm run validate

# 2. Run tests
npm test

# 3. Deploy to staging
npm run deploy:staging

# 4. Check staging logs
npm run logs:staging

# 5. Deploy to production (if staging looks good)
npm run deploy:prod
```

## 🧪 Testing Commands

### Test Suite

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test test/unit/lib/analytics/providers/ga4.test.ts
```

### Manual Testing

```bash
# Test local development
curl "http://localhost:8787/r?to=https://example.com"

# Test staging
curl "https://cloudflare-redirect-staging.[subdomain].workers.dev/r?to=https://example.com"

# Test production
curl "https://your-domain.com/r?to=https://example.com"

# Test with tracking parameters
curl "https://your-domain.com/r?to=https://example.com?utm_source=test&utm_medium=link"

# Test debug mode
curl "https://your-domain.com/r?to=https://example.com&debug=1"
```

### Performance Testing

```bash
# Simple timing test
time curl "https://your-domain.com/r?to=https://example.com"

# Load testing with Apache Bench (if installed)
ab -n 100 -c 10 "https://your-domain.com/r?to=https://example.com"

# Load testing with curl (simple)
for i in {1..10}; do curl -s "https://your-domain.com/r?to=https://example.com" > /dev/null; done
```

## 📊 Logs & Monitoring

### View Logs

```bash
# View development logs
npm run logs:dev

# View staging logs
npm run logs:staging

# View production logs
npm run logs:prod

# View logs with JSON format
npx wrangler tail --env production --format=json

# View logs from last hour
npx wrangler tail --env production --since 1h

# Filter logs by keyword
npx wrangler tail --env production | grep -i error
```

### Monitoring Commands

```bash
# Monitor real-time logs
npx wrangler tail --env production

# Monitor specific request patterns
npx wrangler tail --env production | grep "redirect"

# Check for errors
npx wrangler tail --env production | grep -E "(ERROR|error|Error)"

# Monitor analytics events
npx wrangler tail --env production | grep "GA4"
```

## 📦 KV Storage

### KV Namespace Management

```bash
# List production KV namespaces
npm run kv:list

# List staging KV namespaces
npm run kv:list:staging

# List all KV keys in production
npx wrangler kv:namespace list --env production --binding REDIRECT_KV

# List all KV keys in staging
npx wrangler kv:namespace list --env staging --binding REDIRECT_KV
```

### KV Key Operations

```bash
# Get KV value
npx wrangler kv:key get "test-key" --env production --binding REDIRECT_KV

# Put KV value
npx wrangler kv:key put "test-key" "test-value" --env production --binding REDIRECT_KV

# Delete KV key
npx wrangler kv:key delete "test-key" --env production --binding REDIRECT_KV

# Get KV value from staging
npx wrangler kv:key get "test-key" --env staging --binding REDIRECT_KV

# Put KV value in staging
npx wrangler kv:key put "test-key" "test-value" --env staging --binding REDIRECT_KV
```

### KV Bulk Operations

```bash
# Bulk delete keys
npx wrangler kv:bulk delete "test-key" --env production --binding REDIRECT_KV

# Bulk put from JSON file
npx wrangler kv:bulk put ./data.json --env production --binding REDIRECT_KV

# Bulk preview changes
npx wrangler kv:bulk put ./data.json --env production --binding REDIRECT_KV --dry-run
```

### Create New KV Namespaces

```bash
# Create staging KV namespace
npx wrangler kv:namespace create REDIRECT_KV --env staging
npx wrangler kv:namespace create ANALYTICS_KV --env staging

# Create production KV namespace
npx wrangler kv:namespace create REDIRECT_KV --env production
npx wrangler kv:namespace create ANALYTICS_KV --env production

# Preview KV namespace creation
npx wrangler kv:namespace create REDIRECT_KV --env staging --preview
```

## 🔐 Secrets Management

### GA4 API Secrets

```bash
# Set development secret
npm run secret:dev

# Set staging secret
npm run secret:staging

# Set production secret
npm run secret:prod

# Set custom secret
npx wrangler secret put CUSTOM_SECRET --env production
```

### Secret Operations

```bash
# List all secrets (values hidden)
npx wrangler secret list --env production

# List secrets for staging
npx wrangler secret list --env staging

# Delete secret (use with caution!)
npx wrangler secret delete GA4_API_SECRET --env production

# Delete multiple secrets
npx wrangler secret delete SECRET1 --env production
npx wrangler secret delete SECRET2 --env production
```

### Common Secrets Setup

```bash
# GA4 Measurement Protocol secrets (REQUIRED)
npx wrangler secret put GA4_API_SECRET --env dev
npx wrangler secret put GA4_API_SECRET --env staging
npx wrangler secret put GA4_API_SECRET --env production

# Optional additional secrets
npx wrangler secret put API_KEY --env production
npx wrangler secret put WEBHOOK_SECRET --env production
```

## 🌍 Environment Commands

### Environment-Specific Operations

```bash
# Test specific environment
npx wrangler dev --env staging

# Deploy to specific environment
npx wrangler deploy --env staging

# View logs from specific environment
npx wrangler tail --env staging

# List workers in specific environment
npx wrangler workers list --env staging
```

### Environment Configuration

```bash
# Check environment configuration
npx wrangler secret list --env production
npx wrangler kv:namespace list --env production

# Validate environment configuration
npx wrangler validate --env production

# Test environment connectivity
curl -I "https://cloudflare-redirect-staging.[subdomain].workers.dev/r?to=https://example.com"
```

## 🔧 Troubleshooting Commands

### Common Issues

```bash
# Check configuration
npm run validate

# Check login status
npm run whoami

# Check worker status
npx wrangler workers list

# Check environment variables
npx wrangler secret list --env production
```

### Debug Commands

```bash
# Debug build issues
npm run build

# Debug deployment issues
npx wrangler deploy --dry-run --env production

# Debug KV issues
npx wrangler kv:namespace list --env production

# Debug secret issues
npx wrangler secret list --env production
```

### Performance Debugging

```bash
# Check response time
time curl "https://your-domain.com/r?to=https://example.com"

# Check headers
curl -I "https://your-domain.com/r?to=https://example.com"

# Check response body
curl -v "https://your-domain.com/r?to=https://example.com"

# Monitor errors in real-time
npx wrangler tail --env production | grep -i error
```

### Reset/Recovery Commands

```bash
# Reset KV namespace (caution!)
# This would require recreating KV namespace

# Reset secrets (caution!)
npx wrangler secret delete GA4_API_SECRET --env production
npx wrangler secret put GA4_API_SECRET --env production

# Redeploy as last resort
npm run deploy:prod
```

## 🎯 Common Workflows

### Development Workflow

```bash
# 1. Start development
npm run dev

# 2. Test locally
curl "http://localhost:8787/r?to=https://example.com"

# 3. Run tests
npm test

# 4. Deploy to dev if needed
npm run deploy:dev
```

### Staging Deployment Workflow

```bash
# 1. Validate configuration
npm run validate

# 2. Run tests
npm test

# 3. Deploy to staging
npm run deploy:staging

# 4. Check logs
npm run logs:staging

# 5. Test staging endpoint
curl "https://cloudflare-redirect-staging.[subdomain].workers.dev/r?to=https://example.com"
```

### Production Deployment Workflow

```bash
# 1. Ensure staging tests pass
# (Run staging tests first)

# 2. Validate production config
npm run validate

# 3. Deploy to production
npm run deploy:prod

# 4. Monitor production logs
npm run logs:prod

# 5. Test production endpoint
curl "https://your-domain.com/r?to=https://example.com"
```

### Emergency Workflow

```bash
# 1. Check production status
npm run logs:prod

# 2. Identify issue
npx wrangler tail --env production | grep -i error

# 3. Fix issue in code
# (Make code changes)

# 4. Quick deploy fix
npm run deploy:prod

# 5. Monitor after fix
npm run logs:prod
```

## 📚 Additional Resources

- [Full Deployment Guide](./deployment-guide.md)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

---

**Tip**: Most commands support `--help` flag for additional options:
```bash
npx wrangler deploy --help
npx wrangler kv:key --help
npx wrangler secret --help
```

**Last Updated**: 2025-11-02
**Version**: 1.0.0