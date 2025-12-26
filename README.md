# cloudflareRedirect

High-performance URL redirect service built on Cloudflare Workers.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]() [![TypeScript](https://img.shields.io/badge/TypeScript-5.9%2B-blue)]() [![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)]()

---

## ⚡ What is This?

A serverless URL redirect service that runs at the edge on Cloudflare's global network. Built with **Hono** and **TypeScript**, it provides sub-5ms redirect latency with built-in analytics tracking.

**Perfect for:**

- URL shortening services
- Marketing campaign tracking
- Legacy URL migration
- Analytics-tracked redirects

---

## ✨ Key Features

### Core Capabilities

- 🚀 **Server-Side Redirects** - Fast 301/302 redirects with KV-backed URL mapping
- 📊 **Pre-Redirect Analytics** - Track events BEFORE redirect happens (GA4 + extensible)
- 🔄 **Legacy URL Support** - Auto-upgrade `/#url` format to modern `/r?to=url`
- 🐛 **Debug Mode** - Test redirects without actual navigation (`debug=1` parameter)

### Technical Highlights

- ⚡ **Edge Performance** - Sub-5ms latency via Cloudflare Workers + V8 isolates
- 🔒 **Type Safety** - Full TypeScript with Zod validation
- 🧪 **Comprehensive Testing** - 300+ tests (98.3% pass rate) with Vitest + Miniflare
- 🌍 **Multi-Environment** - Dev/Staging/Production ready with 3-tier deployment
- 🔌 **Extensible Analytics** - Multi-provider architecture (GA4, Mixpanel, custom)

→ **[Complete Feature Documentation](./docs/README.md#features)**

---

## 🚀 Quick Start

### For First-Time Users (5 minutes)

```bash
# 1. Clone and install
git clone <repository-url>
cd redirect_bmadv6
npm install

# 2. Start development server
npm run dev

# 3. Test your first redirect
curl "http://localhost:8787/r?to=https://google.com"
```

**Success?** You should see a 302 redirect! 🎉

→ **[Detailed Installation Guide](./docs/getting-started/installation.md)**
→ **[Your First Redirect Tutorial](./docs/getting-started/first-redirect.md)**

### For Developers (Returning)

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm test             # Run all tests (300+ tests)
npm run build        # Build TypeScript
npm run deploy:prd
wrangler deploy      # Deploy (see deployment guide first!)
```

→ **[Developer Guide](./docs/guides/developer-guide.md)** | **[Testing Guide](./docs/guides/testing-guide.md)**

---

## 📚 Documentation

### By User Level

**🟢 Beginner** (Start here!)

- [Installation Guide](./docs/getting-started/installation.md) - Setup from scratch (15 min)
- [Your First Redirect](./docs/getting-started/first-redirect.md) - Quick tutorial (5 min)
- [How It Works](./docs/getting-started/how-it-works.md) - Conceptual overview (20 min)
- [Configuration Guide](./docs/getting-started/configuration.md) - Basic setup (10 min)

**🟡 Intermediate** (Building features)

- [Developer Guide](./docs/guides/developer-guide.md) ⭐ - Development workflow & patterns
- [Testing Guide](./docs/guides/testing-guide.md) ⭐ - Testing strategy & best practices
- [Deployment Guide](./docs/guides/deployment-guide.md) ⭐ - 3-environment deployment
- [Wrangler Commands](./docs/guides/wrangler-commands.md) - Cloudflare CLI reference

**🔴 Advanced** (Deep technical)

- [Architecture](./docs/architecture/architecture.md) - System design & ADRs
- [Project Structure](./docs/architecture/project-structure.md) - File organization rules (IMPORTANT!)
- [Analytics System](./docs/features/analytics/) - Multi-provider analytics architecture
- [GA4 Integration](./docs/features/ga4/) - Google Analytics 4 implementation

→ **[Full Documentation Index](./docs/README.md)** (Organized by topic and user level)

---

## 🏗️ Project Structure

**IMPORTANT:** Read **[Project Structure Guide](docs/architecture/project-structure.md)** before adding code!

```
src/
├── lib/
│   ├── analytics/          # Analytics system (Epic 7-8)
│   │   ├── ga4/            # GA4 provider
│   │   ├── providers/      # Provider factories
│   │   ├── router.ts       # Event routing
│   │   └── types.ts        # Analytics types
│   ├── destination-resolver.ts # URL resolution
│   ├── validation.ts       # Security & validation
│   └── ...
├── routes/
│   ├── redirect.ts         # Main redirect endpoint (/r)
│   └── bootstrap.ts        # Legacy URL upgrade (/)
└── index.ts                # Entry point

test/
├── unit/                   # Unit tests (185 tests)
├── integration/            # Integration tests (91 tests)
├── e2e/                    # End-to-end tests (20 tests)
└── fixtures/               # Test data & mocks
```

→ **[Complete Structure Guide](./docs/architecture/project-structure.md)**

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test test/unit                    # Unit tests only
npm test test/integration             # Integration tests only
npm test test/e2e                     # E2E tests only

# Run with coverage
npm test -- --coverage

# Watch mode (auto-rerun on changes)
npm test -- --watch

# Run specific file
npm test test/unit/lib/validation.test.ts
```

**Current Status:**

- ✅ **303 total tests**
- ✅ **298 passing** (98.3% pass rate)
- ⚠️ **5 failing** (router observability - Story 5.2 scope)

→ **[Testing Guide](./docs/guides/testing-guide.md)** | **[Testing Strategy](./docs/reference/testing-strategy-simple.md)**

---

## 🚀 Deployment

### Quick Deploy

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production (careful!)
npm run deploy:prod

# View production logs
npm run logs:prod
```

### Environment Configuration

The service supports 3 environments:

- **Development** (`npm run dev`) - Local testing with hot reload
- **Staging** (`deploy:staging`) - Pre-production testing
- **Production** (`deploy:prod`) - Live production environment

Each environment has its own:

- KV namespaces (URL storage)
- GA4 properties (analytics)
- Environment variables (secrets, config)

→ **[Complete Deployment Guide](./docs/guides/deployment-guide.md)** | **[Wrangler Commands](./docs/guides/wrangler-commands.md)**

---

## 🔧 Configuration

### Basic Configuration

```bash

# .dev.vars (for local secrets) or .env (for local config)
DEFAULT_REDIRECT_URL=https://example.com
ENABLE_TRACKING=false

# Note: .dev.vars is the native way to handle local secrets in Workers.
# .env is also supported for standard variables.
# These files are gitignored.
```

### Security Configuration (Optional)

```bash
# Restrict redirects to specific domains
ALLOWED_DOMAINS=example.com,trusted-site.com
```

### Analytics Configuration (Optional)

```bash
# Enable GA4 tracking
ANALYTICS_PROVIDERS=ga4
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=your-api-secret-here
```

→ **[Configuration Guide](./docs/getting-started/configuration.md)** | **[GA4 Setup](./docs/features/ga4/)**

---

## 📖 API Reference

### Redirect Endpoint: `GET /r`

**Basic redirect:**

```bash
curl "https://your-domain.com/r?to=https://example.com"
# → 302 Found, Location: https://example.com
```

**Debug mode:**

```bash
curl "https://your-domain.com/r?to=https://example.com&debug=1"
# → 200 OK, JSON response with redirect details
```

**With tracking parameters:**

```bash
curl "https://your-domain.com/r?to=https://example.com?utm_source=fb&utm_campaign=summer"
# → 302 Found, parameters preserved + tracked
```

### Legacy Bootstrap: `GET /`

Supports legacy `/#url` format:

```
https://your-domain.com/#https://example.com
→ Auto-upgrades to: /r?to=https://example.com
→ Server redirects to: https://example.com
```

---

## 🤝 Contributing

### Required Reading (Before First Contribution)

1. **[Project Structure Guide](./docs/architecture/project-structure.md)** ⭐⭐⭐ - File organization rules
2. **[Developer Guide](./docs/guides/developer-guide.md)** ⭐⭐⭐ - Development workflow
3. **[Testing Guide](./docs/guides/testing-guide.md)** ⭐⭐⭐ - Testing patterns
4. **[Onboarding Checklist](./docs/reference/onboarding-checklist.md)** - New developer onboarding

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes following structure guide
# See: docs/architecture/project-structure.md

# 3. Write tests
npm test -- --watch

# 4. Run full test suite
npm test

# 5. Build and check
npm run build

# 6. Create PR
# Follow PR template
```

---

## 🛠️ Technology Stack

- **Runtime:** Cloudflare Workers (V8 isolates, global edge network)
- **Framework:** Hono v4.10+ (ultra-fast web framework, ~14KB)
- **Language:** TypeScript v5.9+ (strict mode, full type safety)
- **Data Store:** Cloudflare KV (distributed key-value, JSON objects)
- **Validation:** Zod v4.1+ with Hono validator (14x faster parsing)
- **Testing:** Vitest v4.0 + Miniflare (accurate Workers runtime emulation)
- **Analytics:** GA4 Measurement Protocol (direct integration, extensible)

→ **[Architecture Documentation](./docs/architecture/architecture.md)** | **[Tech Stack Details](./docs/architecture/architecture.md#technology-stack-details)**

---

## 📊 Project Status

### Completed Epics

- ✅ **Epic 1:** Core Redirect Engine
- ✅ **Epic 2:** Error Handling & Validation
- ✅ **Epic 3:** Domain Allowlist Security
- ✅ **Epic 5:** Structured Logging (70% - observability pending)
- ✅ **Epic 7:** Analytics Abstraction (multi-provider architecture)
- ✅ **Epic 8:** GA4 Integration

### Current Focus

- 📍 Documentation optimization
- 📍 Test coverage improvements
- 📍 Observability enhancements

→ **[Epic Overview](./docs/reference/epics.md)** | **[PRD](./docs/reference/prd.md)**

---

## 📚 Additional Resources

### Documentation

- **[Full Documentation Index](./docs/README.md)** - Complete docs navigation
- **[Getting Started](./docs/getting-started/)** - Beginner guides
- **[Guides](./docs/guides/)** - Development, testing, deployment
- **[Architecture](./docs/architecture/)** - Technical deep-dive
- **[Reference](./docs/reference/)** - PRD, epics, specifications

### External Links

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework Docs](https://hono.dev/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Vitest Testing Docs](https://vitest.dev/)

---

## 📄 License

MIT

---

## 🆘 Support & Issues

- **Documentation:** [Full Docs](./docs/README.md)
- **Getting Started:** [Installation](./docs/getting-started/installation.md) | [First Redirect](./docs/getting-started/first-redirect.md)
- **Issues & Bugs:** [GitHub Issues](#)
- **Questions:** Check [How It Works](./docs/getting-started/how-it-works.md) or [Developer Guide](./docs/guides/developer-guide.md)

---

**Built with ❤️ using Cloudflare Workers, Hono, and TypeScript**
