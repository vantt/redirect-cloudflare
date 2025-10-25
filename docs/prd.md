# Jamstack URL Shortener Service Product Requirements Document (PRD)

## 1. Goals and Background Context

### 1.1. Goals

- **Improve Performance & SEO:** Replace the legacy client-side redirect with a server-side solution to eliminate delays (sub-5ms target) and improve SEO with proper 301/302 redirects.
- **Robust Tracking:** Develop a robust, independent tracking system that captures analytics *before* redirection.
- **Centralized Control:** Maintain a single point of control for all system redirects to ensure tracking consistency and ease of management.
- **Scalability & Cost-Effectiveness:** Ensure the solution is scalable, secure, and cost-effective, leveraging a free-tier hosting solution like Cloudflare.
- **Enhance User Experience:** Eliminate redirection delays for a seamless user journey and provide an efficient admin interface for managing links.

### 1.2. Background Context

The current URL redirect solution uses a client-side JavaScript implementation within a single HTML file. While simple, it suffers from SEO limitations, a poor user experience due to a ~200ms delay, and a dependency on client-side JavaScript. This enhancement will evolve the service into a professional-grade, high-performance solution.

Analysis has shown that a Jamstack architecture using Cloudflare Workers is the optimal path forward. This approach allows for edge-level, server-side redirects, which are significantly faster and more reliable. It also provides the perfect environment for a self-contained, pre-redirection tracking system and a simple API for a management interface, addressing all core requirements.

### 1.3. Change Log

| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| 2025-10-17 | 0.1 | Initial brownfield analysis draft | Gemini |
| 2025-10-19 | 0.2 | Initial greenfield PRD draft | John (PM) |
| 2025-10-24 | 1.0 | Consolidated and unified PRD | Gemini |

---

## 2. Requirements

### 2.1. Functional Requirements

1.  **FR1: Server-Side Redirects:** The system must perform server-side 301 (permanent) or 302 (temporary) redirects from a short URL to a destination URL.
2.  **FR2: Pre-Redirect Tracking:** The system must extract, process, and send tracking parameters (e.g., UTM, `xptdk`) to an analytics service *before* executing the redirect.
3.  **FR3: Analytics Integration:** The system must integrate with Google Analytics 4 (GA4) for event tracking. The data payload must be consistent with the legacy system.
4.  **FR4: Link Management:** The system must provide a mechanism for managing the mapping between short URLs and destination URLs (e.g., via a CRUD API backed by Cloudflare KV).
5.  **FR5: Debugging Mode:** The system must support a query parameter (`isNoRedirect=1`) to prevent redirection, allowing for tracking verification.
6.  **FR6: Graceful Handling:** The system must handle malformed, invalid, or missing URLs gracefully, logging errors and redirecting to a pre-configured default page without crashing.
7.  **FR7: URL Encoding:** The system must correctly handle URL-encoded characters within the destination URL.

### 2.2. Non-Functional Requirements

1.  **NFR1: Performance:** Redirects should be processed at the network edge with minimal latency, aiming for a sub-5ms processing time.
2.  **NFR2: Scalability & Cost:** The solution's operational cost must stay within the limits of Cloudflare's free tier (100,000 requests/day).
3.  **NFR3: Availability:** The system must be highly available, leveraging the underlying platform's uptime guarantees (e.g., Cloudflare's 100% SLA).
4.  **NFR4: Security:** All incoming URL parameters must be sanitized and validated to prevent security vulnerabilities like open redirects.
5.  **NFR5: Reliability:** The tracking event must be successfully dispatched *before* the redirect is sent to the client to ensure no data is lost.

---

## 3. User Interface Design Goals (Admin Interface)

### 3.1. Overall UX Vision

The primary end-user experience is invisible and instantaneous. For administrators, the experience should be purely functional and efficient, prioritizing speed and ease of use for CRUD operations.

### 3.2. Key Interaction Paradigms

*   **End-User:** The only interaction is clicking a URL. Success is measured by the speed and reliability of the redirect.
*   **Administrator:** A simple web-based interface for managing redirects. The core paradigm is a table/list view of existing redirects with clear actions for adding, editing, and deleting entries.

### 3.3. Core Screens and Views

*   **Admin Dashboard:** A list of all configured URL redirects, showing the short URL, destination URL, and basic stats.
*   **Create/Edit Redirect Form:** A simple form with fields for the short URL path and the destination URL.

### 3.4. Accessibility & Branding

*   **Accessibility:** The administrative interface must adhere to WCAG 2.1 AA standards.
*   **Branding:** The admin interface should use a minimal, clean, and functional design. No branding is required for the public-facing redirect itself.
*   **Responsiveness:** The administrative interface must be responsive and fully functional on modern web browsers on both desktop and mobile devices.

---

