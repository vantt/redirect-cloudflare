# Common Use Cases

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)** | **[Getting Started](./README.md)**

---

## Overview

Real-world scenarios and patterns for using cloudflareRedirect.

---

## Use Case 1: URL Shortening Service

### Scenario
You want to create short, memorable URLs for sharing on social media or print materials.

### Implementation

**Setup KV mappings:**
```bash
# Create shortcodes pointing to long URLs
npx wrangler kv:key put "summer" '{"url":"https://example.com/campaigns/summer-2025?utm_source=social&utm_campaign=summer","type":"temporary"}' --env production --binding REDIRECT_KV

npx wrangler kv:key put "promo" '{"url":"https://example.com/promotions/special-offer?discount=20","type":"permanent"}' --env production --binding REDIRECT_KV
```

**Usage:**
```bash
# Short URL
https://your-domain.com/r?to=summer

# Expands to
https://example.com/campaigns/summer-2025?utm_source=social&utm_campaign=summer
```

**Benefits:**
- Easy to remember and type
- Analytics tracked automatically
- Can update destination without changing short URL

---

## Use Case 2: Marketing Campaign Tracking

### Scenario
Track campaign performance across different marketing channels (email, social, ads).

### Implementation

**Email campaigns:**
```
https://your-domain.com/r?to=https://example.com/products?utm_source=email&utm_medium=newsletter&utm_campaign=weekly_deals
```

**Social media:**
```
https://your-domain.com/r?to=https://example.com/products?utm_source=facebook&utm_medium=social&utm_campaign=weekly_deals
```

**Paid ads:**
```
https://your-domain.com/r?to=https://example.com/products?utm_source=google&utm_medium=cpc&utm_campaign=weekly_deals
```

### Analytics

All parameters automatically tracked to GA4:
```json
{
  "event": "redirect",
  "utm_source": "facebook",
  "utm_medium": "social",
  "utm_campaign": "weekly_deals",
  "destination": "https://example.com/products"
}
```

---

## Use Case 3: Legacy URL Migration

### Scenario
Migrating from an old URL structure to a new one while maintaining backwards compatibility.

### Old System
```
https://old-site.com/#https://destination.com
```

### New System (Automatic)
```
User visits: https://your-domain.com/#https://destination.com
    ↓
JavaScript extracts: https://destination.com
    ↓
Redirects to: /r?to=https://destination.com
    ↓
Server redirects to: https://destination.com
```

**No code changes needed!** Legacy links continue to work.

---

## Use Case 4: A/B Testing Redirects

### Scenario
Test different landing pages and track which performs better.

### Implementation

**Variant A:**
```
https://your-domain.com/r?to=https://example.com/landing-a?variant=a&utm_campaign=test
```

**Variant B:**
```
https://your-domain.com/r?to=https://example.com/landing-b?variant=b&utm_campaign=test
```

### Analysis
Compare conversion rates in GA4 by filtering on `variant` parameter.

---

## Use Case 5: Affiliate Link Tracking

### Scenario
Track clicks on affiliate links across your website or app.

### Implementation

```
https://your-domain.com/r?to=https://affiliate-site.com/product?ref=your-affiliate-id&xptdk=homepage-banner
```

### Benefits
- Track which placements drive most clicks (via `xptdk` parameter)
- Add your own custom tracking without modifying affiliate URL
- Analytics before redirect ensures tracking even if user bounces quickly

---

## Use Case 6: QR Code URLs

### Scenario
Generate QR codes for print materials (posters, flyers, product packaging).

### Implementation

**Create short, QR-friendly URLs:**
```bash
# Setup shortcode
npx wrangler kv:key put "poster2025" '{"url":"https://example.com/events/conference-2025?utm_source=qr&utm_medium=poster","type":"temporary"}' --binding REDIRECT_KV
```

**Generate QR code for:**
```
https://your-domain.com/r?to=poster2025
```

### Benefits
- Short URL = simpler QR code (easier to scan)
- Can update destination if event details change
- Track offline-to-online conversions via `utm_source=qr`

---

## Use Case 7: Email Signature Links

