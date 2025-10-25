import { describe, it, expect } from 'vitest'
import app from '../../src/index'

describe('Redirect Endpoint Validation', () => {
  it('should return 400 for missing to parameter', async () => {
    const response = await app.request('/r')
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code: string }
    expect(body.error).toBeDefined()
    expect(body.code).toBeDefined()
  })

  it('should return 400 for invalid URL', async () => {
    const response = await app.request('/r?to=invalid-url')
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code: string }
    expect(body.error).toBeDefined()
  })

  it('should return 400 for empty to parameter', async () => {
    const response = await app.request('/r?to=')
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code: string }
    expect(body.error).toBeDefined()
  })

  it('should accept valid URL with n parameter', async () => {
    const response = await app.request('/r?to=https://example.com&n=1')
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
  })

  it('should accept valid URL without n parameter', async () => {
    const response = await app.request('/r?to=https://example.com')
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
  })

  it('should accept valid URL with n=0', async () => {
    const response = await app.request('/r?to=https://example.com&n=0')
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
  })

  it('should reject invalid n parameter values', async () => {
    const response = await app.request('/r?to=https://example.com&n=2')
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code: string }
    expect(body.error).toBeDefined()
  })
})