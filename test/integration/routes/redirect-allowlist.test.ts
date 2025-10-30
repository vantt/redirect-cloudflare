import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../src/index'
import { createMockEnv } from '../../helpers/config'

describe('Redirect Domain Allowlist Integration', () => {
  let testEnv: any

  beforeEach(() => {
    // Setup test environment for each test
    testEnv = createMockEnv()
    testEnv.ALLOWED_DOMAINS = 'example.com,trusted.org'
  })

  it('should allow redirect to exact allowed domain', async () => {
    const response = await app.request('/r?to=https://example.com/path', {}, testEnv)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com/path')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })


  it('should allow redirect to subdomain of allowed domain', async () => {
    const response = await app.request('/r?to=https://sub.example.com/api/users', {}, testEnv)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://sub.example.com/api/users')
  })

  it('should allow redirect to second allowed domain', async () => {
    const response = await app.request('/r?to=https://trusted.org/secure', {}, testEnv)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://trusted.org/secure')
  })

  it('should reject redirect to non-allowed domain', async () => {
    const response = await app.request('/r?to=https://evil.com/malware', {}, testEnv)
    
    expect(response.status).toBe(403)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Domain not allowed: evil.com')
    expect(body.code).toBe('DOMAIN_NOT_ALLOWED')
  })

  it('should reject redirect to subdomain of non-allowed domain', async () => {
    const response = await app.request('/r?to=https://sub.evil.com/attack', {}, testEnv)
    
    expect(response.status).toBe(403)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Domain not allowed: sub.evil.com')
    expect(body.code).toBe('DOMAIN_NOT_ALLOWED')
  })

  it('should work with complex allowed domain URLs', async () => {
    const complexUrl = 'https://sub.example.com:8443/api/v1/users?id=123&session=abc#section'
    const response = await app.request(`/r?to=${encodeURIComponent(complexUrl)}`, {}, testEnv)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe(complexUrl)
  })

  it('should allow all domains when ALLOWED_DOMAINS is undefined', async () => {
    testEnv.ALLOWED_DOMAINS = undefined
    // Test with undefined environment (simulate permissive mode)
    const response = await app.request('/r?to=https://anydomain.com', {}, testEnv)
    
    // This test depends on the actual environment setup
    // In a real environment without ALLOWED_DOMAINS, all domains should be allowed
    expect(response.status).toBe(302)
  })

  it('should allow all domains when ALLOWED_DOMAINS is empty', async () => {
    testEnv.ALLOWED_DOMAINS = ''
    // Test with empty environment (simulate permissive mode)
    const response = await app.request('/r?to=https://anydomain.com', {}, testEnv)
    
    // In an environment with empty ALLOWED_DOMAINS, all domains should be allowed
    expect(response.status).toBe(302)
  })

  it('should preserve query parameters in allowed redirects', async () => {
    const response = await app.request('/r?to=https://example.com/page?utm_source=google&utm_medium=cpc', {}, testEnv)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com/page?utm_source=google&utm_medium=cpc')
  })

  it('should work with debug mode on allowed domains', async () => {
    const response = await app.request('/r?to=https://example.com&debug=1', {}, testEnv)
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    const body = await response.json() as {
      destination: any;
      tracking_params: Record<string, string>;
      redirect_type: string;
      note: string;
    }
    
    expect(body.destination.resolved).toBe('https://example.com')
  })

  it('should reject debug mode on non-allowed domains', async () => {
    const response = await app.request('/r?to=https://evil.com&debug=1', {}, testEnv)
    
    expect(response.status).toBe(403)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Domain not allowed: evil.com')
    expect(body.code).toBe('DOMAIN_NOT_ALLOWED')
  })

  it('should handle case-insensitive allowlist matching', async () => {
    const response = await app.request('/r?to=https://EXAMPLE.COM/case-test', {}, testEnv)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://EXAMPLE.COM/case-test')
  })

  it('should clean whitespace in allowlist properly', async () => {
    testEnv.ALLOWED_DOMAINS = '  example.com , trusted.org  '
    // This test assumes the environment allows whitespace handling
    const response = await app.request('/r?to=https://example.com', {}, testEnv)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com')
  })

  it('should reject even with valid protocol but forbidden domain', async () => {
    const response = await app.request('/r?to=https://evil.com', {}, testEnv)
    
    expect(response.status).toBe(403)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Domain not allowed: evil.com')
    expect(body.code).toBe('DOMAIN_NOT_ALLOWED')
  })

  it('should handle edge case with trailing dots', async () => {
    // evil.com.example.com should NOT match example.com
    const response = await app.request('/r?to=https://evil.com.example.com', {}, testEnv)
    
    expect(response.status).toBe(403)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Domain not allowed: evil.com.example.com')
  })
})
