import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../src/index'
import { createMockEnv } from '../helpers/config'

describe('Redirect Endpoint Validation', () => {
  let testEnv: any

  beforeEach(() => {
    testEnv = createMockEnv()
  })
  it('should return 400 for missing to parameter', async () => {
    const response = await app.request('/r', {}, testEnv)
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code: string }
    expect(body.error).toBeDefined()
    expect(body.code).toBeDefined() 
  })

  it('should return 400 for invalid URL', async () => {
    const response = await app.request('/r?to=invalid-url', {}, testEnv)
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code: string }
    expect(body.error).toBeDefined()
  })

  it('should return 400 for empty to parameter', async () => {
    const response = await app.request('/r?to=', {}, testEnv)
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code: string }
    expect(body.error).toBeDefined()
  })

  it('should accept valid URL with n parameter', async () => {
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com&n=1', {}, testEnv)
    
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

  it('should accept valid URL without n parameter', async () => {
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com', {}, testEnv)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
  })

  it('should accept valid URL with n=0', async () => {
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com&n=0', {}, testEnv)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
  })

  it('should reject invalid n parameter values', async () => {
    const response = await app.request('/r?to=https%3A%2F%2Fexample.com&n=2', {}, testEnv)
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code: string }
    expect(body.error).toBeDefined()
  })
})