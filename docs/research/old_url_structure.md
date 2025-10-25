# URL Structure Specification

## Overview

This document specifies the URL structure used for the Old URL redirection system (using only clien-side javascript). The system acts as a centralized tracking hub that handles all tracking (GTM/GA4) before performing redirections to destination URLs.

## Base URL Structure

```markdown
https://redirect.example.com#[destination-url]
```

### Components

1. **Base Domain**: `https://redirect.example.com`
2. **Hash Separator**: `#`
3. **Destination URL**: The complete URL to redirect to

## URL Length Considerations

1. **Maximum Length**:
   - Total URL length should not exceed 2048 characters (browser limitation)
   - Destination URL should ideally be under 1000 characters for optimal performance
   - Consider URL shortening for very long destination URLs

2. **Parameter Optimization**:
   - Remove unnecessary parameters to keep URLs shorter
   - Consider using URL shorteners for complex destination URLs
   - Prioritize essential tracking parameters

## Optional Parameters

### No-Redirect Parameter

The system supports an optional parameter to control redirection behavior:

```
https://redirect.example.com#[destination-url]?isNoRedirect=[0|1]
```

- `isNoRedirect=1`: Prevents redirection
- `isNoRedirect=0`: Allows redirection (default behavior)
- If not specified: Redirection is enabled by default

## Tracking Parameters

The system automatically captures and processes tracking parameters from the destination URL. This means:

1. All tracking parameters (UTM and platform-specific) are part of (*within*) the `destination-url`.
2. The redirect system automatically extracts and uses these tracking parameters for its own tracking.
3. Optional query parameter `isNoRedirect` is part of the `parent url` not `destination-url`.
4. This approach simplifies URL structure and tracking operations

- 
### UTM Parameters

Standard UTM parameters that the system will capture from the destination URL:

- `utm_campaign`: Campaign identifier
- `utm_medium`: Marketing medium
- `utm_source`: Traffic source
- `utm_content`: Content identifier (optional)
- `utm_term`: Search term (optional)

### Platform-Specific Parameters

The system will also capture platform-specific parameters from the destination URL:

- Shopee: `xptdk` (Product tracking ID)
- Facebook: `ref` (Reference ID)
- Other platform-specific parameters as needed

## Analytics Considerations

1. **Parameter Standardization**:
   - Use consistent parameter naming across all campaigns
   - Follow UTM parameter naming conventions strictly
   - Document any custom parameters used

2. **Data Quality**:
   - Ensure all required tracking parameters are present
   - Validate parameter values before processing
   - Handle missing or invalid parameters gracefully

3. **Campaign Tracking**:
   - Maintain consistent campaign naming conventions
   - Include campaign identifiers in all URLs
   - Document campaign-specific parameter requirements

## Examples

### Basic Redirect
```
https://redirect.example.com#https://example.com
```

### With UTM Parameters
```
https://redirect.example.com#https://example.com?utm_campaign=summer_sale&utm_medium=email&utm_source=newsletter
```

### With No-Redirect Parameter
```
https://redirect.example.com#https://example.com?isNoRedirect=1
```

### Real-World Examples

1. **Messenger Link**:
```
https://redirect.example.com#https://m.me/example?ref=pi.VCSC19002L001&utm_campaign=-&utm_medium=&utm_source=
```

2. **Shopee Product**:
```
https://redirect.example.com#https://shopee.vn/product-name?xptdk=tracking-id&utm_campaign=sale&utm_medium=cpc&utm_source=facebook
```

3. **Website Page**:
```
https://redirect.example.com#https://example.com/product-page?utm_campaign=campaign&utm_medium=medium&utm_source=source&utm_content=content
```

## URL Encoding

- All special characters in the destination URL must be properly URL-encoded
- Vietnamese characters and other non-ASCII characters should be encoded using UTF-8
- Example: `nước` → `n%C6%B0%E1%BB%9Bc`

## Implementation Notes

1. The system performs tracking (GTM/GA4) before redirection
2. Redirection only happens if:
   - `isNoRedirect` is not set to 1
   - The destination URL is not empty
3. The system should handle both encoded and unencoded URLs appropriately
4. The system automatically extracts and processes tracking parameters from the destination URL
5. Implement proper error handling for malformed URLs
6. Log failed redirects for monitoring and debugging

## Error Handling

1. **Invalid URLs**:
   - Handle malformed destination URLs gracefully
   - Provide appropriate error messages
   - Log invalid URL attempts for monitoring

2. **Missing Parameters**:
   - Handle missing required parameters
   - Use default values when appropriate
   - Log missing parameter cases

3. **Encoding Issues**:
   - Handle URL encoding/decoding errors
   - Provide fallback behavior for invalid encodings
   - Log encoding-related issues

6. Implement rate limiting to prevent abuse

## Critical Issue: Hash Fragment vs Server-Side Redirect

Using the current structure `https://redirect.example.com#[destination-url]` places the destination entirely in the URL fragment (everything after `#`). Browsers do not send the fragment to the server, which creates blocking issues for a server-side/edge redirect design:

