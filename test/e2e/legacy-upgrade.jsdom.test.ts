/**
 * JSDOM-based Legacy Redirect Tests
 *
 * Lightweight alternative to Playwright - chỉ ~50MB vs Playwright ~300MB
 *
 * JSDOM là gì?
 * - JavaScript implementation của DOM trong Node.js
 * - Có thể EXECUTE JavaScript code (khác với Vitest server-side)
 * - Nhưng KHÔNG phải real browser (không có rendering, network, etc)
 *
 * Confidence Level:
 * ✅ High (90%): JavaScript execution, DOM manipulation
 * ⚠️ Medium (70%): Navigation simulation (mock window.location)
 * ❌ Low (30%): Real browser behavior, timing, performance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { Hono } from 'hono'
import bootstrapApp from '../../src/routes/bootstrap'
import { defaultTestEnv } from '../fixtures/env'

// Create test app
const testApp = new Hono()
testApp.route('/', bootstrapApp)

describe('Legacy URL Upgrade - JSDOM (JavaScript Execution)', () => {
  it('should execute JavaScript and extract URL from hash fragment', async () => {
    /**
     * TEST: JavaScript execution trong JSDOM environment
     *
     * JSDOM sẽ:
     * ✅ Execute JavaScript code
     * ✅ Simulate window object
     * ✅ Simulate window.location
     * ⚠️ Mock navigation (không thực sự navigate)
     *
     * Confidence: 90% - Test thực sự JavaScript logic
     */

    // Get bootstrap HTML from server
    const response = await testApp.request('/', {}, defaultTestEnv)
    const html = await response.text()

    // Create JSDOM with hash fragment
    const dom = new JSDOM(html, {
      url: 'http://localhost/#https://test.com',
      runScripts: 'dangerously', // ← Execute JavaScript!
      resources: 'usable'
    })

    // Mock window.location.href setter để catch navigation
    let capturedRedirectUrl: string | null = null
    Object.defineProperty(dom.window, 'location', {
      value: {
        ...dom.window.location,
        href: 'http://localhost/#https://test.com',
        hash: '#https://test.com',
        search: '',
        set href(url: string) {
          capturedRedirectUrl = url
        }
      },
      writable: true
    })

    // Wait for setTimeout to execute (200ms in bootstrap.ts)
    await new Promise(resolve => setTimeout(resolve, 300))

    // Verify JavaScript extracted URL and attempted navigation
    expect(capturedRedirectUrl).toBeTruthy()
    expect(capturedRedirectUrl).toContain('/r?to=')
    expect(capturedRedirectUrl).toContain('https%3A%2F%2Ftest.com')

    console.log('✅ JavaScript executed and extracted URL:', capturedRedirectUrl)
  })

  it('should handle isNoRedirect=1 parameter', async () => {
    /**
     * TEST: isNoRedirect parameter logic
     * Confidence: 90% - JSDOM có URLSearchParams support
     */

    const response = await testApp.request('/', {}, defaultTestEnv)
    const html = await response.text()

    // Create JSDOM với isNoRedirect parameter
    const dom = new JSDOM(html, {
      url: 'http://localhost/?isNoRedirect=1#https://test.com',
      runScripts: 'dangerously'
    })

    let capturedRedirectUrl: string | null = null
    Object.defineProperty(dom.window, 'location', {
      value: {
        ...dom.window.location,
        href: 'http://localhost/?isNoRedirect=1#https://test.com',
        hash: '#https://test.com',
        search: '?isNoRedirect=1',
        set href(url: string) {
          capturedRedirectUrl = url
        }
      },
      writable: true
    })

    await new Promise(resolve => setTimeout(resolve, 300))

    // Verify JavaScript KHÔNG auto-redirect khi isNoRedirect=1
    expect(capturedRedirectUrl).toBeNull()

    console.log('✅ JavaScript correctly handled isNoRedirect=1 (no auto-redirect)')
  })

  it('should redirect to fallback URL when no hash fragment', async () => {
    /**
     * TEST: Fallback URL behavior
     * Confidence: 90%
     */

    const response = await testApp.request('/', {}, defaultTestEnv)
    const html = await response.text()

    // Create JSDOM without hash fragment
    const dom = new JSDOM(html, {
      url: 'http://localhost/',
      runScripts: 'dangerously'
    })

    let capturedRedirectUrl: string | null = null
    Object.defineProperty(dom.window, 'location', {
      value: {
        ...dom.window.location,
        href: 'http://localhost/',
        hash: '',
        search: '',
        set href(url: string) {
          capturedRedirectUrl = url
        }
      },
      writable: true
    })

    await new Promise(resolve => setTimeout(resolve, 300))

    // Verify JavaScript redirected to fallback URL
    expect(capturedRedirectUrl).toBe('https://example.com') // DEFAULT_REDIRECT_URL

    console.log('✅ JavaScript correctly redirected to fallback URL')
  })

  it('should handle tracking parameters in hash fragment', async () => {
    const response = await testApp.request('/', {}, defaultTestEnv)
    const html = await response.text()

    const dom = new JSDOM(html, {
      url: 'http://localhost/#https://test.com?utm_source=facebook&utm_campaign=promo',
      runScripts: 'dangerously'
    })

    let capturedRedirectUrl: string | null = null
    Object.defineProperty(dom.window, 'location', {
      value: {
        ...dom.window.location,
        href: 'http://localhost/#https://test.com?utm_source=facebook&utm_campaign=promo',
        hash: '#https://test.com?utm_source=facebook&utm_campaign=promo',
        search: '',
        set href(url: string) {
          capturedRedirectUrl = url
        }
      },
      writable: true
    })

    await new Promise(resolve => setTimeout(resolve, 300))

    // Verify tracking parameters preserved
    expect(capturedRedirectUrl).toContain('utm_source')
    expect(capturedRedirectUrl).toContain('utm_campaign')
    expect(capturedRedirectUrl).toContain('facebook')
    expect(capturedRedirectUrl).toContain('promo')

    console.log('✅ Tracking parameters preserved:', capturedRedirectUrl)
  })
})

