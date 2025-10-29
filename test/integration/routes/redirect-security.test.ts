import { describe, it, expect } from 'vitest'
import app from '../../../src/index'

describe('Redirect Security - Protocol Validation', () => {
  it('should return 400 for javascript: URLs', async () => {
    const response = await app.request('/r?to=javascript:alert(1)')
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Only HTTP/HTTPS URLs allowed')
  })

  it('should return 400 for data: URLs', async () => {
    const response = await app.request('/r?to=data:text/html,<script>alert(1)</script>')
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Only HTTP/HTTPS URLs allowed')
  })

  it('should return 400 for file: URLs', async () => {
    const response = await app.request('/r?to=file:///etc/passwd')
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Only HTTP/HTTPS URLs allowed')
  })

  it('should return 400 for ftp: URLs', async () => {
    const response = await app.request('/r?to=ftp://malicious.com/payload')
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Only HTTP/HTTPS URLs allowed')
  })

  it('should return 400 for protocol-relative URLs', async () => {
    const response = await app.request('/r?to=//evil.com/malware.js')
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Only HTTP/HTTPS URLs allowed')
  })

  it('should return 400 for empty URLs', async () => {
    const response = await app.request('/r?to=')
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Only HTTP/HTTPS URLs allowed')
  })

  it('should return 400 for whitespace-only URLs', async () => {
    const response = await app.request('/r?to=   ')
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Only HTTP/HTTPS URLs allowed')
  })

  it('should return 302 for valid http URLs', async () => {
    const response = await app.request('/r?to=http://example.com')
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('http://example.com')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should return 302 for valid https URLs', async () => {
    const response = await app.request('/r?to=https://example.com/path?query=value')
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://example.com/path?query=value')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should return 200 JSON for valid https URLs with debug mode', async () => {
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
    expect(body.redirect_type).toBe('302')
    expect(body.note).toBe('Debug mode - redirect suppressed')
  })

  it('should handle complex valid URLs', async () => {
    const complexUrl = 'https://subdomain.example.com:8080/path/to/resource?param1=value1&param2=value2#fragment'
    const response = await app.request(`/r?to=${encodeURIComponent(complexUrl)}`)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe(complexUrl)
  })

  it('should reject URLs with invalid characters that parse as URLs', async () => {
    const response = await app.request('/r?to=http://[invalid-ipv6]')
    
    expect(response.status).toBe(400)
    const body = await response.json() as { error: string; code?: string }
    expect(body.error).toBe('Invalid destination URL')
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
      const response = await app.request(`/r?to=${encodeURIComponent(testCase)}`)
      
      expect(response.status).toBe(400)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      
      const body = await response.json() as { error: string; code?: string }
      expect(body.error).toBe('Only HTTP/HTTPS URLs allowed')
      expect(typeof body.error).toBe('string')
      expect(body.error.length).toBeGreaterThan(0)
    }
  })
})
