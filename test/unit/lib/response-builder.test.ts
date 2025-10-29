import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRedirectResponse, createDebugResponse } from '../../../src/lib/response-builder'
import type { DebugInfo } from '../../../src/lib/destination-resolver'

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
});

describe('Debug Response Creation', () => {
  const mockDebugInfo: DebugInfo = {
    original: 'shortcode123',
    resolved: 'https://example.com/resolved-path',
    type: 'temporary',
    source: 'kv',
    shortcode: 'shortcode123'
  };

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create 200 response with JSON content-type', () => {
    const response = createDebugResponse(mockDebugInfo)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should create JSON body with correct structure', async () => {
    const response = createDebugResponse(mockDebugInfo)

    const body = await response.json() as any;
    expect(body.destination.original).toBe(mockDebugInfo.original)
    expect(body.destination.resolved).toBe(mockDebugInfo.resolved)
    expect(body.destination.source).toBe(mockDebugInfo.source)
  })
});