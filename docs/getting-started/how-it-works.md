# How It Works

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)** | **[Getting Started](./README.md)**

---

## Overview

Understanding how cloudflareRedirect works conceptually will help you use it effectively.

---

## The Redirect Flow

### Simple Redirect (No Analytics)

```
User Request
    ↓
http://your-domain.com/r?to=https://example.com
    ↓
[1] Extract destination URL: https://example.com
[2] Validate URL format
[3] Check domain allowlist (if enabled)
[4] Return 302 redirect
    ↓
User Browser → https://example.com
```

**Time:** ~3-5ms (sub-5ms target)

### Redirect with Analytics

```
User Request
    ↓
http://your-domain.com/r?to=https://example.com?utm_source=fb
    ↓
[1] Extract destination: https://example.com?utm_source=fb
[2] Extract tracking params: { utm_source: 'fb' }
[3] Validate URL
[4] Send analytics event (GA4, etc.) ← Waits up to 2s
[5] Return 302 redirect
    ↓
User Browser → https://example.com?utm_source=fb
```

**Time:** ~3-5ms + analytics time (max 2s timeout)

---

## Legacy URL Upgrade

The service supports legacy `/#url` format from old implementations.

### Legacy Format

```
http://your-domain.com/#https://example.com
```

### Upgrade Flow

```
User Request: /#https://example.com
    ↓
[1] Server returns HTML with JavaScript
[2] JavaScript extracts URL from hash fragment
[3] JavaScript redirects to /r?to=<extracted-url>
    ↓
http://your-domain.com/r?to=https://example.com
    ↓
[4] Server handles as normal redirect
    ↓
User Browser → https://example.com
```

**Why?** Hash fragments (#) aren't sent to server, so client-side extraction is needed.

---

## URL Parameter Handling

### Input: Complex URL

```
/r?to=https://example.com?param1=value1&param2=value2
```

### Processing

1. **Locate `to` parameter:** Find final `to=` in query string
2. **Extract destination:** Everything after `to=`
3. **Decode if needed:** Handle URL encoding
4. **Preserve parameters:** Keep all destination parameters intact

### Output

```
302 Found
Location: https://example.com?param1=value1&param2=value2
```

All parameters preserved!

---

## Analytics Tracking

### What Gets Tracked

```
Redirect Event {
  destination: "https://example.com"
  redirect_type: "302"
  short_url: "/r?to=..."

  // Extracted from destination URL
  utm_source: "facebook"
  utm_medium: "social"
  utm_campaign: "summer"
  xptdk: "custom123"
}
```

### Multi-Provider Architecture

```
Analytics Event (Neutral Format)
    ↓
Analytics Router
    ↓
├── GA4 Provider → Google Analytics
├── Mixpanel Provider → Mixpanel API
└── [Future Providers...]
```

**Benefits:**
- Track to multiple platforms simultaneously
- Provider failures don't affect redirect
- Easy to add/remove providers

---

## Validation & Security

### URL Validation

```
Input URL
    ↓
[1] Check format (Zod validator)
    ✓ Must be valid URL
    ✓ Must start with http:// or https://
    ✗ No javascript: URLs
    ✗ No data: URLs
    ↓
[2] Check domain (if allowlist enabled)
    ✓ Domain in ALLOWED_DOMAINS
    ✓ Subdomain of allowed domain
    ✗ Any other domain
    ↓
[3] Proceed with redirect
```

### Error Handling

```
Error Detected
    ↓
[1] Create RedirectError(message, code, status)
[2] Global error handler catches it
[3] Return JSON error response
    ↓
{
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

---

## Performance Optimization

### Edge Execution

```
User in Tokyo
    ↓
Cloudflare Edge (Tokyo) ← Code runs here!
    ↓ ~5ms
User in Tokyo
```

**Not:**
```
User in Tokyo
    ↓ ~200ms
Server in US ← Slow!
    ↓ ~200ms
User in Tokyo
```

### KV Storage (Future)

```
Short URL: /r?to=abc123
    ↓
[1] Detect potential shortcode (no http://)
[2] KV.get('abc123')
[3] If found: Use stored URL
[4] If not found: Treat as literal destination
```

---

## Debug Mode

### Normal Mode

```
/r?to=https://example.com
    ↓
302 Found
Location: https://example.com
```

**User sees:** Immediate redirect to destination

### Debug Mode

```
/r?to=https://example.com&debug=1
    ↓
200 OK
Content-Type: application/json

{
  "destination": "https://example.com",
  "tracking_params": {},
  "redirect_type": "302",
  "note": "Debug mode - redirect suppressed"
}
```

**User sees:** JSON response with redirect details (no actual redirect)

---

## Architecture Layers

```
┌─────────────────────────────────────┐
│  Routes (HTTP Endpoints)            │
│  - /r (redirect)                    │
│  - / (legacy bootstrap)             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Business Logic                     │
│  - Query parsing                    │
│  - Destination resolution           │
│  - Validation                       │
│  - Analytics tracking               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Infrastructure                     │
│  - KV store                         │
│  - Analytics providers              │
│  - Error handling                   │
│  - Logging                          │
└─────────────────────────────────────┘
```

---

## Key Concepts

### 1. Redirect Types

- **302 (Temporary):** Current default, doesn't affect SEO
- **301 (Permanent):** Future feature, transfers SEO value

### 2. Analytics Timing

- **Pre-Redirect:** Tracking happens BEFORE redirect
- **Why:** Ensures tracking even if user closes browser quickly
- **Timeout:** 2s max to prevent blocking redirect

### 3. Edge Performance

- **Edge Execution:** Code runs globally, closest to user
- **Sub-5ms Target:** Redirect processing under 5ms
- **No Cold Starts:** V8 isolates start instantly (<1ms)

### 4. Provider Isolation

- **Independent:** Each analytics provider runs in isolation
- **Failure Handling:** One provider failing doesn't affect others
- **Concurrent:** Providers called simultaneously (not sequential)

---

## Real-World Example

### User Journey

1. User clicks short link: `https://short.link/summer`
2. DNS resolves to Cloudflare edge (nearest location)
3. Edge worker processes redirect:
   - Resolves `summer` → full URL from KV
   - Extracts UTM parameters from destination
   - Sends event to GA4 (50ms)
   - Returns 302 redirect
4. User's browser redirects to final destination
5. Total time: ~55ms (most is analytics, redirect is 5ms)

### From User Perspective

**Fast:** Click → Destination page loads immediately
**Tracked:** Analytics captured even on fast redirect
**Reliable:** Works globally with low latency

---

## What You've Learned

✅ How redirects flow through the system
✅ How legacy URLs are upgraded
✅ How analytics tracking works (pre-redirect)
✅ How URL validation and security work
✅ How edge execution provides performance
✅ How debug mode helps testing

---

## Next Steps

- → **[Use Cases](./use-cases.md)** - Common scenarios and patterns
- → **[Architecture](../architecture/architecture.md)** - Deep technical dive
- → **[Developer Guide](../guides/developer-guide.md)** - Start building

---

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)** | **[Getting Started](./README.md)**
