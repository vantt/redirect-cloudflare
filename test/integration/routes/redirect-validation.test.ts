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
    
    expect(body.error).toBe('Missing required parameter: to')
    expect(body.code).toBe('MISSING_PARAM')
  })

  it('should return 400 for empty to parameter', async () => {
    const response = await app.request('/r?to=', {}, testEnv)
    expect(response.status).toBe(400)

    const body = await response.json() as { error: string; code: string }
    expect(body.error).toEqual('Missing required parameter: to');
    expect(body.code).toEqual('MISSING_PARAM');
  })


  it('should return 400 for invalid URL', async () => {
    const response = await app.request('/r?to=invalid-url', {}, testEnv)
    expect(response.status).toBe(400)

    const body = await response.json() as { error: string; code: string }
    expect(body.error).toEqual('Invalid destination format: must be shortcode (alphanumeric) or full URL (http:// or https://)');
    expect(body.code).toEqual('INVALID_DESTINATION_FORMAT');
  })

  

  it('should accept valid URL with debug parameter', async () => {
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com&debug=1', {}, testEnv)
    
    expect(response.status).toBe(200)
    const body = await response.json() as {
      destination: any;
      tracking_params: Record<string, string>;
      redirect_type: string;
      note: string;
    }

    expect(body.destination.resolved).toBe('https://example.com')
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
