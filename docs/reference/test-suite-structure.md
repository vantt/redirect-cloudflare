# Test Suite Structure Documentation

**Updated:** 2025-10-28  
**Status:** ✅ Refactored and Documented

---

## 📁 New Test Structure

Sau refactor, test suite có cấu trúc rõ ràng theo Testing Pyramid:

```
test/
├── 📄 setup.ts                          # Global test setup
├── 📁 helpers/                          # Test utilities & helpers
│   └── config.ts
├── 📁 fixtures/                         # Test fixtures & mock data
│   ├── basic.test.ts
│   ├── env.test.ts
│   └── env.ts
├── 📁 unit/                             # Unit Tests (22 files)
│   ├── 📁 lib/                         # Library module tests
│   │   ├── 📁 analytics/               # Analytics module tests
│   │   │   ├── 📁 providers/
│   │   │   │   └── provider-mocks.test.ts
│   │   │   ├── provider-adapter.example.test.ts
│   │   │   ├── registry.test.ts
│   │   │   ├── router.observe.test.ts
│   │   │   ├── router.timeout.test.ts
│   │   │   └── types.test.ts
│   │   ├── config.test.ts
│   │   ├── errors.test.ts
│   │   ├── kv-store.test.ts
│   │   ├── tracking.test.ts
│   │   ├── validation-allowlist.test.ts
│   │   └── validation.test.ts
│   ├── 📁 routes/                      # Route function unit tests
│   │   └── parse-destination.test.ts
│   ├── ga4-timeout.test.ts
│   ├── logger.test.ts
│   └── redirect-logic.test.ts
├── 📁 integration/                      # Integration Tests (12 files)
│   ├── 📁 routes/                      # HTTP route integration tests
│   │   ├── bootstrap-legacy.test.ts
│   │   ├── redirect-allowlist.test.ts
│   │   ├── redirect-basic.test.ts
│   │   ├── redirect-debug.test.ts
│   │   ├── redirect-security.test.ts
│   │   └── redirect-validation.test.ts
│   ├── error-handling.test.ts
│   ├── ga4-http-integration.test.ts
│   ├── logger-middleware.test.ts
│   ├── redirect-endpoint.test.ts
│   ├── redirect-types.test.ts
│   └── startup-validation.test.ts
├── 📁 e2e/                              # End-to-End Tests (2 files)
│   ├── analytics-router.e2e.test.ts
│   └── legacy-upgrade.e2e.test.ts
├── 📁 utils/                             # Test utilities
│   ├── common.test-utils.ts
│   └── mock-analytics.ts
└── 📁 deleting/                          # Temporary storage for deprecated files
    ├── .gitignore                         # Git ignore all files in this folder
    ├── bootstrap.test.ts                   # Placeholder (moved)
    ├── debug.test.ts                       # Placeholder (moved)
    ├── test-simple.test.ts                 # Placeholder (moved)
    ├── debug-test.js                       # Temporary file (moved)
    ├── env-binding.test.js                 # Temporary file (moved)
    └── setup.ts.bak                        # Backup file (moved)
```

---

## 🎯 Test Categories & Responsibilities

### 🧪 Unit Tests (`test/unit/`)
**Purpose:** Test individual functions/classes in isolation
**Count:** 22 test files
**Scope:** 
- Pure functions without external dependencies
- Single class/method testing
- Business logic validation
- Edge case handling

### 🔗 Integration Tests (`test/integration/`)
**Purpose:** Test multiple components working together
**Count:** 12 test files
**Scope:**
- HTTP endpoint testing
- Database interaction
- Component integration
- Request/response flow

### 🌐 End-to-End Tests (`test/e2e/`)
**Purpose:** Test complete user workflows
**Count:** 2 test files
**Scope:**
- Full application flow
- Real user scenarios
- Cross-component interactions
- Performance validation

### 🛠️ Test Utilities
**Purpose:** Shared testing infrastructure
**Components:**
- **`helpers/`** - Test setup, mock environments
- **`fixtures/`** - Mock data, test scenarios
- **`utils/`** - Common test utilities

---

## 🚀 Running Tests

### All Tests
```bash
npm test
```

### By Category
```bash
# Unit tests only
npm test -- test/unit

# Integration tests only  
npm test -- test/integration

# E2E tests only
npm test -- test/e2e
```

