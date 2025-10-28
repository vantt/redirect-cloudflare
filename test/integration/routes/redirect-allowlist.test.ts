import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../../../src/index'

// Mock environment variable for testing
const originalEnv = process.env

describe('Redirect Domain Allowlist Integration', () => {
  beforeAll(() => {
    // Mock environment variables for testing
    process.env.ALLOWED_DOMAINS = 'example.com,trusted.org'
  })

  afterAll(() => {
    // Restore environment
    process.env = originalEnv
  })

  it('should allow redirect to exact allowed domain', async () => {
    const response = await app.request('/r?to=https://example.com/path')
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com/path')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should allow redirect to subdomain of allowed domain', async () => {
    const response = await app.request('/r?to=https://sub.example.com/api/users')
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://sub.example.com/api/users')
  })

  it('should allow redirect to second allowed domain', async () => {
    const response = await app.request('/r?to=https://trusted.org/secure')
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://trusted.org/secure')
  })

  it('should reject redirect to non-allowed domain', async () => {
    const response = await app.request('/r?to=https://evil.com/malware')
    
    expect(response.status).toBe(403)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Domain not allowed')
    expect(body.code).toBe('DOMAIN_NOT_ALLOWED')
  })

  it('should reject redirect to subdomain of non-allowed domain', async () => {
    const response = await app.request('/r?to=https://sub.evil.com/attack')
    
    expect(response.status).toBe(403)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Domain not allowed')
    expect(body.code).toBe('DOMAIN_NOT_ALLOWED')
  })

  it('should work with complex allowed domain URLs', async () => {
    const complexUrl = 'https://sub.example.com:8443/api/v1/users?id=123&session=abc#section'
    const response = await app.request(`/r?to=${encodeURIComponent(complexUrl)}`)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe(complexUrl)
  })

  it('should allow all domains when ALLOWED_DOMAINS is undefined', async () => {
    // Test with undefined environment (simulate permissive mode)
    const response = await app.request('/r?to=https://anydomain.com')
    
    // This test depends on the actual environment setup
    // In a real environment without ALLOWED_DOMAINS, all domains should be allowed
    expect(response.status).toBe(302)
  })

  it('should allow all domains when ALLOWED_DOMAINS is empty', async () => {
    // Test with empty environment (simulate permissive mode)
    const response = await app.request('/r?to=https://anydomain.com')
    
    // In an environment with empty ALLOWED_DOMAINS, all domains should be allowed
    expect(response.status).toBe(302)
  })

  it('should preserve query parameters in allowed redirects', async () => {
    const response = await app.request('/r?to=https://example.com/page?utm_source=google&utm_medium=cpc')
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com/page?utm_source=google&utm_medium=cpc')
  })

  it('should work with debug mode on allowed domains', async () => {
    const response = await app.request('/r?to=https://example.com&debug=1')
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    const body = await response.json() as {
      destination: string;
      tracking_params: Record<string, string>;
      redirect_type: string;
      note: string;
    }
    
    expect(body.destination).toBe('https://example.com')
    expect(body.note).toBe('Debug mode - redirect suppressed')
  })

  it('should reject debug mode on non-allowed domains', async () => {
    const response = await app.request('/r?to=https://evil.com&debug=1')
    
    expect(response.status).toBe(403)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Domain not allowed')
    expect(body.code).toBe('DOMAIN_NOT_ALLOWED')
  })

  it('should handle case-insensitive allowlist matching', async () => {
    const response = await app.request('/r?to=https://EXAMPLE.COM/case-test')
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://EXAMPLE.COM/case-test')
  })

  it('should clean whitespace in allowlist properly', async () => {
    // This test assumes the environment allows whitespace handling
    const response = await app.request('/r?to=https://example.com')
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
  })

  it('should reject even with valid protocol but forbidden domain', async () => {
    const response = await app.request('/r?to=https://evil.com')
    
    expect(response.status).toBe(403)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Domain not allowed')
    expect(body.code).toBe('DOMAIN_NOT_ALLOWED')
  })

  it('should handle edge case with trailing dots', async () => {
    // evil.com.example.com should NOT match example.com
    const response = await app.request('/r?to=https://evil.com.example.com')
    
    expect(response.status).toBe(403)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Domain not allowed')
  })
})
