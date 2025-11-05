# GA4 Integration

↖️ **[Back to README](../../../README.md)** | **[Docs Index](../../README.md)** | **[Features](../README.md)**

Google Analytics 4 integration using the Measurement Protocol API.

---

## 📚 GA4 Documentation

- **[Tech Spec Epic 8](./tech-spec-epic-8.md)** - Complete GA4 technical specification

---

## 🎯 Overview

The GA4 provider implements direct integration with Google Analytics 4 using the Measurement Protocol v2 API.

### Features
- **Direct API Integration:** No GTM server-side container needed
- **Timeout Protection:** 2-second timeout prevents blocking redirects
- **Structured Logging:** Success/failure tracking for observability
- **Type-Safe Configuration:** TypeScript types for GA4 config

---

## 🔧 Configuration

### Environment Variables

Required:
- `GA4_MEASUREMENT_ID` - Your GA4 Measurement ID (format: `G-XXXXXXXXXX`)
- `GA4_API_SECRET` - GA4 API Secret (from GA4 Admin > Measurement Protocol)

Optional:
- `ANALYTICS_PROVIDERS` - Must include `"ga4"` to enable
- `ANALYTICS_TIMEOUT_MS` - Timeout per provider (default: 2000ms)

### Setup

```bash
# 1. Set measurement ID in wrangler.toml
[env.production.vars]
GA4_MEASUREMENT_ID = "G-XXXXXXXXXX"

# 2. Set API secret via Wrangler CLI
npx wrangler secret put GA4_API_SECRET --env production

# 3. Enable GA4 provider
[env.production.vars]
ANALYTICS_PROVIDERS = "ga4"
```

---

## 📊 Events Tracked

### Redirect Event
```javascript
{
  name: 'redirect',
  params: {
    short_url: '/r?to=...',
    destination: 'https://example.com',
    redirect_type: '302',
    // Plus any UTM parameters from destination URL
    utm_source: 'facebook',
    utm_medium: 'social',
    utm_campaign: 'summer',
    // Plus custom tracking parameters
    xptdk: 'custom123'
  }
}
```

---

## 🏗️ Implementation Details

### Architecture
```
Redirect Request
    ↓
Extract Tracking Params
    ↓
Create AnalyticsEvent
    ↓
Analytics Router
    ↓
GA4 Provider
    ↓
Build GA4 Payload
    ↓
HTTP POST to GA4 Measurement Protocol
    (with 2s timeout)
    ↓
Log Success/Failure
    ↓
Continue with Redirect (non-blocking)
```

### Payload Structure
```typescript
{
  client_id: '<generated-uuid>',
  events: [{
    name: 'redirect',
    params: {
      short_url: string,
      destination: string,
      redirect_type: string,
      ...tracking_params
    }
  }]
}
```

---

## 🧪 Testing

### Local Testing
```bash
# 1. Start dev server
npm run dev

# 2. Test redirect with tracking
curl "http://localhost:8787/r?to=https://example.com?utm_source=test"

# 3. Check logs for GA4 success
# Should see: "GA4 tracking successful"
```

### Verify in GA4
1. Go to GA4 Admin > Data Streams
2. View "Measurement Protocol API secrets"
3. Check "Realtime" report in GA4
4. Look for "redirect" events

---

## 🔍 Troubleshooting

### Events not appearing in GA4?

**Check 1:** Verify configuration
```bash
# Check measurement ID
npx wrangler tail --env production | grep GA4_MEASUREMENT_ID

# Check if provider enabled
npx wrangler tail --env production | grep "analytics.*ga4"
```

**Check 2:** Check logs
```bash
# Look for GA4 errors
npx wrangler tail --env production | grep "GA4.*error"
```

**Check 3:** Verify API secret
- Regenerate in GA4 Admin if needed
- Reset via: `npx wrangler secret put GA4_API_SECRET`

### Timeout errors?
- Default 2s timeout may be too short
- Increase via `ANALYTICS_TIMEOUT_MS` env var
- Or check network connectivity to GA4 API

---

## 📖 Related Documentation

- **[Analytics System](../analytics/)** - Multi-provider architecture
- **[Tech Spec Epic 7](../analytics/tech-spec-epic-7.md)** - Analytics foundation
- **[Tracking Parameters](../analytics/tracking-params-guide.md)** - Parameter extraction

---

↖️ **[Back to README](../../../README.md)** | **[Docs Index](../../README.md)**
