# Project Structure Guide

## 📁 Directory Organization

### Root Structure
```
redirect_bmadv6/
├── src/                    # Source code (production code)
├── test/                   # Test code (unit/integration/e2e)
├── docs/                   # Documentation
├── .github/               # GitHub workflows & templates
├── scripts/               # Build/deployment scripts
├── dist/                  # Build output (generated)
└── package.json
```

### Source Code Structure (`src/`)
```
src/
├── lib/                   # Core library code
│   ├── analytics/        # Analytics module
│   │   ├── ga4/         # GA4 provider implementation
│   │   ├── providers/   # Provider factory functions
│   │   ├── router.ts    # Analytics router
│   │   ├── registry.ts  # Provider registry
│   │   ├── types.ts     # Analytics types
│   │   └── tracking-service.ts
│   ├── kv-store/        # KV store abstraction
│   ├── redirect/        # Redirect logic
│   └── utils/           # Utility functions
├── worker/               # Cloudflare Worker entry points
├── types/                # Global type definitions (Env, etc.)
└── index.ts              # Main entry point
```

### Test Structure (`test/`)
```
test/
├── unit/                 # Unit tests
│   └── lib/
│       └── analytics/   # Mirror src/lib/analytics structure
│           ├── providers/  # Provider tests (ga4.test.ts, etc.)
│           ├── router.test.ts
│           ├── types.test.ts
│           └── tracking-service.test.ts
├── integration/          # Integration tests
│   └── analytics/
│       └── ga4-integration.test.ts
├── e2e/                  # End-to-end tests
├── fixtures/            # Test data and mocks
│   ├── env.ts
│   └── mock-analytics.ts
└── utils/               # Test utilities
    └── mock-providers.ts
```

## 🏗️ Module Organization Rules

### 1. **Module Structure Pattern**
Each module should follow this structure:
```
src/lib/[module-name]/
├── types.ts             # Module-specific types
├── implementation.ts    # Core logic (if simple)
├── index.ts            # Public exports
├── sub-module/         # For complex modules
│   ├── types.ts
│   ├── implementation.ts
│   └── index.ts
└── tests/              # Tests for this module (if module is large)
    ├── implementation.test.ts
    └── sub-module.test.ts
```

### 2. **Test Structure Rules**
- **Unit tests**: Mirror source structure exactly
  - `src/lib/analytics/ga4/provider.ts` → `test/unit/lib/analytics/providers/ga4.test.ts`
  - Note: Provider tests go in `providers/` directory, not `ga4/`
- **Integration tests**: By feature/domain
  - `test/integration/analytics/ga4-integration.test.ts`
- **E2E tests**: By user journey
  - `test/e2e/redirect-journey.test.ts`

### 3. **File Naming Conventions**

#### Source Files
- **Implementation files**: kebab-case or camelCase (existing pattern)
- **Type files**: `types.ts`
- **Index files**: `index.ts`
- **Module main files**: module-name (e.g., `analytics.ts`)

#### Test Files
- **Unit tests**: `[filename].test.ts`
- **Integration tests**: `[feature]-integration.test.ts`
- **E2E tests**: `[journey]-e2e.test.ts`

## 📦 Module Dependencies

### 1. **Dependency Direction**
```
Higher Level → Lower Level
Application → Business Logic → Infrastructure
```

### 2. **Import Rules**
- **Use relative paths** for internal module imports
- **Use absolute paths** for cross-module imports (via tsconfig paths)
- **No circular dependencies**

### 3. **Export Rules**
- **Use index.ts** for public API
- **Private implementation**: No export from index.ts
- **Types**: Export from `types.ts` or index.ts

## 🔍 File Location Rules

### When to Create New Directories:
1. **Module has 3+ files** → Create dedicated directory
2. **Module has sub-modules** → Create sub-directories
3. **Test file shares name with source** → Put in test directory

### When to Keep Files Flat:
1. **Simple utilities** (1-2 files)
2. **Type definitions** (single types.ts file)
3. **Small helper functions**

## 🧪 Test Organization Rules

### 1. **Test Placement**
```
✅ CORRECT:
src/lib/analytics/ga4/provider.ts
test/unit/lib/analytics/providers/ga4.test.ts

❌ WRONG:
src/lib/analytics/ga4/provider.ts
test/unit/lib/analytics/ga4/provider.test.ts  (Don't create ga4/ in tests!)
```

### 2. **Test Naming**
- Unit tests: `[module-name].test.ts`
- Integration tests: `[feature]-integration.test.ts`
- E2E tests: `[journey]-e2e.test.ts`

### 3. **Mock Organization**
- Test mocks: `test/fixtures/` or `test/utils/`
- Provider mocks: `test/utils/mock-providers.ts`
- Data fixtures: `test/fixtures/`

## 📚 Documentation Structure

```
docs/
├── README.md                    # Main documentation
├── project-structure.md         # This file
├── developer-guide.md           # Development guidelines
├── epic-overviews/             # Epic documentation
│   ├── epic-7-analytics.md
│   └── epic-8-ga4.md
├── stories/                    # User stories
├── technical-design/           # Technical design docs
├── deployment/                 # Deployment guides
└── api/                        # API documentation
```

## 🔧 Development Rules

### 1. **Before Creating New Files**
1. Check if similar functionality exists
2. Follow existing patterns
3. Consult this structure guide
4. Ask team if unsure

### 2. **File Creation Checklist**
- [ ] Correct directory location
- [ ] Follow naming conventions
- [ ] Add appropriate exports
- [ ] Create corresponding test file
- [ ] Update documentation if needed

### 3. **Import Path Guidelines**
```typescript
// ✅ CORRECT - Relative for same module
import { AnalyticsEvent } from '../types'

// ✅ CORRECT - From module index
import { GA4Provider } from '../../../src/lib/analytics/ga4'

// ✅ CORRECT - From providers directory
import { createGA4Provider } from './providers/ga4'

// ❌ WRONG - Creating new directories unnecessarily
import { Something } from '../../../../src/lib/analytics/ga4/new-subdir/file'
```

## 🚀 Migration Guidelines

When refactoring or moving files:
1. Update all import statements
2. Update test files
3. Update documentation
4. Run full test suite
5. Update any configuration files

---

## 📞 Getting Help

If you're unsure about file placement:
1. Check existing similar files
2. Consult this guide
3. Look at test patterns
4. Ask team for clarification

**Remember**: Consistency is more important than perfection. When in doubt, follow existing patterns.