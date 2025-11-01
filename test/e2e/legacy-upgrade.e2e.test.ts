/// <reference types="vitest" />

/**
 * Legacy URL Upgrade E2E Tests
 *
 * ============================================================================
 * IMPORTANT: SERVER-SIDE TESTING LIMITATIONS
 * ============================================================================
 *
 * Những gì test này KHÔNG THỂ verify (cần browser environment):
 * ❌ JavaScript execution - Code không được chạy thực sự
 * ❌ Hash fragment extraction - Server không nhận được phần #url
 * ❌ window.location operations - Không có window object
 * ❌ Client-side redirect flow - Không có browser navigation
 * ❌ Timing/performance của JavaScript - setTimeout không chạy
 *
 * Những gì test này CÓ THỂ verify (server-side):
 * ✅ HTML structure - JavaScript code tồn tại trong HTML
 * ✅ Redirect endpoint functionality - /r?to=... hoạt động đúng
 * ✅ URL encoding/decoding - encodeURIComponent được sử dụng đúng
 * ✅ Domain allowlist enforcement - Chỉ chấp nhận domain cho phép
 * ✅ Error handling - Trả về 400/403 khi cần thiết
 * ✅ HTTP headers - Cache-Control, Content-Type, Location
 *
 * Độ tin cậy:
 * - Cao (95%+): API contract testing, validation logic, error handling
 * - Trung bình (70%): HTML structure verification (code review level)
 * - Thấp (30%): Client-side behavior (chỉ là assumption, không test thực)
 *
 * Test flow simulation:
 * 1. Get bootstrap HTML (real server response)
 * 2. Inspect HTML string for JavaScript code (string matching, NOT execution)
 * 3. Manually call /r endpoint (simulating JavaScript result)
 * 4. Verify redirect response (real server behavior)
 *
 * Để test THỰC SỰ client-side redirect flow, cần:
 * - Playwright: test/e2e-browser/*.playwright.test.ts
 * - Cypress: cypress/e2e/*.cy.ts
 * - JSDOM: Limited, không thể test navigation thực sự
 *
 * @see test/integration/routes/bootstrap-legacy.test.ts - 10 tests skipped vì cần browser
 * @see docs/story-7.9-completion-report.md - Chi tiết về test rewrite strategy
 */

import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import bootstrapApp from '../../src/routes/bootstrap'
import redirectApp from '../../src/routes/redirect'
import { defaultTestEnv } from '../fixtures/env'

// Create test app that mimics main app structure
const testApp = new Hono()

// Mount routes like in main index.ts
testApp.route('/', bootstrapApp)
testApp.route('/r', redirectApp)

