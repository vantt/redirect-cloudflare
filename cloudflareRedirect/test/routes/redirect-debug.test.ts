import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../src/index'
import { createMockEnv } from '../helpers/config'

describe('Redirect Debug Mode', () => {
  let testEnv: any

  beforeEach(() => {
    // Setup test environment for each test
    testEnv = createMockEnv()
  })
  it('should return 200 JSON when n=1', async () => {
    const response = await app.request('/r?to=https://example.com&n=1', {}, testEnv)
    
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

  it('should return 302 redirect when n=0', async () => {
    const response = await app.request('/r?to=https://example.com&n=0', {}, testEnv)    
    console.log(response);
    
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
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com%3Futm_source%3Dfb%26utm_medium%3Dcpc&n=1', {}, testEnv)
    
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
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com&n=1', {}, testEnv)
    
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

  it('should reject invalid n parameter values', async () => {
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com&n=2', {}, testEnv)
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code: string }
    expect(body.error).toBeDefined()
  })

  it('should require to parameter even in debug mode', async () => {
    const response = await app.request('/r?n=1', {}, testEnv)
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code: string }
    expect(body.error).toBeDefined()
  })

  it('should have proper JSON structure formatting', async () => {
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com&n=1', {}, testEnv)
    
    const body = await response.json()
    
    // Verify it's valid JSON with expected structure
    expect(body).toMatchObject({
      destination: expect.any(String),
      tracking_params: expect.any(Object),
      redirect_type: expect.stringMatching(/^(301|302)$/),
      note: expect.stringContaining('Debug mode')
    })
  })
})