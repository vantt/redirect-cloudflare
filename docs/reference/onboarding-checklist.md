# Developer Onboarding Checklist

## 🎯 First Day Setup

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] Git configured
- [ ] VSCode (recommended) with extensions:
  - TypeScript
  - Vitest
  - ES7+ React/Redux/React-Native snippets

### Environment Setup
```bash
# 1. Clone repository
git clone [repository-url]
cd redirect_bmadv6

# 2. Install dependencies
npm install

# 3. Run tests to verify setup
npm test

# 4. Start development server
npm run dev
```

### Required Reading - **READ FIRST**
1. [Project Structure Guide](./project-structure.md) ⭐ **MOST IMPORTANT**
2. [Developer Guide](./developer-guide.md) ⭐ **SECOND MOST IMPORTANT**
3. [Testing Guide](./testing-guide.md) ⭐ **THIRD MOST IMPORTANT**

## 🏗️ Understanding the Codebase

### Core Architecture
```
redirect_bmadv6/
├── src/lib/analytics/     # Analytics system (Epic 7)
├── src/lib/redirect/     # Redirect logic
├── src/lib/kv-store/     # KV store abstraction
└── src/worker/           # Cloudflare Worker entry points
```

### Key Concepts to Understand
1. **Analytics Abstraction (Epic 7)**: Provider pattern for multiple analytics services
2. **GA4 Integration (Epic 8)**: Google Analytics 4 provider implementation
3. **Parameter Extraction**: UTM and platform-specific parameter handling
4. **Provider Registry**: Dynamic provider loading and configuration

### File Structure Rules - **CRITICAL**
```bash
# ✅ CORRECT
src/lib/analytics/ga4/provider.ts           # Source code
test/unit/lib/analytics/providers/ga4.test.ts  # Provider tests

# ❌ WRONG - Don't create test subdirectories that mirror source!
test/unit/lib/analytics/ga4/provider.test.ts  # WRONG!
```

## 🧪 Testing Your Understanding

### Verification Tasks
1. **Run the test suite**:
   ```bash
   npm test
   # Expected: 67+ tests passing
   ```

2. **Understand test structure**:
   ```bash
   # Check existing test files
   ls test/unit/lib/analytics/
   ls test/unit/lib/analytics/providers/
   ```

3. **Verify imports work**:
   - Create a simple test file
   - Use correct import paths
   - Run tests to confirm no errors

### Practical Exercise
Create a simple test to verify you understand the structure:

```typescript
// test/unit/lib/analytics/structure-verification.test.ts
import { describe, it, expect } from 'vitest'
import { AnalyticsEvent } from '../../../../../src/lib/analytics/types'

describe('Project Structure Understanding', () => {
  it('should import AnalyticsEvent correctly', () => {
    const event: AnalyticsEvent = {
      name: 'test',
      attributes: {}
    }
    expect(event.name).toBe('test')
  })
})
```

## 📚 Epic and Story Context

### Current Work Status
- ✅ **Epic 7 (Analytics Abstraction)**: Complete
  - Stories 7.1-7.8 implemented
  - 67/67 tests passing

- ✅ **Story 8.1 (GA4 Payload Builder)**: Complete
  - GA4 provider implementation done
  - Core functionality working

- ❌ **Story 8.2 (GA4 HTTP Delivery)**: Next story
  - HTTP implementation needed
  - Real GA4 API calls

### Key Files to Study
```
src/lib/analytics/
├── types.ts              # Core analytics types
├── provider.ts            # Provider interface
├── router.ts              # Event routing
├── registry.ts            # Provider registry
├── tracking-service.ts    # High-level tracking API
└── ga4/                   # GA4 implementation
    ├── types.ts           # GA4-specific types
    ├── provider.ts        # GA4 provider
    ├── payload-builder.ts # Payload creation
    └── index.ts           # Exports

test/unit/lib/analytics/
├── providers/ga4.test.ts   # GA4 provider factory tests
├── types.test.ts          # Type definition tests
├── router.test.ts         # Router tests
├── registry.test.ts       # Registry tests
└── tracking-service.test.ts # Service tests
```

