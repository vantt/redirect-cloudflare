import { describe, it, expect } from 'vitest'
import app from '../../src/index'

describe('/r endpoint', () => {
  it('should redirect to valid URL with 302 status', async () => {
    const destination = 'https://example.com'
    const res = await app.request(`/r?to=${encodeURIComponent(destination)}`)

    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe(destination)
    expect(res.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should return 400 error when "to" parameter is missing', async () => {
    const res = await app.request('/r')

    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    
    const body = await res.json()
    expect(body).toEqual({ 
      error: 'Missing required parameter: to',
      code: 'MISSING_PARAM'
    })
  })

  it('should handle URL-encoded destinations correctly', async () => {
    const destination = 'https://example.com/path with spaces?param=value&special=char'
    const encodedDestination = encodeURIComponent(destination)
    
    const res = await app.request(`/r?to=${encodedDestination}`)

    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe(destination)
  })

  it('should return 400 error for malformed URL encoding', async () => {
    const res = await app.request('/r?to=%E0%A4%A')

    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    
    const body = await res.json()
    expect(body).toEqual({ 
      error: 'Invalid URL encoding',
      code: 'INVALID_ENCODING'
    })
  })
})