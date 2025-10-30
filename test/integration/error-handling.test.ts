import { describe, it, expect, vi, beforeEach } from 'vitest'
import app from '../../src/index'
import { defaultTestEnv } from '../fixtures/env'

// Mock console.error to test logging
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('Global Error Handler', () => {
  beforeEach(() => {
    consoleErrorSpy.mockClear()
  })

  it('should handle RedirectError with 400 status and proper JSON format', async () => {
    const res = await app.request('/r', {}, defaultTestEnv)

    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    
    const body = await res.json()
       
    expect(body).toMatchObject({
      error: 'Missing required parameter: to',
      code: 'MISSING_PARAM'
    })

    // Verify error was logged - check if any call contains the expected error data
    expect(consoleErrorSpy).toHaveBeenCalled()
    const loggedCalls = consoleErrorSpy.mock.calls
    const hasExpectedError = loggedCalls.some(call => 
      JSON.stringify(call[0]).includes('Missing required parameter: to') &&
      JSON.stringify(call[0]).includes('MISSING_PARAM')
    )
    expect(hasExpectedError).toBe(true)
  })

  it('should handle RedirectError with custom status code', async () => {
    const res = await app.request('/r?to=%E0%A4%A', {}, defaultTestEnv) // Invalid URL encoding
    
    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    
    const body = await res.json()    
    expect(body).toMatchObject({
      error: 'Invalid URL encoding',
      code: 'INVALID_ENCODING'
    })
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