## 4. Technical Design and Assumptions

*   **Service Architecture:** The solution will be a serverless function deployed on the **Cloudflare Workers** platform.
*   **Language:** The Cloudflare Worker will be developed using **TypeScript**.
*   **Data Storage:** **Cloudflare KV** will be used as the database for storing and retrieving URL mappings.
*   **Admin Interface:** The admin interface will be a simple, static **single-page application (SPA)** hosted on Cloudflare Pages, which interacts directly with the Worker API for data management.
*   **Repository Structure:** A single, dedicated **polyrepo** will be used for this service.
*   **Testing:**
    *   **Unit Tests:** Will be written to cover core logic (URL parsing, parameter extraction, etc.).
    *   **Integration Tests:** Will validate the end-to-end flow, including request handling, KV lookups, and the final redirect response.
*   **Deployment:** Deployment will be managed through the **Wrangler CLI**, integrated into an automated CI/CD pipeline (e.g., GitHub Actions).
*   **Code Standards:** The code will follow modern JavaScript (ES6+) standards, be formatted with Prettier, and include JSDoc comments.
*   **Configuration:** All configuration will be managed in the `wrangler.toml` file and environment variables for secrets.

---

## 5. URL Strategy and Migration

### 5.1. Legacy URL Structure (Client-Side)

The legacy system uses a client-side JavaScript redirect pattern with the destination URL stored in the fragment. This allows a single HTML to perform tracking and then redirect, but prevents the server from seeing the destination.

Base form:

```
https://redirect.example.com#[destination-url]
```

Components:
- Base domain: `https://redirect.example.com`
- Hash separator: `#`
- Destination URL: full URL of the target

### 5.2. URL Length Considerations

- Keep total URL length under ~2048 characters (browser limits)
- Prefer destination URLs under ~1000 characters when possible
- Remove unnecessary parameters; consider URL shorteners for very long URLs

### 5.3. Optional Parameters

No-redirect flag, applied to the parent (outside the fragment):

```
https://redirect.example.com#[destination-url]?isNoRedirect=[0|1]
```

- `isNoRedirect=1`: prevent redirect (debug)
- `isNoRedirect=0` or omitted: allow redirect (default)
- Note: `isNoRedirect` belongs to the parent URL, not the `destination-url`

### 5.4. Tracking Parameters (Inside Destination)

The system captures tracking parameters embedded within the `destination-url`:

- UTM parameters: `utm_campaign`, `utm_medium`, `utm_source`, `utm_content` (optional), `utm_term` (optional)
- Platform-specific parameters (examples):
  - Shopee: `xptdk`
  - Facebook: `ref`

Guidelines:
- Use consistent parameter naming and campaign conventions
- Ensure required parameters are present and valid; handle missing/invalid gracefully

### 5.5. URL Encoding

- Properly URL-encode special and non-ASCII characters (UTF-8)
- Example: `nước` -> `n%C6%B0%E1%BB%9Bc`

### 5.6. Implementation Notes (Legacy)

1. Perform GTM/GA4 tracking before redirect
2. Only redirect when `isNoRedirect` is not `1` and destination is present
3. Accept both encoded and unencoded destination URLs; normalize safely
4. Extract tracking parameters from the destination URL
5. Handle malformed URLs and log failures for monitoring

### 5.7. Error Handling

- Invalid URLs: fail gracefully, show/return meaningful error, log
- Missing parameters: use defaults where appropriate, log
- Encoding issues: handle decode errors and provide safe fallback behavior

### 5.8. Critical Limitations of Fragment-Only (`/#...`)

Using `https://redirect.example.com#[destination-url]` hides the destination in the fragment. Browsers never send the fragment to the server, causing:

- Server cannot read destination; cannot issue true 301/302 at the edge
- No pre-redirect server tracking (UTM/xptdk extraction impossible server-side)
- SEO and link previews break for many crawlers/bots (no JS execution)
- Edge logging/monitoring cannot attribute to individual targets
- Security/governance limits (no allowlists/open-redirect protection)
- CDN/cache segmentation impossible by destination at `/`
- Referrer integrity issues with client-side redirects

Conclusion: Fragment-only structure cannot meet PRD goals for server-side redirects, pre-redirect tracking, and SEO.

### 5.9. Hybrid Technical Solution (Client + Server)

Goal: Preserve existing `/#...` links for backward compatibility while upgrading real users to server-side redirects and enabling server-side tracking. Provide a canonical server-side endpoint for all new links.

1) Lightweight client bootstrap at `/` (backward compatible)
- Server returns a tiny HTML (noindex) with a small JS bootstrap
- On load, JS reads `window.location.hash`. If a destination is present:
  - Parse/normalize the destination URL; also read outer query params (e.g., `?isNoRedirect=1`)
  - If `isNoRedirect=1`: render a simple debug view (no redirect) with a "Force Server Redirect" button/link
  - Else: upgrade to server-side by `location.replace('/r?to=' + encodeURIComponent(destinationURL) + extraFlags)`

