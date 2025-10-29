import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRedirect } from '../../../src/lib/kv-store'
import { defaultTestEnv } from '../../fixtures/env'
import app from '../../../src/index'

vi.mock('../../../src/lib/kv-store')

describe('/r endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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
    
    const body = await res.json() as { error: string };
    expect(body).toHaveProperty('error', 'Missing required parameter: to')
  })

  it('should handle URL-encoded destinations correctly', async () => {
    const destination = 'https://example.com/path with spaces?param=value&special=char'
    const encodedDestination = encodeURIComponent(destination)
    
    const res = await app.request(`/r?to=${encodedDestination}`, {}, defaultTestEnv)

    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe(destination)
  })

  it('should return 400 error for malformed URL encoding', async () => {
    const res = await app.request('/r?to=%E0%A4%A', {}, defaultTestEnv)
    
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(res.status).toBe(400)
    
    const body = await res.json() as { error: string };
    expect(body).toHaveProperty('error')
  })

  it('should redirect via shortcode from KV', async () => {
    vi.mocked(getRedirect).mockResolvedValue({ url: 'https://example.com/from-kv', type: 'temporary' })

    const res = await app.request('/r?to=kvshortcode', {}, defaultTestEnv)

    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('https://example.com/from-kv')
  })

  it('should return 404 for non-existent shortcode', async () => {
    vi.mocked(getRedirect).mockResolvedValue(null)

    const res = await app.request('/r?to=notfound', {}, defaultTestEnv)

    expect(res.status).toBe(404)
    const body = await res.json() as { code: string };
    expect(body.code).toBe('SHORTCODE_NOT_FOUND')
  })

  it('should return 400 for invalid destination format', async () => {
    const res = await app.request('/r?to=invalid format', {}, defaultTestEnv)

    expect(res.status).toBe(400)
    const body = await res.json() as { code: string };
    expect(body.code).toBe('INVALID_DESTINATION_FORMAT')
  })

  it('should show debug info for shortcode', async () => {
    vi.mocked(getRedirect).mockResolvedValue({ url: 'https://example.com/debug-kv', type: 'permanent' })

    const res = await app.request('/r?to=debugshortcode&debug=1', {}, defaultTestEnv)

    expect(res.status).toBe(200)
    const body = await res.json() as { destination: { original: string, resolved: string, source: string } };
    expect(body.destination.original).toBe('debugshortcode')
    expect(body.destination.resolved).toBe('https://example.com/debug-kv')
    expect(body.destination.source).toBe('kv')
  })

  it('should show debug info for direct URL', async () => {
    const res = await app.request('/r?to=https://example.com/direct-debug&debug=1', {}, defaultTestEnv)

    expect(res.status).toBe(200)
    const body = await res.json() as { destination: { original: string, resolved: string, source: string } };
    expect(body.destination.original).toBe('https://example.com/direct-debug')
    expect(body.destination.resolved).toBe('https://example.com/direct-debug')
    expect(body.destination.source).toBe('direct')
  })
})
