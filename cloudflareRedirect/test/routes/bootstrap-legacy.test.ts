import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Hono } from 'hono'

// Create test app that mimics main app structure
const testApp = new Hono()

// Mount routes like in main index.ts
import bootstrapApp from '../../src/routes/bootstrap'
import redirectApp from '../../src/routes/redirect'
testApp.route('/', bootstrapApp)
testApp.route('/r', redirectApp)

describe('Bootstrap Legacy URL Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should upgrade legacy hash URL to redirect endpoint', async () => {
    const response = await testApp.request('/#https://example.com')
    
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    
    const html = await response.text()
    expect(html).toContain('/r?to=https%3A%2F%2Fexample.com')
    expect(html).toContain('window.location.replace')
  })

  it('should preserve tracking parameters in upgrade', async () => {
    const response = await testApp.request('/#https://example.com?utm_source=fb&utm_medium=social')
    
    const html = await response.text()
    expect(html).toContain('/r?to=https%3A%2F%2Fexample.com%3Futm_source%3Dfb%26utm_medium%3Dsocial')
  })

  it('should handle isNoRedirect=1 parameter correctly', async () => {
    const response = await testApp.request('/?isNoRedirect=1#https://example.com')
    
    const html = await response.text()
    expect(html).toContain('/r?to=https%3A%2F%2Fexample.com&n=1')
  })

  it('should redirect to default URL when no hash present', async () => {
    const response = await testApp.request('/')
    
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://example.com/fallback')
  })

  it('should handle URL encoding correctly', async () => {
    const testUrl = 'https://example.com/path with spaces?param=value&other=test'
    const response = await testApp.request(`/#${testUrl}`)
    
    const html = await response.text()
    expect(html).toContain('/r?to=')
    const encodedUrl = encodeURIComponent(testUrl)
    expect(html).toContain(encodedUrl)
  })

  it('should handle special characters in destination URLs', async () => {
    const testUrl = 'https://example.com/café?query=测试'
    const response = await testApp.request(`/#${testUrl}`)
    
    const html = await response.text()
    expect(html).toContain('/r?to=')
    expect(html).toContain('%E6%B5%8B%E8%AF%95')
  })

  it('should handle empty hash gracefully', async () => {
    const response = await testApp.request('/#')
    
    const html = await response.text()
    expect(html).toContain('Redirecting...')
    expect(html).not.toContain('/r?to=')
  })

  it('should handle malformed URLs without crashing', async () => {
    const response = await testApp.request('/#not-a-valid-url')
    
    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).toContain('/r?to=not-a-valid-url')
  })

  it('should include proper cache control headers', async () => {
    const response = await testApp.request('/#https://example.com')
    
    expect(response.headers.get('cache-control')).toBe('no-cache, no-store, must-revalidate')
    expect(response.headers.get('pragma')).toBe('no-cache')
  })

  it('should include noscript fallback', async () => {
    const response = await testApp.request('/#https://example.com')
    
    const html = await response.text()
    expect(html).toContain('<noscript>')
    expect(html).toContain('JavaScript Required')
  })

  it('should handle hash with URL that contains fragments', async () => {
    const testUrl = 'https://example.com/page#section'
    const response = await testApp.request(`/#${testUrl}`)
    
    const html = await response.text()
    expect(html).toContain('/r?to=https%3A%2F%2Fexample.com%2Fpage%23section')
  })

  it('should measure performance of bootstrap upgrade', async () => {
    const testUrl = 'https://example.com'
    
    const startTime = performance.now()
    const response = await testApp.request(`/#${testUrl}`)
    const endTime = performance.now()
    
    expect(response.status).toBe(200)
    
    const responseTime = endTime - startTime
    expect(responseTime).toBeGreaterThan(0)
    expect(responseTime).toBeLessThan(1000) // Should complete within 1 second
    
    console.log(`Bootstrap response time: ${responseTime}ms`)
  })
})