/**
 * JSDOM vs Playwright Comparison
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │                    JSDOM (Lightweight)                        │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Size: ~50MB                                                   │
 * │ Speed: Fast (~100ms per test)                                │
 * │ Setup: npm install --save-dev jsdom                          │
 * │                                                               │
 * │ ✅ JavaScript execution                                      │
 * │ ✅ DOM manipulation                                          │
 * │ ✅ URLSearchParams, setTimeout, etc                          │
 * │ ⚠️ Mock navigation (không thực sự navigate)                 │
 * │ ❌ NO: CSS rendering, network requests, real browser APIs   │
 * │                                                               │
 * │ Good for: Unit testing JavaScript logic                      │
 * └──────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │                   Playwright (Heavy)                          │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Size: ~300MB (browser binaries)                              │
 * │ Speed: Slow (~2-5s per test)                                 │
 * │ Setup: npm install --save-dev @playwright/test              │
 * │         npx playwright install                               │
 * │                                                               │
 * │ ✅ Real browser execution                                    │
 * │ ✅ Real navigation                                           │
 * │ ✅ Network requests                                          │
 * │ ✅ CSS rendering, screenshots                                │
 * │ ✅ Multi-browser testing                                     │
 * │                                                               │
 * │ Good for: E2E testing, visual regression, cross-browser      │
 * └──────────────────────────────────────────────────────────────┘
 *
 * RECOMMENDATION FOR THIS PROJECT:
 *
 * ✅ Use JSDOM if:
 * - Cần test JavaScript execution
 * - Redirect logic phức tạp
 * - Cần automated tests trong CI/CD
 * - Budget/infrastructure limited
 *
 * ❌ DON'T use Playwright if:
 * - Redirect logic đơn giản (như hiện tại)
 * - Manual testing đủ nhanh
 * - Không cần cross-browser testing
 * - Không cần visual testing
 *
 * 💡 Best Approach for This Project:
 * 1. Server-side tests (Vitest) - Fast feedback (đã có ✅)
 * 2. JSDOM tests - Verify JavaScript logic (optional)
 * 3. Manual testing - Final verification trước deploy
 * 4. Production monitoring - Catch real-world issues
 */
