import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../src/index'
import { createMockEnv } from '../../helpers/config'

describe('Redirect Debug Mode', () => {
  let testEnv: any

  beforeEach(() => {
    // Setup test environment for each test
    testEnv = createMockEnv()
  })
  it('should return 200 JSON when debug=1', async () => {
    const response = await app.request('/r?to=https://example.com&debug=1', {}, testEnv)
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    const body = await response.json() as {
      destination: string;
      tracking_params: Record<string, string>;
      redirect_type: string;
      note: string;
    }
    
    expect(body.destination).toBe('https://example.com')
    expect(body.redirect_type).toBe('302')
    expect(body.note).toBe('Debug mode - redirect suppressed')
    expect(typeof body.tracking_params).toBe('object')
  })

  it('should return 302 redirect when debug=0', async () => {
    const response = await app.request('/r?to=https://example.com&debug=0', {}, testEnv)    
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should return 302 redirect when n is omitted (default behavior)', async () => {
    const response = await app.request('/r?to=https://example.com', {}, testEnv)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should include tracking params in debug response when present', async () => {
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com%3Futm_source%3Dfb%26utm_medium%3Dcpc&debug=1', {}, testEnv)
    
    expect(response.status).toBe(200)
    
    const body = await response.json() as {
      destination: string;
      tracking_params: Record<string, string>;
      redirect_type: string;
      note: string;
    }
    
    expect(body.destination).toBe('https://example.com?utm_source=fb&utm_medium=cpc')
    expect(body.tracking_params).toHaveProperty('utm_source')
    expect(body.tracking_params).toHaveProperty('utm_medium')
    expect(body.tracking_params.utm_source).toBe('fb')
    expect(body.tracking_params.utm_medium).toBe('cpc')
    expect(body.tracking_params).toHaveProperty('utm_source')
    expect(body.tracking_params).toHaveProperty('utm_medium')
  })

  it('should return JSON with empty tracking params when none present', async () => {
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com&debug=1', {}, testEnv)
    
    expect(response.status).toBe(200)
    
    const body = await response.json() as {
      destination: string;
      tracking_params: Record<string, string>;
      redirect_type: string;
      note: string;
    }
    
    expect(body.destination).toBe('https://example.com')
    expect(Object.keys(body.tracking_params)).toHaveLength(0)
  })

  it('should treat invalid debug parameter values as false (lenient parsing)', async () => {
    // Invalid values like debug=2 or debug=invalid are treated as false (redirect normally)
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com&debug=2', {}, testEnv)

    // Should redirect (not error) - lenient parsing treats invalid as false
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
  })

  it('should require to parameter even in debug mode', async () => {
    const response = await app.request('/r?debug=1', {}, testEnv)
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code: string }
    expect(body.error).toBeDefined()
  })

  it('should accept debug=1 as primary parameter (AC#1)', async () => {
    const response = await app.request('/r?to=https://example.com&debug=1', {}, testEnv)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')

    const body = await response.json() as {
      destination: string;
      tracking_params: Record<string, string>;
      redirect_type: string;
      note: string;
    }

    expect(body.destination).toBe('https://example.com')
    expect(body.redirect_type).toBe('302')
    expect(body.note).toBe('Debug mode - redirect suppressed')
  })

  it('should accept debug=true as well as debug=1', async () => {
    const response = await app.request('/r?to=https://example.com&debug=true', {}, testEnv)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })


  it('should have proper JSON structure formatting', async () => {
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com&debug=1', {}, testEnv)

    const body = await response.json()

    // Verify it's valid JSON with expected structure
    expect(body).toMatchObject({
      destination: expect.any(String),
      tracking_params: expect.any(Object),
      redirect_type: expect.stringMatching(/^(301|302)$/),
      note: expect.stringContaining('Debug mode')
    })
  })

  // New test cases for extended truthy/falsy values
  it('should accept debug=yes as truthy value', async () => {
    const response = await app.request('/r?to=https://example.com&debug=yes', {}, testEnv)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })

  it('should accept debug=on as truthy value', async () => {
    const response = await app.request('/r?to=https://example.com&debug=on', {}, testEnv)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })

  it('should accept debug=enabled as truthy value', async () => {
    const response = await app.request('/r?to=https://example.com&debug=enabled', {}, testEnv)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })

  it('should accept debug=no as falsy value', async () => {
    const response = await app.request('/r?to=https://example.com&debug=no', {}, testEnv)

    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
  })

  it('should accept debug=off as falsy value', async () => {
    const response = await app.request('/r?to=https://example.com&debug=off', {}, testEnv)

    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
  })

  it('should accept debug=disabled as falsy value', async () => {
    const response = await app.request('/r?to=https://example.com&debug=disabled', {}, testEnv)

    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
  })

  it('should accept debug=false as falsy value', async () => {
    const response = await app.request('/r?to=https://example.com&debug=false', {}, testEnv)

    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
  })

  it('should handle case-insensitive debug values (YES, True, OFF)', async () => {
    // Test uppercase YES (truthy)
    const response1 = await app.request('/r?to=https://example.com&debug=YES', {}, testEnv)
    expect(response1.status).toBe(200)

    // Test mixed case True (truthy)
    const response2 = await app.request('/r?to=https://example.com&debug=True', {}, testEnv)
    expect(response2.status).toBe(200)

    // Test uppercase OFF (falsy)
    const response3 = await app.request('/r?to=https://example.com&debug=OFF', {}, testEnv)
    expect(response3.status).toBe(302)
  })
})
