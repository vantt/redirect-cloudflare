# 🔴 Architecture Documentation

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)**

Deep technical documentation covering system architecture, design decisions, and technical specifications.

---

## 📚 Architecture Documents

### Core Architecture
- **[Architecture](./architecture.md)** ⭐ - Complete system architecture, ADRs, and design decisions
- **[Project Structure](./project-structure.md)** ⭐ - File organization, module patterns, and structure rules
- **[Epic 2 Technical Architecture](./epic-2-technical-architecture.md)** - Foundation architecture decisions

### Technical Specifications
- **[Error Handling Specification](./error-handling-specification.md)** - Error patterns and handling strategies

---

## 🎯 Document Overview

### Architecture (architecture.md)
**Audience:** Architects, senior developers, technical decision-makers
**Content:** Executive summary, technology stack, design patterns, ADRs
**Time:** 60 minutes deep read

Key sections:
- Executive Summary
- Technology Stack (Hono, TypeScript, Cloudflare Workers)
- Epic-to-Architecture Mapping
- Analytics Abstraction (Epic 7)
- Implementation Patterns
- Architecture Decision Records (ADRs)

### Project Structure (project-structure.md)
**Audience:** All developers
**Content:** File organization rules, module patterns, test structure
**Time:** 20-30 minutes

Key sections:
- Directory Organization
- Module Organization Rules
- Test Structure Rules
- File Naming Conventions
- Import Path Guidelines

### Error Handling Specification
**Audience:** Developers implementing error handling
**Content:** Error patterns, custom error classes, global error handling
**Time:** 15 minutes

---

## 🏗️ System Overview

### Technology Stack
- **Runtime:** Cloudflare Workers (V8 isolates, global edge network)
- **Framework:** Hono v4.10+ (ultra-fast web framework)
- **Language:** TypeScript v5.9+ (strict mode)
- **Data Store:** Cloudflare KV (JSON objects)
- **Validation:** Zod v4.1+ with Hono validator
- **Testing:** Vitest v4.0 + Miniflare
- **Analytics:** GA4 Measurement Protocol (direct integration)

### Project Structure
```
src/
├── lib/                   # Core library code
│   ├── analytics/        # Analytics module (Epic 7-8)
│   │   ├── ga4/         # GA4 provider
│   │   ├── providers/   # Provider factories
│   │   ├── router.ts    # Event routing
│   │   └── types.ts     # Analytics types
│   ├── destination-resolver.ts
│   ├── validation.ts
│   └── ...
├── routes/
│   ├── redirect.ts      # Main redirect endpoint
│   └── bootstrap.ts     # Legacy URL bootstrap
└── index.ts             # Entry point
```

### Key Architecture Decisions

**ADR-001: Hono Framework**
Why: Ultra-fast routing, TypeScript-first, minimal bundle (~14KB)

**ADR-002: JSON in KV**
Why: Flexible structure, future extensibility, ~1ms overhead acceptable

**ADR-003: Direct GA4 Integration**
Why: Simpler than GTM, direct control, 2s timeout protection

**ADR-004: Vitest + Miniflare**
Why: Accurate Workers emulation, fast execution, ESM-native

**ADR-005: Type-Safe Environment**
Why: Compile-time safety, clear env var documentation

---

## 📖 Reading Paths

### Understanding Overall Architecture (1-2 hours)
1. [Architecture](./architecture.md) - Read executive summary first
2. [Project Structure](./project-structure.md) - Understand file organization
3. [Error Handling](./error-handling-specification.md) - Error patterns

### Before Building New Features
1. [Architecture](./architecture.md) - Review relevant epic mapping
2. [Project Structure](./project-structure.md) - Plan file locations
3. Review relevant tech specs in [Features](../features/)

### Making Architecture Decisions
1. [Architecture](./architecture.md) - Review existing ADRs
2. Check consistency with current decisions
3. Document new ADRs if needed

---

## 🔗 Related Documentation

- **[Developer Guide](../guides/developer-guide.md)** - Development patterns based on architecture
- **[Features](../features/)** - Feature-specific architecture details
- **[PRD](../reference/prd.md)** - Product requirements driving architecture

---

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)**
