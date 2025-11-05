# Developer Guide

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)** | **[Guides](./README.md)**

---

## 🎯 Quick Start

### Prerequisites
- Node.js 18+
- Vitest for testing
- TypeScript knowledge
- Cloudflare Workers basics

### Development Workflow
1. Read [Project Structure Guide](./project-structure.md)
2. Follow [Code Organization Rules](#code-organization)
3. Write tests before/after code changes
4. Follow [Testing Guidelines](#testing-guidelines)

## 🏗️ Code Organization Rules

### 1. **Module Creation Checklist**

Before creating new code:
```bash
# 1. Check existing structure
find src/lib -name "*keyword*"
find test/unit -name "*keyword*"

# 2. Follow directory patterns
# Source: src/lib/[module]/[files]
# Tests: test/unit/lib/[module]/[files]

# 3. Use existing naming conventions
# Implementation: camelCase or kebab-case
# Tests: [name].test.ts
# Types: types.ts
```

### 2. **Import Path Rules**

```typescript
// ✅ CORRECT PATTERNS

// Same module - relative import
import { Helper } from './helper'

// Same module - from types
import { AnalyticsEvent } from '../types'

// Different module - from index
import { AnalyticsEvent } from '../../lib/analytics/types'

// Provider factory - from providers directory
import { createGA4Provider } from '../providers/ga4'

// ❌ WRONG PATTERNS

// Don't create deep nesting unnecessarily
import { Something } from '../../../../src/lib/analytics/ga4/utils/helpers'

// Don't import from test files in source code
import { mockData } from '../../../test/utils/mock'
```

### 3. **File Organization Patterns**

#### **Small Modules (1-2 files)**
```
src/lib/analytics/
├── types.ts
├── router.ts
└── registry.ts
```

#### **Medium Modules (3+ files)**
```
src/lib/analytics/ga4/
├── types.ts
├── provider.ts
├── payload-builder.ts
└── index.ts
```

#### **Large Modules (sub-modules)**
```
src/lib/analytics/ga4/
├── types.ts
├── core/
│   ├── provider.ts
│   └── index.ts
├── builders/
│   ├── payload-builder.ts
│   └── index.ts
└── index.ts
```

### 4. **Export Patterns**

```typescript
// types.ts - Type definitions only
export interface GA4Config {
  measurementId: string
  apiSecret: string
}

// implementation.ts - Core logic
export class GA4Provider implements AnalyticsProvider {
  // implementation
}

// index.ts - Public API
export { GA4Provider } from './provider'
export type { GA4Config } from './types'
// Don't export internal helpers
```

## 🧪 Testing Guidelines

### 1. **Test Structure Rules**

```typescript
// ✅ CORRECT TEST STRUCTURE
src/lib/analytics/ga4/provider.ts
test/unit/lib/analytics/providers/ga4.test.ts  // Provider factory tests

src/lib/analytics/types.ts
test/unit/lib/analytics/types.test.ts          // Type tests

src/lib/analytics/router.ts
test/unit/lib/analytics/router.test.ts        // Router tests
```

### 2. **Test File Creation Rules**

```bash
# Before creating test files:
1. Check existing test structure
2. Follow naming conventions
3. Use correct import paths
4. Mirror source structure exactly

# Test file patterns:
unit tests:     [filename].test.ts
integration:   [feature]-integration.test.ts
e2e:          [journey]-e2e.test.ts
```

### 3. **Import Paths in Tests**

```typescript
// ✅ CORRECT - From test directory to source
import { GA4Provider } from '../../../../../src/lib/analytics/ga4/provider'
import { AnalyticsEvent } from '../../../../../src/lib/analytics/types'

// ✅ CORRECT - Using relative paths from test location
import { createTestEnv } from '../../../fixtures/env'
import { MockProvider } from './provider-mocks'

// ❌ WRONG - Creating incorrect paths
import { Something } from '../../../../src/lib/analytics/ga4/subdir'  // Check if exists!
```

### 4. **Test Organization Checklist**

```typescript
// ✅ TEST FILE TEMPLATE
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ModuleBeingTested } from '../../../../src/lib/module/path'
import { createTestEnv } from '../../../fixtures/env'

describe('ModuleName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should work correctly', () => {
    // Test implementation
  })
})
```

## 📋 Development Checklist

### Before Writing Code:
- [ ] Check existing implementation
- [ ] Read relevant documentation
- [ ] Understand test structure
- [ ] Identify correct file locations

### While Writing Code:
- [ ] Follow TypeScript conventions
- [ ] Add appropriate type definitions
- [ ] Include error handling
- [ ] Add logging where needed

### After Writing Code:
- [ ] Create/update tests
- [ ] Check import paths
- [ ] Run test suite
- [ ] Update documentation

### Before Creating New Files:
- [ ] Verify file doesn't exist elsewhere
- [ ] Choose correct directory
- [ ] Follow naming conventions
- [ ] Plan test structure

## 🚫 Common Mistakes to Avoid

### 1. **File Structure Mistakes**
```bash
❌ WRONG - Creating test subdirectories that mirror source subdirectories
test/unit/lib/analytics/ga4/provider.test.ts  # Don't create ga4/ in tests!

✅ CORRECT - Tests go in logical directories
test/unit/lib/analytics/providers/ga4.test.ts
```

### 2. **Import Path Mistakes**
```typescript
❌ WRONG - Not checking if paths exist
import { Something } from '../../../src/lib/analytics/ga4/utils/helper'

✅ CORRECT - Verify paths before using
// First check: ls src/lib/analytics/ga4/utils/helper.ts
// Then import if it exists
```

### 3. **Module Organization Mistakes**
```typescript
❌ WRONG - Creating too many small files
src/lib/analytics/ga4/
├── types.ts
├── utils.ts
├── helpers.ts
├── constants.ts
└── validators.ts

✅ CORRECT - Group related functionality
src/lib/analytics/ga4/
├── types.ts
├── provider.ts          // Includes utils, helpers, constants
└── index.ts
```

## 🔧 Tool Configuration

### VSCode Settings (.vscode/settings.json)
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "files.exclude": {
    "**/dist": true,
    "**/node_modules": true
  }
}
```

### TypeScript Path Mapping (tsconfig.json)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@src/*": ["./src/*"],
      "@test-utils/*": ["./test/utils/*"]
    }
  }
}
```

## 📚 Learning Resources

### Required Reading:
1. [Project Structure Guide](./project-structure.md)
2. [Analytics Provider Guide](./developer-guide-analytics-providers.md)
3. [Testing Guidelines](./testing-guide.md)

### Reference:
- TypeScript Handbook
- Vitest Documentation
- Cloudflare Workers Documentation

## 🤝 Getting Help

### When stuck:
1. Check [Project Structure Guide](./project-structure.md)
2. Look at existing similar implementations
3. Ask team for clarification
4. Create GitHub issue for discussion

### For code reviews:
- Check file locations
- Verify import paths
- Ensure test coverage
- Follow naming conventions

---

**Remember**: Consistency over perfection. When in doubt, follow existing patterns!

---

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)** | **[Guides](./README.md)**