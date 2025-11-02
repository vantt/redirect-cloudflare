# CLAUDE.md

```xml
<activation critical="MANDATORY">
    <step n="1">Load critical policy files:
        - Read `{project-root}/project-context.md` for Context Prime Complete Project Understanding      
    </step>
</activation>
```

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

### Development
```bash
npm run dev          # Start development server (wrangler dev)
npm run build        # TypeScript compilation
npm test             # Run all tests
npm test test/unit   # Unit tests only
npm test test/integration # Integration tests only
```

### Testing
```bash
npm test -- --coverage     # Run tests with coverage
npm test -- --watch        # Watch mode
npm test -- filename.test.ts # Run specific test file
```

### Deployment
```bash
wrangler deploy            # Deploy to Cloudflare Workers
wrangler secret put VAR    # Set production secrets
```

## Project Architecture

This is a **Cloudflare Workers + Hono** URL shortening/redirect service with analytics capabilities.

### Core Components

**Main Application (`src/index.ts`)**:
- Hono-based HTTP server
- Environment validation middleware
- Request logging middleware
- Global error handling
- Routes: `/r` (redirect API) and `/` (bootstrap for legacy URLs)

**Redirect Service (`src/routes/redirect.ts`)**:
- Primary API endpoint: `/r` with `to` parameter
- 6-step process: Parse → Resolve → Validate → Debug (optional) → Track → Redirect
- Health check endpoint at `/r/health`
- Supports both URL-encoded and raw destination parameters
- Debug mode with `debug=1` parameter

**Analytics System (`src/lib/analytics/`)**:
- **Modular provider architecture**: GA4 (implemented), Mixpanel (stubbed)
- **Key files**:
  - `tracking-service.ts`: Main orchestrator for redirect tracking
  - `router.ts`: Routes events to appropriate providers
  - `registry.ts`: Provider registration and loading
  - `providers/ga4.ts`: GA4 Measurement Protocol implementation
  - `types.ts`: Common analytics interfaces

**Key Infrastructure**:
- **Query parsing** (`src/lib/query-parser.ts`): Extracts destination URLs and debug mode
- **Destination resolution** (`src/lib/destination-resolver.ts`): Handles KV lookups for shortcodes
- **Validation** (`src/lib/validation.ts`): URL and domain validation
- **Error handling** (`src/lib/errors.ts`): Custom `RedirectError` class with status codes
- **Environment typing** (`src/types/env.ts`): Comprehensive environment variable definitions

### Analytics Provider Pattern

The analytics system uses a **factory pattern** for providers:
1. Providers are registered in `registry.ts` with environment variable dependencies
2. `tracking-service.ts` orchestrates the tracking flow
3. `router.ts` distributes events to enabled providers
4. Each provider implements a consistent interface

**GA4 Implementation**: Uses Google Analytics 4 Measurement Protocol API with:
- Event payload building in `src/lib/analytics/ga4/payload-builder.ts`
- Provider factory in `src/lib/analytics/providers/ga4.ts`
- Configuration via `GA4_MEASUREMENT_ID` and `GA4_API_SECRET`

## Development Guidelines

### File Structure Rules (CRITICAL)

**Test Organization**:
- Unit tests: Mirror source structure exactly
  - `src/lib/analytics/ga4/provider.ts` → `test/unit/lib/analytics/providers/ga4.test.ts`
  - **Important**: Provider tests go in `providers/` directory, NOT in `ga4/` subdirectory
- Integration tests: By feature (`test/integration/analytics/`)
- Test fixtures: `test/fixtures/env.ts` for environment presets

**Module Organization**:
- Small modules (1-2 files): Keep flat
- Medium modules (3+ files): Create dedicated directory with `index.ts`
- Large modules: Use sub-directories with their own `index.ts` files

### Import Path Patterns

```typescript
// ✅ CORRECT
import { AnalyticsEvent } from '../types'                    // Same module
import { GA4Provider } from '../../../src/lib/analytics/ga4'  // Cross-module
import { createGA4Provider } from './providers/ga4'          // Provider factories

// ❌ WRONG - Don't create deep nesting unnecessarily
import { Something } from '../../../../src/lib/analytics/ga4/utils/helper'
```

### Environment Variables

The application uses comprehensive environment variable configuration:
- **Feature flags**: `ENABLE_TRACKING`, `ALLOWED_DOMAINS`
- **Analytics**: `ANALYTICS_PROVIDERS`, `GA4_MEASUREMENT_ID`, `GA4_API_SECRET`
- **Timeouts**: `ANALYTICS_TIMEOUT_MS`
- **Development**: Use `.env` file (gitignored)
- **Production**: Configure via `wrangler.toml` or Cloudflare Dashboard

### Error Handling Pattern

All errors use the `RedirectError` class from `src/lib/errors.ts`:
```typescript
throw new RedirectError('Error message', 'ERROR_CODE', 400)
```

Common error codes: `MISSING_PARAM`, `INVALID_URL`, `DOMAIN_NOT_ALLOWED`, `VALIDATION_ERROR`

## Testing Strategy

### Critical Policies

  1. Always use path alias for import
  2. Never delete immediately - luôn backup trước
  3. Create parallel versions để so sánh
  4. Gradual migration - copy test cases có giá trị
  5. Preserve intellectual property - test cases là tài sản
   
### Test Environment Fixtures

Use predefined environment fixtures from `test/fixtures/env.ts`:
- `createMockEnv()`: Minimal environment with safe defaults
- `testEnvWithGA4`: Pre-configured GA4 environment for analytics testing

### Test Patterns

```typescript
// Standard test template
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ModuleBeingTested } from '../../../../../src/lib/module/path'
import { createMockEnv } from '../../../fixtures/env'

describe('ModuleName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should work correctly', () => {
    const env = createMockEnv()
    // Test implementation
  })
})
```

### Running Tests

- **All tests**: `npm test`
- **Unit only**: `npm test test/unit`
- **Integration only**: `npm test test/integration`
- **Coverage**: `npm test -- --coverage`
- **Watch mode**: `npm test -- --watch`

## BMAD Workflow Integration

This project includes BMAD (Business Model Agile Development) workflow automation:

### Available Commands
- `/bmad:bmm:agents:dev` - Development agent
- `/bmad:bmm:agents:architect` - Architecture agent
- `/bmad:bmm:agents:sm` - Scrum Master agent
- `/bmad:bmm:workflows:story-context` - Story context workflow

### Workflow Documentation
Comprehensive BMAD workflow documentation is available in `bmad/bmm/workflows/` with detailed instructions for various development scenarios.

## Key Implementation Notes

### URL Parameter Handling
The service supports both URL-encoded and raw `to` parameters with sophisticated parsing that:
1. Locates the final `to=` segment in query strings
2. Ensures proper parameter order (debug before to)
3. Handles URL decoding exactly once when needed
4. Maintains backward compatibility with legacy `n=1` parameter (translated to `debug=1`)

### KV Store Integration
Short URL resolution uses Cloudflare KV with conditional loading to optimize performance - KV lookups only occur when potential shortcodes are detected.

### Analytics Flow
1. Extract tracking parameters from both destination and original URLs
2. Build standardized redirect event with context (short URL, destination, redirect type)
3. Route to enabled providers (GA4, Mixpanel, etc.)
4. Handle failures gracefully with structured logging

### Logging
Uses structured logging via `src/utils/logger.ts` with consistent error formatting and context preservation for debugging and monitoring.