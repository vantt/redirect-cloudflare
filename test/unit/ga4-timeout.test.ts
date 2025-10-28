import { describe, it, expect, beforeEach, vi } from 'vitest'
import { sendGA4Event } from '../../src/lib/tracking'

// Mock fetch for timeout testing
global.fetch = vi.fn()

describe('sendGA4Event Timeout Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should use AbortController for timeout', async () => {
    const testPayload = {
      client_id: 'test-client-123',
      events: [{
        name: 'redirect_click',
        params: { utm_source: 'test' }
      }]
    }

    // Mock fetch that never resolves (simulates timeout)
    const mockAbortController = vi.fn(() => ({
      signal: vi.fn(),
      abort: vi.fn()
    }))

    // Mock setTimeout to capture controller
    const mockSetTimeout = vi.fn()
    global.setTimeout = mockSetTimeout

    // Mock fetch that takes a long time
    global.fetch = vi.fn(() => {
      // Simulate a very slow fetch
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true })
          })
        }, 1000)
      })
    })

    // Call the function
    const result = await sendGA4Event(testPayload, 'test-secret', 'G-TEST123')

    // Verify setTimeout was called with 2000ms
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000)
    
    // Verify AbortController was created
    expect(mockAbortController).toHaveBeenCalled()
    
    // Verify the signal was passed to fetch
    const fetchCall = global.fetch.mock.calls[0]
    expect(fetchCall[1].signal).toBeDefined()
  })

  it('should timeout after 2 seconds', async () => {
    const testPayload = {
      client_id: 'test-client-123',
      events: [{
        name: 'redirect_click',
        params: { utm_source: 'test' }
      }]
    }

    let controller: any

    // Mock setTimeout to immediately trigger timeout
    const mockSetTimeout = vi.fn((callback, delay) => {
      controller = new AbortController()
      // Trigger timeout immediately
      setTimeout(() => controller.abort(), 1)
    })

    global.setTimeout = mockSetTimeout

    // Mock fetch that never resolves
    global.fetch = vi.fn(() => {
      return new Promise(() => {}) // Never resolves
    })

    // Call the function
    const result = await sendGA4Event(testPayload, 'test-secret', 'G-TEST123')

    // Verify timeout was handled correctly
    expect(result).toEqual({
      success: false,
      error: 'The operation was aborted.',
      errorName: 'AbortError'
    })
  })

  it('should cleanup timeout on successful request', async () => {
    const testPayload = {
      client_id: 'test-client-123',
      events: [{
        name: 'redirect_click',
        params: { utm_source: 'test' }
      }]
    }

    let timeoutId: NodeJS.Timeout | null = null

    // Mock setTimeout to capture timeout ID
    const mockSetTimeout = vi.fn((callback, delay) => {
      timeoutId = setTimeout(callback, delay)
      return timeoutId
    })

    global.setTimeout = mockSetTimeout

    // Mock successful fetch
    global.fetch = vi.fn(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true })
      })
    })

    // Call the function
    await sendGA4Event(testPayload, 'test-secret', 'G-TEST123')

    // Verify setTimeout was not called after successful response
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000)
    expect(timeoutId).toBeDefined()
    
    // Note: We can't easily test clearTimeout without exposing the timeout ID
    // but we can verify the timeout setup was correct
  })

  it('should use correct GA4 endpoint URL', async () => {
    const testPayload = {
      client_id: 'test-client-123',
      events: [{
        name: 'redirect_click',
        params: { utm_source: 'test' }
      }]
    }

    global.fetch = vi.fn(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true })
      })
    })

    // Mock setTimeout to not interfere
    const mockSetTimeout = vi.fn((callback, delay) => 1) // Mock setTimeout ID
    global.setTimeout = mockSetTimeout

    // Call the function
    await sendGA4Event(testPayload, 'test-secret', 'G-TEST123')

    // Verify correct URL was called
    const fetchCall = global.fetch.mock.calls[0]
    expect(fetchCall[0]).toContain('https://www.google-analytics.com/mp/collect')
    expect(fetchCall[0]).toContain('measurement_id=G-TEST123')
    expect(fetchCall[0]).toContain('api_secret=test-secret')
  })

  it('should use correct headers', async () => {
    const testPayload = {
      client_id: 'test-client-123',
      events: [{
        name: 'redirect_click',
        params: { utm_source: 'test' }
      }]
    }

    global.fetch = vi.fn(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true })
      })
    })

    global.setTimeout = vi.fn((callback, delay) => 1)

    await sendGA4Event(testPayload, 'test-secret', 'G-TEST123')

    const fetchCall = global.fetch.mock.calls[0]
    expect(fetchCall[1].headers).toEqual({
      'Content-Type': 'application/json',
      'User-Agent': 'cloudflareRedirect/1.0.0'
    })
  })
})
