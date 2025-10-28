import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRedirectResponse, createDebugResponse } from '../../../src/lib/response-builder'

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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create 200 response with JSON content-type', () => {
    const destination = 'https://example.com'
    const response = createDebugResponse(destination)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should create JSON body with correct structure', async () => {
    const destination = 'https://example.com'
    const response = createDebugResponse(destination)

    const bodyText = await response.text()
    const body = JSON.parse(bodyText)
    expect(body).toHaveProperty('destination', destination)
    expect(body).toHaveProperty('tracking_params')
    expect(body).toHaveProperty('redirect_type', '302')
    expect(body).toHaveProperty('note', 'Debug mode - redirect suppressed')
  })

  it('should extract tracking parameters from destination', async () => {
    const destination = 'https://example.com?utm_source=test&utm_medium=email&utm_campaign=launch'
    const response = createDebugResponse(destination)

    const bodyText = await response.text()
    const body = JSON.parse(bodyText)
    expect(body.tracking_params).toEqual({
      utm_source: 'test',
      utm_medium: 'email',
      utm_campaign: 'launch'
    })
  })

  it('should handle destination with no tracking params', async () => {
    const destination = 'https://example.com'
    const response = createDebugResponse(destination)

    const bodyText = await response.text()
    const body = JSON.parse(bodyText)
    expect(body.tracking_params).toEqual({})
  })

  it('should format JSON response with pretty printing', async () => {
    const destination = 'https://example.com'
    const response = createDebugResponse(destination)

    // Should be formatted JSON (not minified)
    const bodyText = await response.text()
    expect(bodyText).toContain('  "destination"')
    expect(bodyText).toContain('  "tracking_params"')
  })

  it('should handle complex tracking parameters', async () => {
    const destination = 'https://example.com?ref=affiliate&xptdk=shopee123&utm_source=affiliate&utm_campaign=electronics'
    const response = createDebugResponse(destination)

    const bodyText = await response.text()
    const body = JSON.parse(bodyText)
    expect(body.tracking_params).toEqual({
      ref: 'affiliate',
      xptdk: 'shopee123',
      utm_source: 'affiliate',
      utm_campaign: 'electronics'
    })
  })
})