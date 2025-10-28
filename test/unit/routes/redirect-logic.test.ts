import { describe, it, expect, vi } from 'vitest'
import { createRedirectResponse } from '../../../src/routes/redirect'

describe('Redirect Response Creation', () => {
  it('should create 302 redirect for temporary type (default)', () => {
    const destination = 'https://example.com'
    const response = createRedirectResponse(destination)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe(destination)
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should create 302 redirect for explicit temporary type', () => {
    const destination = 'https://example.com'
    const response = createRedirectResponse(destination, 'temporary')
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe(destination)
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should create 301 redirect for permanent type', () => {
    const destination = 'https://example.com'
    const response = createRedirectResponse(destination, 'permanent')
    
    expect(response.status).toBe(301)
    expect(response.headers.get('Location')).toBe(destination)
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000')
  })

  it('should use default temporary type for invalid type', () => {
    const destination = 'https://example.com'
    const response = createRedirectResponse(destination, 'invalid' as any)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe(destination)
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should have no response body for redirects', () => {
    const destination = 'https://example.com'
    const response = createRedirectResponse(destination, 'permanent')
    
    expect(response.body).toBeNull()
  })
})
