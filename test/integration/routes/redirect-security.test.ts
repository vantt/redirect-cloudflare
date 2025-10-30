import { describe, it, expect } from 'vitest'
import app from '../../../src/index'
import { defaultTestEnv } from '../../fixtures/env'

describe('Redirect Security - Protocol Validation', () => {
  it('should return 400 for javascript: URLs', async () => {
    const response = await app.request('/r?to=javascript:alert(1)', {}, defaultTestEnv)
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Invalid destination format: must be shortcode (alphanumeric) or full URL (http:// or https://)')
  })

  it('should return 400 for data: URLs', async () => {
    const response = await app.request('/r?to=data:text/html,<script>alert(1)</script>', {}, defaultTestEnv)

    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Invalid destination format: must be shortcode (alphanumeric) or full URL (http:// or https://)')
  })

  it('should return 400 for protocol-relative URLs', async () => {
    const response = await app.request('/r?to=//evil.com/malware.js', {}, defaultTestEnv)

    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Invalid destination format: must be shortcode (alphanumeric) or full URL (http:// or https://)')
  })

  it('should return 400 for whitespace-only URLs', async () => {
    const response = await app.request('/r?to=%20%20%20', {}, defaultTestEnv)

    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Missing required parameter: to')
  })

  it('should return 302 for valid http URLs', async () => {
    const response = await app.request('/r?to=http://example.com', {}, defaultTestEnv)

    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('http://example.com')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should return 302 for valid https URLs', async () => {
    const response = await app.request('/r?to=https://example.com/path?query=value', {}, defaultTestEnv)

    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com/path?query=value')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should return 200 JSON for valid https URLs with debug mode', async () => {
    const response = await app.request('/r?to=https://example.com&debug=1', {}, defaultTestEnv)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')

    const body = await response.json() as {
      mode: string;
      destination: {
        original: string;
        resolved: string;
        type: string;
        source: string;
      };
      tracking_params: Record<string, string>;
      message: string;
    }

    expect(body.mode).toBe('debug')
    expect(body.destination.resolved).toBe('https://example.com')
    expect(body.message).toBe('Debug mode - no redirect performed')
  })

  it('should handle complex valid URLs', async () => {
    const complexUrl = 'https://subdomain.example.com:8080/path/to/resource?param1=value1&param2=value2#fragment'
    const response = await app.request(`/r?to=${encodeURIComponent(complexUrl)}`, {}, defaultTestEnv)

    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe(complexUrl)
  })

  it('should reject URLs with invalid characters that parse as URLs', async () => {
    const response = await app.request('/r?to=http://[invalid-ipv6]', {}, defaultTestEnv)

    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code?: string }
    // Error message contains validation details, just check it starts with expected prefix
    expect(body.error).toContain('Invalid URL')
  })

  it('should maintain consistent error response format', async () => {
    const testCases = [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
      'ftp://example.com',
      '//example.com',
      '',
      '   '
    ]

    for (const testCase of testCases) {
      const response = await app.request(`/r?to=${encodeURIComponent(testCase)}`, {}, defaultTestEnv)

      expect(response.status).toBe(400)
      expect(response.headers.get('Content-Type')).toBe('application/json')

      const body = await response.json() as { error: string; code?: string }

      // Empty/whitespace cases return different error message
      if (testCase.trim() === '') {
        expect(body.error).toBe('Missing required parameter: to')
      } else {
        expect(body.error).toBe('Invalid destination format: must be shortcode (alphanumeric) or full URL (http:// or https://)')
      }

      expect(body.error.length).toBeGreaterThan(0)
    }
  })
})