2) Canonical server endpoint at `/r`
- Accept `to` containing the full destination (URL-encoded or base64url)
- Server flow:
  - Validate `to` (require http/https; optional domain allowlist)
  - Perform pre-redirect tracking (extract UTM/xptdk, send GA/GTM, log edge events)
  - If `n=1` (no redirect): return debug JSON/HTML showing payload and destination
  - Else: return 301/302 to `to` with appropriate headers (e.g., `Cache-Control`, `noindex`)

3) Optional convenience: `/?to=...`
- Allow `https://redirect.example.com/?to=...` for compatibility without `#`
- `/` can forward to `/r?to=...` or server can handle it directly

4) SEO and crawler behavior
- `/` bootstrap should be `noindex, nofollow` and minimal
- `/r` returns immediate 301/302 so bots/crawlers follow without JS
- New links should use `/r?to=...`; legacy `/#...` works via client upgrade

5) Security and governance
- Strictly validate/sanitize `to`; consider a destination allowlist
- Prevent open redirects; reject malformed schemes/payloads
- Log before redirect; apply rate limiting/abuse protections as needed

6) Migration plan
- Now: Deploy `/` bootstrap + `/r` endpoint; legacy `/#...` auto-upgrades to `/r?...` for users
- Gradual: Update generators/templates to emit `/r?to=...` for all new campaigns
- Tooling: Debug view shows the equivalent `/r?to=...` for easy copy/paste

Example flows:
- Legacy: `https://redirect.example.com#https://example.com?p=1&utm_source=fb`
  - User opens -> `/` loads JS -> parses fragment -> `replace('/r?to=' + encodeURIComponent('https://example.com?p=1&utm_source=fb'))` -> server logs + 302 -> destination
- New: `https://redirect.example.com/r?to=https%3A%2F%2Fexample.com%3Fp%3D1`
  - Server handles directly -> logs + 301/302 -> destination

Quick implementation notes:
- `/`: ~1–2KB HTML + JS to parse hash, read `search`, optional beacon, then `location.replace` to `/r`
- `/r`: Cloudflare Worker (TypeScript) validates `to`, extracts tracking, sends GA/GTM, returns 301/302
- `isNoRedirect`: place outside fragment (e.g., `?isNoRedirect=1`) or map to `n=1` when upgrading to `/r`

### 5.10. Best Practices

1. Include tracking parameters in the destination URL
2. Use URL encoding for special characters
3. Keep URLs short while preserving necessary tracking
4. Test various parameter combinations before deployment
5. Monitor performance and analytics
6. Review and optimize URL structures regularly
7. Document custom parameters and special cases
8. Implement error handling and logging
9. Follow best practices for URL length and parameter optimization

### 5.11. Security Considerations

1. Validate URLs before processing
2. Properly escape/encode special characters
3. Sanitize all URL parameters
4. Prevent open-redirect vulnerabilities
5. Validate destinations against allowed domains (where applicable)

---

## 6. Risk Assessment and Mitigation

| Risk | Mitigation Strategy |
| :--- | :--- |
| **Technical:** GTM/GA4 tracking event is not fired correctly or is lost. | Implement thorough testing of the tracking mechanism in a staging environment. Ensure the `fetch` request for tracking is awaited before the redirect response is returned. |
| **Integration:** Future changes in GTM/GA4 data layer requirements break the integration. | Use environment variables in the worker for GTM/GA4 identifiers to allow for easy updates. Keep the tracking payload generation logic modular and easy to modify. |
| **Deployment:** An incorrect deployment brings down the entire redirect service. | Use the Wrangler CLI's support for environments (e.g., `dev`, `staging`, `production`) to test deployments before they go live. Implement a CI/CD pipeline with automated testing gates. |
| **Security:** Open redirect vulnerabilities from unsanitized inputs. | Implement a strict validation and sanitization layer for all incoming data, particularly the destination URL. Maintain an allow-list of trusted domains if possible. |

---

## 7. Next Steps

### 7.1. UX Expert Prompt

> Design a simple, functional, and responsive admin interface for managing URL redirects, adhering to WCAG AA standards. The interface should include a dashboard to list all redirects and a form for creating/editing them. The goal is maximum efficiency for an administrator. The full PRD is attached for context.

### 7.2. Architect Prompt

> Based on the attached PRD, create a detailed technical architecture for the serverless URL Redirect Service. The architecture must use Cloudflare Workers (TypeScript) for the core logic and Cloudflare KV for data storage. It should define the data models, the Worker's internal structure, the API for the admin interface, and a strategy for CI/CD and testing (Unit + Integration).