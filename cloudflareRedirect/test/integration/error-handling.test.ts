import { describe, it, expect, vi, beforeEach } from 'vitest'
import app from '../../src/index'
import { RedirectError } from '../../src/lib/errors'
import { Hono } from 'hono'

// Mock console.error to test logging
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('Global Error Handler', () => {
  beforeEach(() => {
    consoleErrorSpy.mockClear()
  })

  it('should handle RedirectError with 400 status and proper JSON format', async () => {
    const res = await app.request('/r')

    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    
    const body = await res.json()
    expect(body).toEqual({
      error: 'Missing required parameter: to',
      code: 'MISSING_PARAM'
    })

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error occurred:',
      expect.objectContaining({
        message: 'Missing required parameter: to',
        statusCode: 400,
        code: 'MISSING_PARAM'
      })
    )
  })

  it('should handle RedirectError with custom status code', async () => {
    const res = await app.request('/r?to=%E0%A4%A') // Invalid URL encoding

    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    
    const body = await res.json()
    expect(body).toEqual({
      error: 'Invalid URL encoding',
      code: 'INVALID_ENCODING'
    })
  })

  it('should handle unknown errors with 500 status', async () => {
    // Create a test route that throws a generic error
    const testApp = new Hono()
    testApp.onError((err, c) => {
      // Use the same error handler logic as the main app
      if (err instanceof RedirectError) {
        return c.json({ error: err.message, code: err.code }, { status: err.statusCode as any })
      }
      return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
    })
    testApp.get('/test-error', () => {
      throw new Error('Unexpected error')
    })

    const res = await testApp.request('/test-error')

    expect(res.status).toBe(500)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    
    const body = await res.json()
    expect(body).toEqual({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })

    // Verify error was logged with full details
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error occurred:',
      expect.objectContaining({
        message: 'Unexpected error',
        statusCode: 500,
        code: 'INTERNAL_ERROR'
      })
    )
  })

  it('should maintain consistent error response format across endpoints', async () => {
    // Test redirect endpoint error
    const redirectRes = await app.request('/r')
    const redirectBody: any = await redirectRes.json()

    // Test error format structure
    expect(redirectBody).toHaveProperty('error')
    expect(redirectBody).toHaveProperty('code')
    expect(typeof redirectBody.error).toBe('string')
    expect(typeof redirectBody.code).toBe('string')

    // Test that the format is consistent (same structure)
    const expectedFormat = {
      error: expect.any(String),
      code: expect.any(String)
    }
    expect(redirectBody).toMatchObject(expectedFormat)
  })
})