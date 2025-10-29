import { describe, it, expect, beforeEach, vi } from 'vitest'
import app from '../../src/index'
import { sendGA4Event } from '../../src/lib/analytics/providers/ga4'
import { createMockEnv } from '../helpers/config'

// Mock fetch for testing
vi.stubGlobal('fetch', vi.fn())

describe('sendGA4Event Integration Tests', () => {
  let mockEnv: any

  beforeEach(() => {
    mockEnv = createMockEnv({
      GA4_MEASUREMENT_ID: 'G-TEST123',
      GA4_API_SECRET: 'test-secret-123'
    })

    // Reset all mocks
    vi.clearAllMocks()
  })

  it('should send POST request to GA4 collect endpoint', async () => {
    const testPayload = {
      client_id: 'test-client-123',
      events: [{
        name: 'redirect_click',
        params: { utm_source: 'test', utm_medium: 'test' }
      }]
    }

    // Mock successful fetch response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ measurement_id: 'G-TEST123' })
    })

    const result = await sendGA4Event(testPayload, 'test-secret-123', 'G-TEST123')

    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.google-analytics.com/mp/collect?measurement_id=G-TEST123&api_secret=test-secret-123',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'cloudflareRedirect/1.0.0'
        },
        body: JSON.stringify(testPayload),
        signal: expect.any(AbortSignal)
      })
    )

    // Verify return value
    expect(result).toEqual({ measurement_id: 'G-TEST123' })
  })

  it('should handle fetch errors gracefully', async () => {
    const testPayload = {
      client_id: 'test-client-123',
      events: [{ name: 'redirect_click', params: {} }]
    }

    // Mock failed fetch response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('Fetch failed'))
    })

    const result = await sendGA4Event(testPayload, 'test-secret-123', 'G-TEST123')

    // Verify error was caught and logged
    expect(result).toEqual({ 
      success: false, 
      error: 'GA4 request failed: 500 Internal Server Error', 
      errorName: 'Error' 
    })
  })

  it('should handle timeout correctly', async () => {
    const testPayload = {
      client_id: 'test-client-123',
      events: [{ name: 'redirect_click', params: {} }]
    }

    // Mock timeout error
    const abortError = new Error('Request timeout')
    abortError.name = 'AbortError'
    global.fetch = vi.fn().mockRejectedValueOnce(abortError)

    const result = await sendGA4Event(testPayload, 'test-secret-123', 'G-TEST123')

    // Verify timeout was handled
    expect(result).toEqual({ 
      success: false, 
      error: 'Request timeout', 
      errorName: 'AbortError' 
    })
  })

  it('should not throw on any errors', async () => {
    const testPayload = {
      client_id: 'test-client-123',
      events: [{ name: 'redirect_click', params: {} }]
    }

    // Mock any error
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Unexpected error'))

    // Function should not throw, but return error response
    const result = await sendGA4Event(testPayload, 'test-secret-123', 'G-TEST123')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should include correct request headers', async () => {
    const testPayload = {
      client_id: 'test-client-123',
      events: [{ name: 'redirect_click', params: {} }]
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ test: 'ok' })
    })

    await sendGA4Event(testPayload, 'test-secret-123', 'G-TEST123')

    const call = global.fetch.mock.calls[0]
    expect(call[1].headers).toEqual({
      'Content-Type': 'application/json',
      'User-Agent': 'cloudflareRedirect/1.0.0'
    })
  })

  it('should use 2-second timeout', async () => {
    const testPayload = {
      client_id: 'test-client-123',
      events: [{ name: 'redirect_click', params: {} }]
    }

    let controller: AbortController | null = null

    // Capture AbortController from setTimeout
    const originalSetTimeout = global.setTimeout
    global.setTimeout = vi.fn((callback, delay) => {
      controller = new AbortController()
      // Simulate immediate callback for testing
      callback()
      return 12345 as any // Mock setTimeout ID
    })

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ test: 'ok' })
    })

    await sendGA4Event(testPayload, 'test-secret-123', 'G-TEST123')

    // Verify AbortController was used
    const call = global.fetch.mock.calls[0]
    expect(call[1].signal).toBeInstanceOf(AbortSignal)
    expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000)

    // Restore original setTimeout
    global.setTimeout = originalSetTimeout
  })
})
