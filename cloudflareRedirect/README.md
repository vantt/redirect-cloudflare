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

```bash
npm test
```

### Testing Environment

This project includes comprehensive test environment fixtures and helpers to ensure consistent testing across unit and integration tests.

#### Test Fixtures Location

- **Environment fixtures**: `test/fixtures/env.ts` - Shared test environment presets
- **Test helpers**: `test/helpers/config.ts` - Convenience wrappers around fixtures
- **Example usage**: `test/fixtures/env.test.ts` - Living documentation for fixture patterns

#### Common Test Patterns

**Basic test environment:**
```typescript
import { createMockEnv } from './test/helpers/config.ts'

const env = createMockEnv()
// Returns minimal Env with safe defaults
```

**GA4-enabled test environment:**
```typescript
import { testEnvWithGA4 } from './test/fixtures/env.ts'

const env = testEnvWithGA4
// Pre-configured with GA4 credentials for analytics testing
```

**Custom test environment:**
```typescript
import { createMockEnv } from './test/helpers/config.ts'

const env = createMockEnv({
  ENABLE_TRACKING: 'true',
  ANALYTICS_PROVIDERS: 'ga4',
  GA4_MEASUREMENT_ID: 'G-CUSTOM123'
})
```

#### Test Environment Documentation

See [`.env.test`](./.env.test) for detailed documentation of test environment variables and usage examples. This file serves as a reference for creating test environments with different configurations.

For production environment configuration guidance, see **Story 1.6: Environment Configuration Management** in the project documentation.

## Deploy
```
wrangler deploy
```

## Configuration

### KV Namespaces
- KV binding `REDIRECT_KV` is declared in `wrangler.toml`. Replace `id` with your namespace.
- Type bindings in `src/types/env.ts`.

### Environment Configuration

The application uses environment variables for configuration. All variables are optional and have sensible defaults unless otherwise noted.

For local development, copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

#### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ALLOWED_DOMAINS` | No | - | Comma-separated list of allowed redirect domains. If set, redirects are restricted to these domains only. |
| `ENABLE_TRACKING` | No | `false` | Feature flag to enable analytics tracking. Set to `"true"` to enable. |
| `DEFAULT_REDIRECT_URL` | No | - | Default URL for root endpoint when no hash fragment is present. |
| `ANALYTICS_PROVIDERS` | No | - | Comma-separated list of analytics providers. Supported: `"ga4"`. |
| `GA4_MEASUREMENT_ID` | Conditional* | - | Google Analytics 4 Measurement ID (format: `G-XXXXXXXXXX`). |
| `GA4_API_SECRET` | Conditional* | - | Google Analytics 4 API Secret from GA4 Admin > Data Streams > Measurement Protocol API secrets. |
| `ANALYTICS_TIMEOUT_MS` | No | `2000` | Per-provider analytics timeout in milliseconds. Must be a positive number. |

*Required when `ANALYTICS_PROVIDERS` includes `"ga4"`.

#### Local Development Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure variables** in `.env` as needed for your environment

3. **Run development server:**
   ```bash
   npm run dev
   ```

The `.env` file is gitignored and will be automatically loaded by Wrangler during local development.

#### Production Configuration

For production deployment, configure environment variables using one of these methods:

1. **wrangler.toml** - Add environment-specific sections:
   ```toml
   [env.production]
   vars = { ENABLE_TRACKING = "true" }
   ```

2. **Cloudflare Dashboard** - Set secrets via Workers dashboard for sensitive values like `GA4_API_SECRET`

3. **Wrangler CLI** - Set secrets via command line:
   ```bash
   wrangler secret put GA4_API_SECRET
   ```

See [`.env.example`](./.env.example) for complete documentation of all available environment variables.