### By Module
```bash
# Analytics module tests
npm test -- test/unit/lib/analytics

# Route integration tests
npm test -- test/integration/routes

# Configuration tests
npm test -- test/unit/lib/config.test.ts
```

### With Coverage
```bash
npm test -- --coverage
```

### Specific Test
```bash
npm test -- -t "should redirect with valid parameters"
```

---

## 📏 Test Organization Principles

### 1. **Clear Separation**
- Unit vs Integration vs E2E clearly separated
- No mixed responsibilities in single test file
- Consistent naming conventions

### 2. **Scalable Structure**
- Easy to add new tests in correct location
- Module-based organization within categories
- Clear hierarchy for maintenance

### 3. **Import Path Standards**
All test files use relative imports:
```typescript
// From unit/lib/ (depth 3)
import { SomeType } from '../../../src/types/env.js'
import { createMockEnv } from '../../helpers/config.js'

// From integration/ (depth 2)  
import { SomeType } from '../../../src/types/env.js'
import { createMockEnv } from '../../helpers/config.js'

// From e2e/ (depth 2)
import { SomeType } from '../../../../src/types/env.js'
```

### 4. **Configuration Management**
- Environment mocking handled in `helpers/config.ts`
- Test fixtures in `fixtures/` directory
- Global setup in `setup.ts`

---

## 🔄 Migration Summary

### Before (Mixed Structure)
```
├── 8 mixed files at root level ⚠️
├── test/unit/lib/: 12 unit tests (wrong location) ⚠️
├── test/integration/routes/: 5 integration tests (wrong location) ⚠️
├── test/unit/: 3 unit tests ✅
├── test/integration/: 6 integration tests ✅
└── test/e2e/: 1 e2e test ✅
```

### After (Organized Structure)
```
├── Root level: 1 setup file ✅
├── test/unit/: 22 unit tests ✅ (properly organized)
├── test/integration/: 12 integration tests ✅ (properly organized)
├── test/e2e/: 2 e2e tests ✅
└── test/deleting/: 6 deprecated files (safe removal)
```

### Benefits Achieved
✅ **Clear Testing Pyramid** - Unit, Integration, E2E properly separated  
✅ **Better Discoverability** - Easy to find tests by type/module  
✅ **Scalable Organization** - Clear structure for new tests  
✅ **Improved Maintainability** - Related tests grouped together  
✅ **Selective Test Execution** - Can run test types independently  
✅ **Cleaner Root Directory** - No more mixed files at root level  

---

## 🛡️ Safety Features

### Git Ignore for Deprecated Files
```bash
# test/deleting/.gitignore
*
!.gitignore
```
- All deprecated files are git-ignored
- Won't be committed to repository
- Can be safely recovered if needed

### Test Exclusion
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    exclude: [
      'node_modules',
      'dist', 
      'test/deleting/**'  // Deprecated files excluded
    ]
  }
})
```

---

## 📋 Development Guidelines

### Adding New Tests

1. **Unit Tests** → `test/unit/lib/` or `test/unit/routes/`
2. **Integration Tests** → `test/integration/` or `test/integration/routes/`
3. **E2E Tests** → `test/e2e/`
4. **Test Utilities** → `test/helpers/` or `test/utils/`
5. **Test Data** → `test/fixtures/`

### File Naming Conventions
- Unit tests: `*.test.ts`
- Integration tests: `*.test.ts`
- E2E tests: `*.e2e.test.ts`
- Fixture files: `*.test.ts` (in fixtures/ directory)

### Import Path Guidelines
- Use relative imports for test files
- Use absolute imports (`@/`) for source files if configured
- Consistent `.js` extensions for imports

---

## 🔧 Maintenance Tasks

### Regular Cleanup
1. Remove deprecated files from `test/deleting/` after verification
2. Update documentation when adding new test categories
3. Review test coverage reports quarterly

### When Issues Occur
1. Check import paths if tests fail to load
2. Verify vitest configuration includes test patterns
3. Ensure relative paths match file structure

---

## 📚 References

- [Testing Pyramid - Martin Fowler](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Vitest Configuration Guide](https://vitest.dev/config/)
- [Cloudflare Workers Testing Best Practices](https://developers.cloudflare.com/workers/testing/)

---

**This documentation should be updated when:**
- New test categories are added
- Major structural changes occur  
- New testing patterns are introduced
- Every 6 months for review