### Scenario
Add trackable links to employee email signatures.

### Implementation

```
https://your-domain.com/r?to=https://example.com/about?utm_source=email-sig&utm_medium=email&utm_campaign=employee-name
```

### Benefits
- Track which employees drive most website traffic
- Uniform branding across all employee signatures
- Easy to update destination (e.g., new landing page) centrally

---

## Use Case 8: Domain Allowlist Security

### Scenario
Prevent abuse by restricting redirects to only trusted domains.

### Implementation

**Configuration:**
```bash
# In .env or wrangler.toml
ALLOWED_DOMAINS=example.com,partner-site.com,trusted.org
```

**Behavior:**
```bash
# Allowed
curl "https://your-domain.com/r?to=https://example.com/page"
# → 302 redirect ✅

# Blocked
curl "https://your-domain.com/r?to=https://malicious-site.com"
# → 403 Forbidden ❌
```

### Use Cases
- Public-facing redirect services
- Partner-only redirect portals
- Internal company link shorteners

---

## Use Case 9: Multi-Language Redirects

### Scenario
Redirect users to language-specific pages based on parameters.

### Implementation

```bash
# English
https://your-domain.com/r?to=https://example.com/en/product?lang=en

# Spanish
https://your-domain.com/r?to=https://example.com/es/product?lang=es

# French
https://your-domain.com/r?to=https://example.com/fr/product?lang=fr
```

### Benefits
- Track language preferences via analytics
- Centralized redirect management
- Easy A/B testing across languages

---

## Use Case 10: Debug Mode for Testing

### Scenario
Test redirect behavior without actually redirecting (useful for QA, development).

### Implementation

**Normal redirect:**
```bash
curl "https://your-domain.com/r?to=https://example.com"
# → 302 redirect (user redirected)
```

**Debug mode:**
```bash
curl "https://your-domain.com/r?to=https://example.com&debug=1"
# → 200 OK with JSON response (no redirect)

{
  "destination": "https://example.com",
  "tracking_params": {},
  "redirect_type": "302",
  "note": "Debug mode - redirect suppressed"
}
```

### Use Cases
- QA testing redirect logic
- Debugging tracking parameters
- Validating destination URLs before deploying

---

## Combining Use Cases

### Example: Campaign + QR + Tracking

```bash
# Setup short URL for QR code on poster
npx wrangler kv:key put "event2025" '{"url":"https://example.com/events/conference?utm_source=qr&utm_medium=poster&utm_campaign=conference2025&variant=a","type":"temporary"}' --binding REDIRECT_KV

# QR code contains:
https://your-domain.com/r?to=event2025

# Analytics captures:
# - utm_source=qr (from QR code)
# - utm_medium=poster (from print material)
# - utm_campaign=conference2025 (event name)
# - variant=a (A/B test variant)
```

---

## Best Practices

### 1. Always Include UTM Parameters
```
✅ Good: ?utm_source=email&utm_medium=newsletter&utm_campaign=weekly
❌ Bad: No parameters (can't track in analytics)
```

### 2. Use Meaningful Shortcodes
```
✅ Good: summer2025, promo-shoes, event-nyc
❌ Bad: abc123, xyz789 (not memorable)
```

### 3. Test with Debug Mode First
```bash
# Always test with debug=1 before deploying
curl "https://your-domain.com/r?to=new-campaign&debug=1"
```

### 4. Use Appropriate Redirect Types
```
302 (Temporary): Campaigns, A/B tests, time-limited promos
301 (Permanent): Rebr ands, permanent URL changes (future feature)
```

### 5. Monitor Analytics
- Check GA4 regularly for tracking issues
- Set up alerts for unusual redirect patterns
- Review domain allowlist blocks

---

## Next Steps

- → **[Configuration Guide](./configuration.md)** - Set up analytics and security
- → **[Deployment Guide](../guides/deployment-guide.md)** - Deploy to production
- → **[Analytics System](../features/analytics/)** - Deep dive on tracking

---

↖️ **[Back to README](../../README.md)** | **[Docs Index](../README.md)** | **[Getting Started](./README.md)**
