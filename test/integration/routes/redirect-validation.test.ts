import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../src/index'
import { createMockEnv } from '../../helpers/config'

describe('Redirect Endpoint Validation', () => {
  let testEnv: any

  beforeEach(() => {
    testEnv = createMockEnv()
  })

  it('should return 400 for missing to parameter', async () => {
    const response = await app.request('/r', {}, testEnv)
    
    expect(response.status).toBe(400)
    const body = await response.json() as any
    
    // Check if response has expected format or alternative format
    if (body.success !== undefined && body.error !== undefined) {
      // Alternative format: {success: boolean, error: {code, message, path, expected}}
      expect(body.success).toBe(false)
      expect(body.error.code).toBeDefined()
      expect(body.error.message).toBeDefined()
    } else {
      // Expected format: {error: string, code: string}
      expect(body.error).toBeDefined()
      expect(body.code).toBeDefined()
    }
  })

  it('should return 403 for empty to parameter', async () => {
    const response = await app.request('/r?to=', {}, testEnv)
    expect(response.status).toBe(403)

    const body = await response.json() as { error: string; code: string }
    expect(body.code).toEqual('DOMAIN_NOT_ALLOWED');
  })


  it('should return 403 for invalid URL', async () => {
    const response = await app.request('/r?to=invalid-url', {}, testEnv)
    expect(response.status).toBe(403)

    const body = await response.json() as { error: string; code: string }
    expect(body.code).toEqual('DOMAIN_NOT_ALLOWED');
  })

  

  it('should accept valid URL with debug parameter', async () => {
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com&debug=1', {}, testEnv)
    
    expect(response.status).toBe(200)
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

  it('should accept valid URL without debug parameter', async () => {
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com', {}, testEnv)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
  })

  it('should accept valid URL with debug=0', async () => {
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com&debug=0', {}, testEnv)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
  })

  it('should accept valid URL with truely debug parameter values', async () => {
    const response = await app.request('/r?debug=2&to=https%3A%2F%2Fexample.com&debug=2', {}, testEnv)
    console.log(response);
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
  })
})
