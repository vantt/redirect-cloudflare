/// <reference types="vitest" />

import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import bootstrapApp from '../../src/routes/bootstrap'
import redirectApp from '../../src/routes/redirect'

// Create test app that mimics main app structure
const testApp = new Hono()

// Mount routes like in main index.ts
testApp.route('/', bootstrapApp)
testApp.route('/r', redirectApp)

describe('E2E Legacy URL Upgrade Flow', () => {
  it('should complete full flow: legacy hash → bootstrap → upgrade → final redirect', async () => {
    // Step 1: Request with legacy hash format
    const bootstrapResponse = await testApp.request('/#https://target-site.com')
    
    expect(bootstrapResponse.status).toBe(200)
    expect(bootstrapResponse.headers.get('content-type')).toContain('text/html')
    
    const bootstrapHtml = await bootstrapResponse.text()
    
    // Step 2: Verify upgrade URL is correctly formed
    expect(bootstrapHtml).toContain('/r?to=https%3A%2F%2Ftarget-site.com')
    
    // Extract upgrade URL from HTML
    const upgradeUrlMatch = bootstrapHtml.match(/window\.location\.replace\('([^']+)'\)/)
    const upgradeUrl = upgradeUrlMatch?.[1]
    if (!upgradeUrl) {
      throw new Error('Upgrade URL not found in HTML')
    }
    
    expect(upgradeUrl).toBe('/r?to=https%3A%2F%2Ftarget-site.com')
    
    // Step 3: Request the upgrade URL
    const redirectResponse = await testApp.request(upgradeUrl)
    
    // Step 4: Verify final redirect
    expect(redirectResponse.status).toBe(302)
    expect(redirectResponse.headers.get('location')).toBe('https://target-site.com')
  })

  it('should preserve tracking parameters through complete flow', async () => {
    const bootstrapResponse = await testApp.request('/#https://target-site.com?utm_source=facebook&utm_campaign=promo')
    
    const bootstrapHtml = await bootstrapResponse.text()
    
    // Extract upgrade URL
    const upgradeUrlMatch = bootstrapHtml.match(/window\.location\.replace\('([^']+)'\)/)
    const upgradeUrl = upgradeUrlMatch?.[1]
    if (!upgradeUrl) {
      throw new Error('Upgrade URL not found in HTML')
    }
    
    // Verify tracking parameters are preserved
    expect(upgradeUrl).toContain('utm_source=facebook')
    expect(upgradeUrl).toContain('utm_campaign=promo')
    
    // Test final redirect
    const redirectResponse = await testApp.request(upgradeUrl)
    expect(redirectResponse.status).toBe(302)
    expect(redirectResponse.headers.get('location')).toBe(
      'https://target-site.com?utm_source=facebook&utm_campaign=promo'
    )
  })

  it('should handle isNoRedirect=1 through complete flow', async () => {
    const bootstrapResponse = await testApp.request('/?isNoRedirect=1#https://target-site.com')
    
    const bootstrapHtml = await bootstrapResponse.text()
    
    // Extract upgrade URL
    const upgradeUrlMatch = bootstrapHtml.match(/window\.location\.replace\('([^']+)'\)/)
    const upgradeUrl = upgradeUrlMatch?.[1]
    if (!upgradeUrl) {
      throw new Error('Upgrade URL not found in HTML')
    }
    
    // Verify debug parameter is included
    expect(upgradeUrl).toContain('n=1')
    
    // Test final redirect
    const redirectResponse = await testApp.request(upgradeUrl)
    expect(redirectResponse.status).toBe(302)
    expect(redirectResponse.headers.get('location')).toBe('https://target-site.com')
  })

  it('should handle root fallback correctly', async () => {
    const response = await testApp.request('/')
    
    // Should directly redirect to default URL (no bootstrap needed)
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://example.com/fallback')
  })

  it('should handle complex URL encoding through flow', async () => {
    const complexUrl = 'https://example.com/path with spaces?query=测试&param=value%20encoded'
    
    const bootstrapResponse = await testApp.request(`/#${complexUrl}`)
    
    const bootstrapHtml = await bootstrapResponse.text()
    
    // Verify URL is properly encoded in upgrade
    const encodedUrl = encodeURIComponent(complexUrl)
    expect(bootstrapHtml).toContain(`/r?to=${encodedUrl}`)
    
    // Extract and test final redirect
    const upgradeUrlMatch = bootstrapHtml.match(/window\.location\.replace\('([^']+)'\)/)
    const upgradeUrl = upgradeUrlMatch?.[1]
    if (!upgradeUrl) {
      throw new Error('Upgrade URL not found in HTML')
    }
    
    const redirectResponse = await testApp.request(upgradeUrl)
    expect(redirectResponse.status).toBe(302)
    expect(redirectResponse.headers.get('location')).toBe(complexUrl)
  })

  it('should handle malformed URLs gracefully through flow', async () => {
    const malformedUrl = 'not-a-valid-url'
    
    const bootstrapResponse = await testApp.request(`/#${malformedUrl}`)
    expect(bootstrapResponse.status).toBe(200)
    
    const bootstrapHtml = await bootstrapResponse.text()
    
    // Extract upgrade URL
    const upgradeUrlMatch = bootstrapHtml.match(/window\.location\.replace\('([^']+)'\)/)
    const upgradeUrl = upgradeUrlMatch?.[1]
    if (!upgradeUrl) {
      throw new Error('Upgrade URL not found in HTML')
    }
    
    // Should still attempt redirect
    expect(upgradeUrl).toContain('/r?to=not-a-valid-url')
    
    // Final redirect should still work (as fallback)
    const redirectResponse = await testApp.request(upgradeUrl)
    expect(redirectResponse.status).toBe(302)
    expect(redirectResponse.headers.get('location')).toBe(malformedUrl)
  })

  it('should measure performance overhead of bootstrap vs direct redirect', async () => {
    const targetUrl = 'https://example.com'
    
    // Measure direct redirect performance
    const directStart = performance.now()
    const directResponse = await testApp.request(`/r?to=${targetUrl}`)
    const directEnd = performance.now()
    const directTime = directEnd - directStart
    
    // Measure bootstrap upgrade performance
    const bootstrapStart = performance.now()
    const bootstrapResponse = await testApp.request(`/#${targetUrl}`)
    const bootstrapEnd = performance.now()
    const bootstrapTime = bootstrapEnd - bootstrapStart
    
    // Verify responses
    expect(bootstrapResponse.status).toBe(200)
    expect(directResponse.status).toBe(302)
    
    // Performance assertions
    expect(directTime).toBeGreaterThan(0)
    expect(bootstrapTime).toBeGreaterThan(0)
    
    // Bootstrap overhead should be reasonable (<50ms in test environment)
    const overhead = bootstrapTime - directTime
    expect(overhead).toBeLessThan(50) // AC requirement
    
    console.log(`Direct redirect: ${directTime.toFixed(2)}ms`)
    console.log(`Bootstrap: ${bootstrapTime.toFixed(2)}ms`)
    console.log(`Overhead: ${overhead.toFixed(2)}ms`)
  })
})