describe('E2E Legacy URL Upgrade Flow', () => {
  it('should serve bootstrap HTML and test redirect endpoint functionality', async () => {
    /**
     * TEST SCOPE:
     * ✅ Server returns correct HTML structure
     * ✅ Redirect endpoint works with encoded URLs
     * ❌ JavaScript execution (not tested - no browser)
     * ❌ Hash fragment extraction (impossible in server-side test)
     *
     * REAL FLOW IN BROWSER:
     * User visits: http://site.com/#https://test.com
     * → Browser executes JavaScript
     * → JavaScript extracts "https://test.com" from hash
     * → JavaScript navigates to /r?to=https%3A%2F%2Ftest.com
     * → Server redirects to https://test.com
     *
     * TEST FLOW (Simulation):
     * Test calls: testApp.request('/')
     * → Server returns HTML with <script> (as string)
     * → Test inspects HTML for correct JavaScript code (string matching)
     * → Test manually calls /r?to=... (skipping JavaScript execution)
     * → Test verifies redirect works
     */

    // Step 1: Get bootstrap HTML from server
    // NOTE: No hash fragment in request - server never receives #url part
    const bootstrapResponse = await testApp.request('/', {}, defaultTestEnv)

    expect(bootstrapResponse.status).toBe(200)
    expect(bootstrapResponse.headers.get('content-type')).toContain('text/html')

    const bootstrapHtml = await bootstrapResponse.text()
    // bootstrapHtml is just a STRING, không phải running code!

    // Step 2: Verify HTML contains expected JavaScript code for URL upgrade
    // CONFIDENCE: Medium (70%) - Chỉ verify code structure, không verify execution
    expect(bootstrapHtml).toContain('var redirectUrl = path.slice(hashInd + 1)')
    expect(bootstrapHtml).toContain('encodeURIComponent(redirectUrl)')
    expect(bootstrapHtml).toContain("var newLocation = '/r?to='")
    expect(bootstrapHtml).toContain('window.location.href = newLocation')

    // Step 3: Manually call redirect endpoint (simulating JavaScript result)
    // IMPORTANT: Chúng ta TỰ construct URL này, không phải JavaScript thực sự tạo ra!
    // Trong production, JavaScript sẽ làm việc này sau khi extract từ hash
    const redirectResponse = await testApp.request('/r?to=https%3A%2F%2Ftest.com', {}, defaultTestEnv)

    // Step 4: Verify final redirect works
    // CONFIDENCE: High (95%+) - Test thực sự server redirect logic
    expect(redirectResponse.status).toBe(302)
    expect(redirectResponse.headers.get('location')).toBe('https://test.com')
  })

  it('should preserve tracking parameters through redirect flow', async () => {
    /**
     * TEST: URL encoding và tracking parameters preservation
     * CONFIDENCE: High (95%+) - Server-side URL handling logic
     *
     * Trong browser thực sự:
     * User visits: /#https://test.com?utm_source=facebook&utm_campaign=promo
     * → JavaScript encodes toàn bộ URL (bao gồm query params)
     * → Navigates to: /r?to=https%3A%2F%2Ftest.com%3Futm_source%3D...
     * → Server decodes và redirects with params intact
     *
     * Test này verify: Server correctly decodes và preserves query params
     */
    const redirectResponse = await testApp.request(
      '/r?to=' + encodeURIComponent('https://test.com?utm_source=facebook&utm_campaign=promo'),
      {},
      defaultTestEnv
    )

    expect(redirectResponse.status).toBe(302)
    expect(redirectResponse.headers.get('location')).toBe(
      'https://test.com?utm_source=facebook&utm_campaign=promo'
    )
  })

  it('should include isNoRedirect parameter handling in JavaScript', async () => {
    /**
     * TEST: isNoRedirect parameter logic trong JavaScript code
     * CONFIDENCE: Medium (70%) - Chỉ verify code structure, không test execution
     *
     * isNoRedirect parameter behavior:
     * - isNoRedirect=1 → JavaScript KHÔNG tự động redirect (user phải click)
     * - isNoRedirect=0 hoặc không có → JavaScript TỰ ĐỘNG redirect sau 200ms
     *
     * IMPORTANT: isNoRedirect CHỈ ảnh hưởng client-side JavaScript auto-redirect
     * Server-side /r endpoint LUÔN LUÔN redirect bình thường (không biết gì về isNoRedirect)
     *
     * Test này verify:
     * ✅ JavaScript code có logic check isNoRedirect parameter
     * ✅ Server /r endpoint không bị ảnh hưởng bởi isNoRedirect
     * ❌ KHÔNG test JavaScript thực sự ngừng auto-redirect (cần browser)
     */
    const bootstrapResponse = await testApp.request('/?isNoRedirect=1', {}, defaultTestEnv)

    expect(bootstrapResponse.status).toBe(200)
    const bootstrapHtml = await bootstrapResponse.text()

    // Verify JavaScript code có URLSearchParams parsing logic
    expect(bootstrapHtml).toContain('URLSearchParams(window.location.search)')
    expect(bootstrapHtml).toContain('queryParams.get("isNoRedirect")')
    expect(bootstrapHtml).toContain('var isRedirect = !Boolean(parseInt(isNoRedirect))')
    expect(bootstrapHtml).toContain('if (isRedirect && newLocation !== "")')

    // Verify redirect endpoint vẫn hoạt động bình thường
    // (isNoRedirect chỉ ngăn JavaScript auto-redirect, không ảnh hưởng server)
    const redirectResponse = await testApp.request('/r?to=https%3A%2F%2Ftest.com', {}, defaultTestEnv)
    expect(redirectResponse.status).toBe(302)
    expect(redirectResponse.headers.get('location')).toBe('https://test.com')
  })

  it('should include fallback URL handling in bootstrap HTML', async () => {
    /**
     * TEST: Fallback URL khi không có hash fragment
     * CONFIDENCE: Medium (70%) - Code structure verification only
     *
     * Behavior:
     * - User visits / (không có #url) → JavaScript redirects to DEFAULT_REDIRECT_URL
     * - User visits /#url → JavaScript redirects to /r?to=url
     *
     * Test này verify: Fallback URL được inject vào JavaScript template
     * ❌ KHÔNG test JavaScript thực sự redirect to fallback (cần browser)
     */
    const response = await testApp.request('/', {}, defaultTestEnv)

    expect(response.status).toBe(200)
    const html = await response.text()

    // Verify JavaScript có logic check empty redirectUrl
    expect(html).toContain('if (!redirectUrl || redirectUrl === "")')
    // Verify DEFAULT_REDIRECT_URL từ env được inject vào template
    expect(html).toContain(`window.location.href = 'https://example.com'`)
  })

  it('should handle complex URL encoding in redirect endpoint', async () => {
    /**
     * TEST: URL encoding với special characters
     * CONFIDENCE: High (95%+) - Server-side encoding/decoding logic
     *
     * IMPORTANT: Chỉ test với ASCII characters để tránh ByteString errors
     * trong Node.js fetch API (không liên quan đến production Cloudflare Workers)
     *
     * Test này verify:
     * ✅ Server correctly decodes percent-encoded URLs
     * ✅ Spaces, special chars được preserve
     * ✅ Double-encoding không gây lỗi
     */
    const complexUrl = 'https://example.com/path%20with%20spaces?query=test&param=value%20encoded'

    const redirectResponse = await testApp.request(
      '/r?to=' + encodeURIComponent(complexUrl),
      {},
      defaultTestEnv
    )

    expect(redirectResponse.status).toBe(302)
    expect(redirectResponse.headers.get('location')).toBe(complexUrl)
  })

  it('should reject malformed URLs with proper error', async () => {
    /**
     * TEST: Validation logic cho invalid URLs
     * CONFIDENCE: High (95%+) - Server-side validation và error handling
     *
     * Test này verify:
     * ✅ Server rejects URLs không có http:// hoặc https://
     * ✅ Proper error code (400 Bad Request)
     * ✅ Clear error message
     *
     * IMPORTANT: Đây là expected behavior, không phải bug!
     * Malformed URLs nên bị reject để security và data integrity
     */
    const malformedUrl = 'not-a-valid-url'

    const redirectResponse = await testApp.request(
      '/r?to=' + encodeURIComponent(malformedUrl),
      {},
      defaultTestEnv
    )

    // Expected: 400 error vì URL không hợp lệ
    expect(redirectResponse.status).toBe(400)
    const body = await redirectResponse.json()
    expect(body).toMatchObject({
      code: 'INVALID_DESTINATION_FORMAT',
      error: expect.stringContaining('Invalid destination format')
    })
  })

  it('should measure performance: bootstrap HTML generation vs direct redirect', async () => {
    /**
     * TEST: Performance overhead của bootstrap approach
     * CONFIDENCE: Medium (50%) - CHỈ test server-side performance
     *
     * IMPORTANT LIMITATIONS:
     * ❌ KHÔNG measure client-side JavaScript execution time (cần browser)
     * ❌ KHÔNG measure hash fragment parsing time (cần browser)
     * ❌ KHÔNG measure toàn bộ redirect flow latency (cần browser)
     * ✅ CHỈ measure server response time (HTML generation vs 302 redirect)
     *
     * Trong production thực tế:
     * - Direct redirect: ~50ms (DNS + TLS + server response)
     * - Bootstrap flow: ~50ms (HTML) + ~200ms (setTimeout) + ~50ms (redirect) = ~300ms total
     *
     * Test này CHỈ measure phần server-side (~50ms HTML vs ~50ms redirect)
     * KHÔNG reflect toàn bộ user experience latency!
     *
     * Để test performance THẬT:
     * - Playwright: await page.goto() với networkidle
     * - Lighthouse: Performance metrics từ real browser
     */
    const targetUrl = 'https://example.com'

    // Measure server response time cho direct redirect
    const directStart = performance.now()
    const directResponse = await testApp.request(`/r?to=${targetUrl}`, {}, defaultTestEnv)
    const directEnd = performance.now()
    const directTime = directEnd - directStart

    // Measure server response time cho bootstrap HTML generation
    const bootstrapStart = performance.now()
    const bootstrapResponse = await testApp.request('/', {}, defaultTestEnv)
    const bootstrapEnd = performance.now()
    const bootstrapTime = bootstrapEnd - bootstrapStart

    // Verify responses
    expect(directResponse.status).toBe(302)
    expect(bootstrapResponse.status).toBe(200)

    // Performance assertions (both should complete quickly)
    expect(directTime).toBeGreaterThan(0)
    expect(bootstrapTime).toBeGreaterThan(0)

    // Bootstrap HTML generation should be fast (<100ms trong test environment)
    // NOTE: Số này KHÔNG bao gồm client-side JavaScript execution!
    expect(bootstrapTime).toBeLessThan(100)

    console.log(`Direct redirect (server only): ${directTime.toFixed(2)}ms`)
    console.log(`Bootstrap HTML generation (server only): ${bootstrapTime.toFixed(2)}ms`)
    console.log('NOTE: Client-side JavaScript time (~200ms) NOT measured!')
  })
})
