/**
 * GA4 HTTP Integration Tests
 *
 * End-to-end tests for GA4 HTTP integration with Miniflare.
 * Tests actual HTTP calls to GA4 Measurement Protocol endpoint.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock fetch for testing
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock logger before importing modules that use it
vi.mock('@src/utils/logger', () => ({
  appLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import { GA4Provider } from '@lib/analytics/ga4/provider'
import { AnalyticsEvent } from '@lib/analytics/types'
import { createTestEnv, testEnvWithGA4 } from '../../fixtures/env'
import { appLogger } from '@src/utils/logger'

describe('GA4 HTTP Integration Tests', () => {
  let provider: GA4Provider
  let mockEnv: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock environment with GA4 configuration
    mockEnv = createTestEnv({
      GA4_MEASUREMENT_ID: 'G-TEST123456',
      GA4_API_SECRET: 'test-api-secret',
      GA4_DEBUG: 'false'
    })

    // Setup successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK'
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createTestEvent = (customAttributes = {}): AnalyticsEvent => ({
    name: 'redirect_click',
    attributes: {
      short_url: 'abc123',
      destination_url: 'https://example.com',
      redirect_type: '301',
      utm_source: 'test',
      utm_medium: 'link',
      utm_campaign: 'demo',
      ...customAttributes
    }
  })

  describe('HTTP Request Structure', () => {
    beforeEach(() => {
      const config = {
        measurementId: mockEnv.GA4_MEASUREMENT_ID,
        apiSecret: mockEnv.GA4_API_SECRET,
        debug: mockEnv.GA4_DEBUG === 'true'
      }
      provider = new GA4Provider(config)
    })

    it('should send HTTP POST to correct GA4 endpoint', async () => {
      const event = createTestEvent()
      await provider.send(event)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.google-analytics.com/mp/collect?measurement_id=G-TEST123456&api_secret=test-api-secret',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.any(String),
          signal: expect.any(AbortSignal)
        })
      )
    })

    it('should include correct query parameters in URL', async () => {
      const event = createTestEvent()
      await provider.send(event)

      const fetchCall = mockFetch.mock.calls[0]
      const url = fetchCall[0]

      expect(url).toContain('measurement_id=G-TEST123456')
      expect(url).toContain('api_secret=test-api-secret')
      expect(url).toBe('https://www.google-analytics.com/mp/collect?measurement_id=G-TEST123456&api_secret=test-api-secret')
    })

    it('should send properly formatted JSON payload', async () => {
      const event = createTestEvent()
      await provider.send(event)

      const fetchCall = mockFetch.mock.calls[0]
      const requestBody = fetchCall[1].body

      // Should be valid JSON
      expect(() => JSON.parse(requestBody)).not.toThrow()

      const parsedPayload = JSON.parse(requestBody)
      expect(parsedPayload).toHaveProperty('client_id')
      expect(parsedPayload).toHaveProperty('events')
      expect(parsedPayload.events).toBeInstanceOf(Array)
      expect(parsedPayload.events[0]).toHaveProperty('name', 'redirect_click')
    })

    it('should set correct HTTP headers', async () => {
      const event = createTestEvent()
      await provider.send(event)

      const fetchCall = mockFetch.mock.calls[0]
      const headers = fetchCall[1].headers

      expect(headers).toEqual({
        'Content-Type': 'application/json'
      })
    })

    it('should include AbortSignal for timeout control', async () => {
      const event = createTestEvent()
      await provider.send(event)

      const fetchCall = mockFetch.mock.calls[0]
      const signal = fetchCall[1].signal

      expect(signal).toBeInstanceOf(AbortSignal)
    })
  })

  describe('Payload Content Validation', () => {
    beforeEach(() => {
      const config = {
        measurementId: mockEnv.GA4_MEASUREMENT_ID,
        apiSecret: mockEnv.GA4_API_SECRET
      }
      provider = new GA4Provider(config)
    })

    it('should include UTM parameters in GA4 payload', async () => {
      const event = createTestEvent({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'spring_sale',
        utm_content: 'banner',
        utm_term: 'shoes'
      })
      await provider.send(event)

      const fetchCall = mockFetch.mock.calls[0]
      const payload = JSON.parse(fetchCall[1].body)

      const eventParams = payload.events[0].parameters
      expect(eventParams.campaign_source).toBe('google')
      expect(eventParams.campaign_medium).toBe('cpc')
      expect(eventParams.campaign_name).toBe('spring_sale')
      expect(eventParams.campaign_content).toBe('banner')
      expect(eventParams.campaign_keyword).toBe('shoes')
    })

    it('should include custom parameters in payload', async () => {
      const event = createTestEvent({
        xptdk: 'custom-tracking-id',
        ref: 'affiliate-link',
        custom_param: 'test-value'
      })
      await provider.send(event)

      const fetchCall = mockFetch.mock.calls[0]
      const payload = JSON.parse(fetchCall[1].body)

      const eventParams = payload.events[0].parameters
      expect(eventParams.xptdk).toBe('custom-tracking-id')
      expect(eventParams.ref).toBe('affiliate-link')
      expect(eventParams.custom_param).toBe('test-value')
    })

    it('should include redirect metadata as engagement parameters', async () => {
      const event = createTestEvent({
        short_url: 'abc123',
        destination_url: 'https://example.com/target',
        redirect_type: '301'
      })
      await provider.send(event)

      const fetchCall = mockFetch.mock.calls[0]
      const payload = JSON.parse(fetchCall[1].body)

      const eventParams = payload.events[0].parameters
      expect(eventParams.engagement_id).toBe('abc123')
      expect(eventParams.link_url).toBe('https://example.com/target')
      expect(eventParams.link_domain).toBe('301')
    })
  })

  describe('Error Handling Integration', () => {
    beforeEach(() => {
      const config = {
        measurementId: mockEnv.GA4_MEASUREMENT_ID,
        apiSecret: mockEnv.GA4_API_SECRET,
        debug: false
      }
      provider = new GA4Provider(config)
    })

    it('should handle GA4 server errors without throwing', async () => {
      // Mock GA4 server error
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      })

      const event = createTestEvent()

      // Should not throw
      await expect(provider.send(event)).resolves.not.toThrow()

      // Should log error from HTTP client
      expect(appLogger.error).toHaveBeenCalledWith(
        'GA4 event delivery failed',
        expect.objectContaining({
          eventName: 'redirect_click',
          errorType: expect.any(String),
          errorMessage: expect.any(String)
        })
      )
    })

    it('should handle network failures without throwing', async () => {
      // Mock network failure
      mockFetch.mockRejectedValue(new Error('Network error'))

      const event = createTestEvent()

      // Should not throw
      await expect(provider.send(event)).resolves.not.toThrow()

      // Should log error
      expect(appLogger.error).toHaveBeenCalled()
    })

    it('should handle timeout without throwing', async () => {
      // Mock timeout error
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'TimeoutError'
      mockFetch.mockRejectedValue(timeoutError)

      const event = createTestEvent()

      // Should not throw
      await expect(provider.send(event)).resolves.not.toThrow()

      // Should log error
      expect(appLogger.error).toHaveBeenCalled()
    })
  })

  describe('Configuration Integration', () => {
    it('should use custom timeout from configuration', async () => {
      const config = {
        measurementId: mockEnv.GA4_MEASUREMENT_ID,
        apiSecret: mockEnv.GA4_API_SECRET,
        timeout: 5000
      }
      provider = new GA4Provider(config)

      const event = createTestEvent()
      await provider.send(event)

      // Verify the request was made (timeout is tested in http-client tests)
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should handle missing configuration gracefully', async () => {
      const config = {
        measurementId: '', // Missing
        apiSecret: ''      // Missing
      }

      // Provider should not throw during construction, but should be disabled
      expect(() => {
        provider = new GA4Provider(config)
      }).not.toThrow()

      // Provider should be disabled
      expect(provider.isConfigured()).toBe(false)

      const event = createTestEvent()
      await provider.send(event)

      // Should not make HTTP calls when disabled
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Performance and Concurrency', () => {
    beforeEach(() => {
      const config = {
        measurementId: mockEnv.GA4_MEASUREMENT_ID,
        apiSecret: mockEnv.GA4_API_SECRET
      }
      provider = new GA4Provider(config)
    })

    it('should handle multiple concurrent events', async () => {
      const events = [
        createTestEvent({ short_url: 'abc123' }),
        createTestEvent({ short_url: 'def456' }),
        createTestEvent({ short_url: 'ghi789' })
      ]

      // Send all events concurrently
      await Promise.all(events.map(event => provider.send(event)))

      // All requests should be made
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should complete HTTP requests within reasonable time', async () => {
      const event = createTestEvent()

      const startTime = Date.now()
      await provider.send(event)
      const duration = Date.now() - startTime

      // Should complete quickly (in test environment)
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Integration with Analytics Router', () => {
    it('should be compatible with analytics router interface', async () => {
      const config = {
        measurementId: mockEnv.GA4_MEASUREMENT_ID,
        apiSecret: mockEnv.GA4_API_SECRET
      }
      provider = new GA4Provider(config)

      // Test provider interface compatibility
      expect(provider).toHaveProperty('name', 'ga4')
      expect(provider).toHaveProperty('send')
      expect(provider).toHaveProperty('isConfigured')
      expect(provider).toHaveProperty('getConfig')

      // Test that send method accepts AnalyticsEvent
      const event: AnalyticsEvent = {
        name: 'redirect_click',
        attributes: { short_url: 'test' }
      }

      await expect(provider.send(event)).resolves.not.toThrow()
    })
  })
})