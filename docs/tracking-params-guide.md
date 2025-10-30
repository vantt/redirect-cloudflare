# Tracking Parameters Guide

## Overview

The redirect system automatically tracks analytics events before redirecting users. This guide explains how tracking parameters work and how to control tracking behavior.

**Key Concept:** The system extracts tracking parameters from BOTH the destination URL and the original request URL, giving you flexible control over tracking data.

---

## How Tracking Parameters Work

### Purpose

Tracking parameters are used to track and analyze redirect events in **your redirect system's analytics** (not the destination website's analytics). This helps you understand:
- Which campaigns drive the most redirects
- What sources users come from
- Performance of different marketing channels

### Automatic Extraction

The system automatically extracts tracking parameters from:
1. **Destination URL** (checked first)
2. **Original Request URL** (checked second)

Then merges them using an **original-wins** strategy.

---

## Parameter Merge Behavior

### Extraction Order

```
Step 1: Extract from Destination URL (checked first)
Step 2: Extract from Original Request URL (checked second)
Step 3: Merge with Original Wins strategy
```

### Merge Strategy: Original Wins

When the same parameter exists in both URLs, **the original request parameter overwrites the destination parameter**.

This allows you to:
- ✅ Reuse destination tracking when convenient
- ✅ Override specific parameters for special campaigns
- ✅ Have full control by choosing what to pass

---

## Common Use Cases

### Use Case 1: Reuse Destination Tracking

**When to use:** Destination URL already has tracking parameters and you want to reuse them.

**How:** Don't pass any tracking parameters in the original request URL.

```
Original Request:  /r?to=short-abc
Destination URL:   https://shop.com/product?utm_source=facebook&utm_campaign=sale2024

✅ Tracking Result:
{
  utm_source: 'facebook',
  utm_campaign: 'sale2024'
}
```

**Why this works:** System extracts from destination, finds no params in original, uses destination tracking.

---

### Use Case 2: Add Missing Parameters

**When to use:** Destination has some tracking params but you want to add more.

**How:** Pass only the additional parameters in the original request URL.

```
Original Request:  /r?to=short-abc&utm_medium=social&utm_content=post123
Destination URL:   https://shop.com/product?utm_source=facebook

✅ Tracking Result:
{
  utm_source: 'facebook',      // ← From destination
  utm_medium: 'social',        // ← Added from original
  utm_content: 'post123'       // ← Added from original
}
```

**Why this works:** Original params don't conflict with destination, so all params are merged.

---

### Use Case 3: Override Specific Parameters

**When to use:** Destination has tracking but you want to override specific values for a special campaign.

**How:** Pass only the parameters you want to override in the original request URL.

```
Original Request:  /r?to=short-abc&utm_campaign=flash-sale-2025
Destination URL:   https://shop.com/product?utm_source=facebook&utm_campaign=sale2024

✅ Tracking Result:
{
  utm_source: 'facebook',         // ← From destination (not overridden)
  utm_campaign: 'flash-sale-2025' // ← OVERRIDDEN by original
}
```

**Why this works:** Original's `utm_campaign` overwrites destination's `utm_campaign`. Other params stay from destination.

**Example Scenario:**
- You have a product link that always tracks `utm_source=facebook`
- For a special 24-hour flash sale, you want to track it as `utm_campaign=flash-sale`
- You override just the campaign param, keeping the source

---

### Use Case 4: Override Completely

**When to use:** Destination has tracking but you want completely different tracking for your redirect analytics.

**How:** Pass all tracking parameters in the original request URL.

```
Original Request:  /r?to=short-abc&utm_source=email&utm_campaign=newsletter&utm_medium=email
Destination URL:   https://shop.com/product?utm_source=facebook&utm_campaign=sale2024

✅ Tracking Result:
{
  utm_source: 'email',       // ← OVERRIDDEN by original
  utm_campaign: 'newsletter', // ← OVERRIDDEN by original
  utm_medium: 'email'        // ← NEW from original
}
```

**Why this works:** Original params overwrite all conflicting destination params.

**Example Scenario:**
- Destination is a partner website with their own tracking
- You're sending this link in your newsletter
- You want to track it as an email campaign, not their Facebook campaign

---

## Supported Tracking Parameters

### UTM Parameters (Google Analytics Standard)

| Parameter | Description | Example |
|-----------|-------------|---------|
| `utm_source` | Traffic source | `facebook`, `google`, `email` |
| `utm_medium` | Marketing medium | `cpc`, `social`, `email`, `referral` |
| `utm_campaign` | Campaign name | `spring-sale-2024`, `newsletter-jan` |
| `utm_content` | Ad/content variant | `banner-blue`, `text-link-1` |
| `utm_term` | Paid keyword | `running-shoes`, `laptop-deals` |

### Platform-Specific Parameters

| Parameter | Platform | Description |
|-----------|----------|-------------|
| `xptdk` | Shopee | Shopee tracking parameter |
| `ref` | Facebook | Facebook referral parameter |

---

## Best Practices

### ✅ DO