## 🚨 Common Pitfalls to Avoid

### 1. **File Structure Mistakes**
```bash
❌ WRONG - Creating test subdirectories that mirror source
test/unit/lib/analytics/ga4/provider.test.ts  # Don't do this!

✅ CORRECT - Following established patterns
test/unit/lib/analytics/providers/ga4.test.ts
```

### 2. **Import Path Mistakes**
```typescript
❌ WRONG - Not checking if paths exist
import { Something } from '../../../src/lib/analytics/ga4/utils/helper'

✅ CORRECT - Verify paths before using
// First: ls src/lib/analytics/ga4/utils/helper.ts
// Then import if it exists
```

### 3. **Module Organization Mistakes**
```typescript
❌ WRONG - Creating too many small files
src/lib/analytics/ga4/
├── types.ts
├── utils.ts
├── helpers.ts
└── constants.ts

✅ CORRECT - Group related functionality
src/lib/analytics/ga4/
├── types.ts
├── provider.ts    # Includes utils, helpers, constants
└── index.ts
```

## 🛠️ Development Workflow

### Daily Development Routine
1. **Check git status**:
   ```bash
   git status
   git pull origin main
   ```

2. **Run tests before coding**:
   ```bash
   npm test
   ```

3. **Make changes following structure rules**
4. **Write/update tests**
5. **Run tests again**:
   ```bash
   npm test
   ```

6. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: implement feature"
   git push
   ```

### Before Creating New Files
```bash
# 1. Check existing structure
find src/lib -name "*keyword*"
find test -name "*keyword*"

# 2. Follow naming conventions
# Source: camelCase or kebab-case (existing pattern)
# Tests: [filename].test.ts

# 3. Choose correct directory
# Consult project-structure.md

# 4. Plan test structure
# Mirror source structure exactly
```

## 📞 Getting Help

### When You're Stuck
1. **Check documentation first**:
   - [Project Structure Guide](./project-structure.md)
   - [Developer Guide](./developer-guide.md)
   - [Testing Guide](./testing-guide.md)

2. **Look at existing examples**:
   ```bash
   # Find similar implementations
   find src/lib -name "*.ts" | grep -i analytics
   find test -name "*.test.ts" | grep analytics
   ```

3. **Ask the team**:
   - Create GitHub issue for discussion
   - Ask in team chat for clarification
   - Schedule code review session

### Code Review Process
1. **Self-review checklist**:
   - [ ] Correct file locations
   - [ ] Proper import paths
   - [ ] Test coverage
   - [ ] Documentation updated

2. **Request review**:
   - Create pull request
   - Reference relevant stories/epics
   - Include testing information

## ✅ Verification Checklist

### Before Starting Work
- [ ] Read all required documentation
- [ ] Understand project structure
- [ ] Set up development environment
- [ ] Run tests successfully

### During Development
- [ ] Following file structure rules
- [ ] Using correct import paths
- [ ] Writing appropriate tests
- [ ] Updating documentation

### Before Submitting Work
- [ ] All tests passing
- [ ] Code reviewed (if applicable)
- [ ] Documentation updated
- [ ] No breaking changes

---

## 🎓 Learning Path

### Week 1: Foundation
- Read all documentation
- Understand project structure
- Run and study existing tests
- Set up development environment

### Week 2: Analytics System
- Study Epic 7 implementation
- Understand provider pattern
- Review GA4 implementation
- Practice creating simple tests

### Week 3: Development Practice
- Make small contributions
- Write tests for existing code
- Practice file structure rules
- Participate in code reviews

### Week 4: Independent Work
- Take on small stories/tasks
- Implement new features following patterns
- Write comprehensive tests
- Document your work

---

**Remember**: Consistency is more important than perfection. When in doubt, follow existing patterns and ask for help!