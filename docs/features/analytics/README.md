# Analytics System

↖️ **[Back to README](../../../README.md)** | **[Docs Index](../../README.md)** | **[Features](../README.md)**

Multi-provider analytics architecture for tracking redirects before they happen.

---

## 📚 Analytics Documentation

- **[Provider Development Guide](./developer-guide-analytics-providers.md)** - How to add new analytics providers
- **[Tracking Parameters Guide](./tracking-params-guide.md)** - UTM parameters and custom tracking
- **[Tech Spec Epic 7](./tech-spec-epic-7.md)** - Complete technical specification

---

## 🎯 Overview

The analytics system provides a vendor-neutral abstraction layer for tracking redirect events across multiple analytics platforms.

### Key Features
- **Multi-Provider Support:** GA4, Mixpanel, and extensible for more
- **Provider Isolation:** Failures in one provider don't affect others
- **Timeout Protection:** Per-provider timeouts prevent blocking redirects
- **Structured Logging:** Consistent observability across all providers
- **Zero Lock-In:** Easy to add/remove/swap analytics providers

### Architecture

```
Redirect Event
    ↓
AnalyticsEvent (Neutral Model)
    ↓
Router (Fan-out to providers)
    ↓
├── GA4 Provider → GA4 Measurement Protocol
├── Mixpanel Provider → Mixpanel API
└── [Future Providers...]
```

---

## 🔧 How It Works

### 1. Event Extraction
```typescript
// Extract tracking params from destination URL
const trackingParams = extractTrackingParams(destinationUrl)
// Result: { utm_source: 'fb', utm_campaign: 'summer', ... }
```

### 2. Event Creation
```typescript
// Create neutral event model
const event: AnalyticsEvent = {
  name: 'redirect',
  attributes: {
    short_url: '/r?to=...',
    destination: 'https://example.com',
    redirect_type: '302',
    ...trackingParams
  }
}
```

### 3. Provider Routing
```typescript
// Route to enabled providers
const providers = loadProviders(env) // Based on ANALYTICS_PROVIDERS env var
await routeAnalyticsEvent(event, providers)
// Concurrent dispatch with isolation and timeouts
```

### 4. Provider Execution
```typescript
// Each provider converts to its format
// GA4: Converts to Measurement Protocol payload
// Mixpanel: Converts to Mixpanel event format
// Etc.
```

---

## 📖 Documentation

### For Users
- **[Tracking Parameters Guide](./tracking-params-guide.md)** - What parameters are tracked and how

### For Developers
- **[Provider Development Guide](./developer-guide-analytics-providers.md)** - Add new analytics providers
- **[Tech Spec Epic 7](./tech-spec-epic-7.md)** - Complete technical details

---

## 🚀 Adding a New Provider

See **[Provider Development Guide](./developer-guide-analytics-providers.md)** for step-by-step instructions.

Quick overview:
1. Implement `AnalyticsProvider` interface
2. Create provider factory function
3. Register in `registry.ts`
4. Add environment variables
5. Write tests

---

## 🔗 Related Documentation

- **[GA4 Integration](../ga4/)** - Google Analytics 4 specific implementation
- **[Architecture](../../architecture/architecture.md)** - System-wide design decisions
- **[Tech Spec Epic 8](../ga4/tech-spec-epic-8.md)** - GA4 technical specification

---

↖️ **[Back to README](../../../README.md)** | **[Docs Index](../../README.md)**
