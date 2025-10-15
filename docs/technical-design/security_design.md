## Security Design

This section details security considerations and mitigation strategies for the URL redirector service, aligning with OWASP best practices.

**1. Input Validation and Sanitization**

*   **URL Parsing:**
    *   Strictly validate the presence of the hash (`#`) separator in the incoming URL. Reject requests without it (400 Bad Request).
    *   Limit the maximum length of the raw URL fragment and the decoded `destination_url` (e.g., 2048 characters) to prevent excessively long inputs.
*   **Destination URL Validation:**
    *   After decoding the `destination_url` (extracted from the hash), use the standard `URL` constructor (`new URL(destination_url)`) to parse it. This helps validate the basic structure.
    *   Explicitly check the `protocol` of the parsed URL. **Only allow `http:` and `https:` protocols.** Reject URLs with other schemes (e.g., `javascript:`, `ftp:`, `file:`) immediately with a 400 Bad Request to prevent XSS and other scheme-based attacks.
    *   Handle potential errors during `decodeURIComponent` or `new URL()` parsing gracefully, returning a 400 Bad Request.
*   **Parameter Validation:**
    *   Validate the `isNoRedirect` parameter if present. Expect '0' or '1'; treat other values or absence as the default (redirect allowed).
*   **Analytics Parameter Sanitization:**
    *   While the redirector doesn't render parameters, data sent to GTM/GA4 (`Tracking System`) should be treated as potentially untrusted. Ensure the analytics integration code handles parameters correctly according to the destination platform's requirements (e.g., proper encoding for GTM data layer or GA4 Measurement Protocol) to mitigate risks if this data is ever processed or displayed insecurely downstream (addresses OWASP A03: Injection risk in downstream systems).

**2. Preventing Open Redirect Vulnerabilities (OWASP A01:2021 - Broken Access Control context)**

*   The core function is redirection, making Open Redirect a primary concern.
*   **Mitigation:**
    *   **Protocol Check:** The strict validation ensuring only `http:` and `https:` protocols are allowed in the `destination_url` is the main defense.
    *   **(Optional Enhancement):** For higher security requirements, implement an allow-list of permitted destination domains. This list could be managed via Cloudflare KV or environment variables. Check the hostname of the parsed `destination_url` against this list before allowing redirection.

**3. Server-Side Request Forgery (SSRF) Prevention (OWASP A10:2021)**

*   **Context:** The `Tracking System` makes outbound requests to analytics platforms (GTM/GA4).
*   **Mitigation:**
    *   Ensure the target URLs for GTM/GA4 endpoints are **static configurations** loaded from secure environment variables (`env.GTM_SERVER_SIDE_URL`, `env.GA4_MEASUREMENT_ID`, `env.GA4_API_SECRET`).
    *   **Do not** construct these analytics endpoint URLs dynamically using any part of the user-provided `destination_url` or its parameters.

**4. Rate Limiting and DDoS Protection**

*   **Cloudflare Rate Limiting:** Configure Cloudflare's Rate Limiting service based on IP address (and potentially other factors like JA3 fingerprint) to prevent brute-force abuse or denial-of-service from single sources. Set sensible thresholds.
*   **Cloudflare DDoS Protection:** Rely on Cloudflare's robust, always-on DDoS mitigation at the edge.
*   **Cloudflare WAF:** Enable appropriate WAF rules in the Cloudflare dashboard to filter known malicious patterns and bots.

**5. Secure Configuration and Secrets Management**

*   Store all sensitive configuration (GTM endpoint URLs, GA4 Measurement ID, GA4 API Secret) as **secrets** within the Cloudflare Worker environment settings.
*   Do not hardcode secrets or sensitive configuration directly in the worker script.

**6. Transport Security**

*   Enforce HTTPS for all incoming connections via Cloudflare settings (e.g., "Always Use HTTPS", HSTS).

**7. Logging and Monitoring**

*   Log security-relevant events:
    *   Validation failures (invalid hash, invalid protocol, decoding errors, length violations).
    *   Denied redirects (e.g., due to allow-list check failure, if implemented).
    *   Errors during analytics event dispatching.
    *   Requests blocked by Rate Limiting or WAF (handled by Cloudflare logs).
*   Monitor logs for suspicious patterns or attack attempts. 