**Reuse destination tracking when possible**
```
// Destination already has tracking - just use it
/r?to=short-link
```

**Override only what you need**
```
// Keep source, change campaign
/r?to=short-link&utm_campaign=special-promo
```

**Use debug mode to verify tracking**
```
// Add debug=1 to see what will be tracked
/r?to=short-link&utm_campaign=test&debug=1
```

### ❌ DON'T

**Don't duplicate identical params**
```
// ❌ Unnecessary - destination already has these
Destination: ?utm_source=facebook&utm_campaign=sale
Original: /r?to=abc&utm_source=facebook&utm_campaign=sale

// ✅ Better - just reuse destination
Original: /r?to=abc
```

**Don't pass partial params if you want complete override**
```
// ❌ If you want email tracking, pass all params
Original: /r?to=abc&utm_source=email
Destination: ?utm_campaign=sale2024

Result: { utm_source: 'email', utm_campaign: 'sale2024' } // ← Mixed tracking!

// ✅ Better - pass complete email tracking
Original: /r?to=abc&utm_source=email&utm_medium=email&utm_campaign=newsletter
```

---

## Testing Your Tracking

### Debug Mode

Add `debug=1` to see tracking parameters before redirect:

```
/r?to=short-link&utm_campaign=test&debug=1
```

**Debug Response:**
```json
{
  "mode": "debug",
  "destination": "https://example.com",
  "trackingParams": {
    "utm_campaign": "test"
  },
  "merged": true,
  "sources": {
    "destination": ["utm_source", "utm_medium"],
    "original": ["utm_campaign"]
  }
}
```

### Checking Analytics Events

Check your analytics provider (GA4, Mixpanel, etc.) for `redirect_click` events with your tracking parameters.

---

## Examples from Real Scenarios

### Scenario A: E-commerce Newsletter

**Setup:**
- Product link with destination tracking: `utm_source=google&utm_campaign=shopping`
- Sending in monthly newsletter

**Original Request:**
```
/r?to=product-123&utm_source=email&utm_medium=newsletter&utm_campaign=feb-newsletter
```

**Result:** Tracks as email/newsletter campaign (overrides destination completely)

---

### Scenario B: Social Media Post

**Setup:**
- Same product link as above
- Posting on Instagram story

**Original Request:**
```
/r?to=product-123&utm_source=instagram&utm_medium=story&utm_content=story-1
```

**Result:** Tracks as Instagram story (overrides source/medium, adds content)

---

### Scenario C: Partner Collaboration

**Setup:**
- Partner's website has their tracking: `utm_source=partner-site`
- You want to track the partnership differently

**Original Request:**
```
/r?to=partner-deal&utm_source=partner-collaboration&utm_campaign=q1-2025
```

**Result:** Tracks with your partnership campaign params

---

## User Control Summary

You control tracking behavior by choosing what parameters to pass:

| What You Pass in Original | What Happens |
|---------------------------|--------------|
| **Nothing** | System uses destination tracking completely |
| **Additional params** | System merges (destination + original) |
| **Conflicting params** | Your original params WIN (override destination) |
| **All params** | System uses your tracking completely |

**Remember:** Original always wins conflicts. You're in control.

---

## Technical Details

### Extraction Implementation

```typescript
// Step 1: Extract destination params
const destinationParams = extractTrackingParams(destinationUrl)

// Step 2: Extract original params
const originalParams = extractTrackingParams(originalUrl)

// Step 3: Merge (original wins)
const trackingParams = {
  ...destinationParams,  // base layer
  ...originalParams      // override layer (wins on conflicts)
}
```

### URL Encoding

All parameter values are automatically URL-decoded:

```
/r?to=abc&utm_campaign=flash%20sale%202025

Extracted: { utm_campaign: 'flash sale 2025' }
```

---

## FAQ

**Q: Why does original override destination instead of the other way around?**

A: Because if you explicitly pass a parameter in the original request, you're signaling **intent to override**. This gives you control. If you don't want to override, simply don't pass the parameter.

**Q: What if I want destination to always win?**

A: Don't pass any tracking parameters in the original request URL. The system will use destination tracking.

**Q: Can I turn off tracking completely?**

A: Yes, configure `ANALYTICS_PROVIDERS=""` in environment variables. The tracking service will disable itself gracefully.

**Q: Do destination websites see my tracking params?**

A: Yes, when users are redirected, they go to the full destination URL including its params. Your original request params are NOT appended to the destination URL - they're only used for your redirect system's analytics.

**Q: What happens if both URLs have no tracking params?**

A: The system tracks the redirect event without UTM parameters. You'll still see the redirect event with metadata (timestamp, user agent, IP, etc.) in your analytics.

---

## Support

If you have questions or need help with tracking configuration:

1. Use debug mode to inspect tracking behavior
2. Check analytics provider configuration
3. Review this guide's examples for similar scenarios
4. Check structured logs for tracking extraction details

For implementation details, see:
- `docs/tech-spec-epic-7.md` - Analytics abstraction architecture
- `docs/stories/story-7.8.md` - Tracking service implementation
