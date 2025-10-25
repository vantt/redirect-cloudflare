import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { getRedirectQuery, createRedirectResponse, createErrorResponse } from '../../src/routes/redirect'

describe('/r endpoint', () => {
  it('should redirect to valid URL with 302 status', async () => {
    const app = new Hono()
    app.get('/r', (c) => {
      const destination = getRedirectQuery(c.req)
      
      if (!destination) {
        return createErrorResponse('Missing required parameter: to', 400)
      }
      
      return createRedirectResponse(destination)
    })

    const destination = 'https://example.com'
    const res = await app.request(`/r?to=${encodeURIComponent(destination)}`)

    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe(destination)
    expect(res.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should return 400 error when "to" parameter is missing', async () => {
    const app = new Hono()
    app.get('/r', (c) => {
      const destination = getRedirectQuery(c.req)
      
      if (!destination) {
        return createErrorResponse('Missing required parameter: to', 400)
      }
      
      return createRedirectResponse(destination)
    })

    const res = await app.request('/r')

    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    
    const body = await res.json()
    expect(body).toEqual({ error: 'Missing required parameter: to' })
  })

  it('should handle URL-encoded destinations correctly', async () => {
    const app = new Hono()
    app.get('/r', (c) => {
      const destination = getRedirectQuery(c.req)
      
      if (!destination) {
        return createErrorResponse('Missing required parameter: to', 400)
      }
      
      return createRedirectResponse(destination)
    })

    const destination = 'https://example.com/path with spaces?param=value&special=char'
    const encodedDestination = encodeURIComponent(destination)
    
    const res = await app.request(`/r?to=${encodedDestination}`)

    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe(destination)
  })

  it('should return 400 error for malformed URL encoding', async () => {
    const app = new Hono()
    app.get('/r', (c) => {
      const destination = getRedirectQuery(c.req)
      
      if (!destination) {
        return createErrorResponse('Missing required parameter: to', 400)
      }
      
      return createRedirectResponse(destination)
    })

    const res = await app.request('/r?to=%E0%A4%A')

    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })
})