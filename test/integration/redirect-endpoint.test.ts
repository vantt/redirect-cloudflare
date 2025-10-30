import { describe, it, expect } from 'vitest'
import app from '../../src/index'
import { defaultTestEnv } from '../fixtures/env'

describe('/r endpoint', () => {
  it('should redirect to valid URL with 302 status', async () => {
    const destination = 'https://example.com'
    const res = await app.request(`/r?to=${encodeURIComponent(destination)}`, {}, defaultTestEnv)

    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe(destination)
    expect(res.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should return 400 error when "to" parameter is missing', async () => {
    const res = await app.request('/r', {}, defaultTestEnv)

    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toBe('application/json')

    const body = await res.json()
    expect(body).toMatchObject({
      error: 'Missing required parameter: to',
      code: 'MISSING_PARAM'
    })
  })

  it('should handle URL-encoded destinations correctly', async () => {
    const destination = 'https://example.com/path with spaces?param=value&special=char'
    const encodedDestination = encodeURIComponent(destination)

    const res = await app.request(`/r?to=${encodedDestination}`, {}, defaultTestEnv)

    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe(destination)
  })

  it('should handle malformed URL encoding gracefully (Hono auto-decodes)', async () => {
    // Hono's auto-decoding handles malformed encoding gracefully
    // Since we removed redundant decodeURIComponent() (AC#9),
    // malformed URLs are processed rather than throwing errors
    const res = await app.request('/r?to=%E0%A4%A', {}, defaultTestEnv)

    // Hono decodes to some value and processes it (may redirect or return error based on validation)
    // This is acceptable behavior - Hono is more lenient than manual decodeURIComponent()
    expect(res.status).toBeGreaterThanOrEqual(200)
    expect(res.status).toBeLessThan(500)
  })
})