- Server cannot read destination: The Worker/Server never sees `destination-url` nor any flags placed inside the fragment, so it cannot perform a proper 301/302 at the server/edge.
- No pre-redirect server tracking: UTM/xptdk parameters cannot be extracted at the server before redirect, weakening data consistency and observability.
- SEO and previews break: Many crawlers/preview bots (Facebook/Twitter/WhatsApp/iMessage, several SEO bots) do not execute JavaScript and do not follow fragments, so they will not see a redirect or correct preview. You lose canonical 301/302 signals.
- Edge logging/monitoring gaps: Without the destination on the server, edge logs/metrics cannot be tied to individual targets.
- Security/governance limits: Domain allowlisting and open-redirect protection cannot be enforced for a destination hidden in the fragment.
- Cache/CDN complexity: All requests to `/` look identical (fragment is not part of the request), making cache segmentation by destination impractical.
- Referrer integrity: Client-side redirects can distort or drop `Referer`; server 301/302 preserves referrer more reliably.

Conclusion: With the current `#` structure alone, the system cannot meet PRD goals for server-side redirects, pre-redirect tracking, and SEO.

## Hybrid Technical Solution (Client + Server)

Goal: Preserve existing `/#...` links for backward compatibility while upgrading real users to server-side redirects and enabling server-side tracking. Provide a canonical server-side endpoint for all new links.

1) Lightweight client bootstrap at `/` (backward compatible)
- Server returns a tiny HTML (noindex) with a small JS bootstrap.
- On load, the JS reads `window.location.hash`. If a destination is present:
  - Parse and normalize the destination URL (decode if necessary). Also read any outer query params (e.g., `?isNoRedirect=1`) that are outside the fragment.
  - If `isNoRedirect=1`: render a simple debug view (no redirect) with parsed info and a “Force Server Redirect” link/button.
  - Else: upgrade to a server-side redirect by replacing the URL with the canonical endpoint: `location.replace('/r?to=' + encodeURIComponent(destinationURL) + extraFlags)`. Optionally send `navigator.sendBeacon(...)` before replacing if client-side analytics is still desired, but the authoritative tracking happens on the server.
- Note: Environments/bots that do not run JS will not be redirected for legacy `#` links; this is mitigated by (2) and by migrating new links to the canonical form.

2) Canonical server endpoint at `/r`
- Accept a `to` query parameter containing the full destination. Prefer base64url or URL-encoded input for safety.
- Server/Worker flow:
  - Validate `to`: require http/https; optionally enforce an allowlist of destination domains.
  - Perform pre-redirect tracking (extract UTM/xptdk, send GA/GTM, log edge events). Do not block 301/302 excessively.
  - If `n=1` (no redirect): return a debug page (JSON/HTML) showing tracking payload and destination for QA.
  - Else: return a 301/302 to `to` with appropriate headers (e.g., `Cache-Control`, `noindex`).

3) Optional convenience: `/?to=...`
- In addition to fragments, allow `https://redirect.example.com/?to=...` for immediate compatibility without `#`.
- The `/` page can immediately forward to `/r?to=...` or the server can handle it directly.

4) SEO and crawler behavior
- The `/` bootstrap page should be `noindex, nofollow` and minimal; its goal is to upgrade users to `/r`.
- The `/r` endpoint returns immediate 301/302 so bots/crawlers follow redirects without JS.
- New links should use `/r?to=...` (no `#`) to guarantee correct SEO/crawler behavior. Legacy `/#...` links still work for real users via JS upgrade.

5) Security and governance
- Strictly validate and sanitize `to` on the server; consider an allowlist of domains.
- Prevent open redirects; reject malformed schemes and dangerous payloads.
- Log before redirect; apply rate limiting/abuse protection as needed.

6) Migration plan
- Now: Deploy `/` bootstrap + `/r` endpoint. All legacy `/#...` links are upgraded client-side to `/r?...` when opened by users.
- Gradual: Update link generators/templates to emit `/r?to=...` for all new campaigns (no `#`).
- Support tooling: The debug view can show the equivalent `/r?to=...` link for easy copy/paste.

### Example flows
- Legacy link: `https://redirect.example.com#https://example.com?p=1&utm_source=fb`
  - User opens → `/` loads JS → parses fragment → `replace('/r?to=' + encodeURIComponent('https://example.com?p=1&utm_source=fb'))` → server logs + 302 → destination.
- New link (recommended): `https://redirect.example.com/r?to=https%3A%2F%2Fexample.com%3Fp%3D1`
  - Server handles directly → logs + 301/302 → destination.

### Quick implementation notes
- `/`: ~1–2KB HTML + JS to parse hash, read `search`, optional beacon, then `location.replace` to `/r`.
- `/r`: Cloudflare Worker/Functions (TypeScript) validates `to`, extracts tracking, sends GA/GTM, returns 301/302.
- `isNoRedirect`: place outside fragment (e.g., `?isNoRedirect=1`) or map to `n=1` when upgrading to `/r`.

## Best Practices

1. Include tracking parameters in the destination URL - the system will automatically capture them
2. Use URL encoding for special characters
3. Keep URLs as short as possible while maintaining necessary tracking information
4. Test URLs with various parameter combinations before deployment
5. Monitor URL performance and analytics data
6. Regularly review and optimize URL structure
7. Document any custom parameters or special cases
8. Implement proper error handling and logging
9. Follow best practices for URL length and parameter optimization
10. Implement proper error handling and logging for URL structure issues

## Security Considerations

1. URLs should be validated before processing
2. Special characters should be properly escaped
3. Sanitize all URL parameters
4. The system should prevent potential security vulnerabilities through URL manipulation
5. Validate destination URLs against allowed domains