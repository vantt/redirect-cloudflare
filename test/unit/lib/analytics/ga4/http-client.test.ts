/**
 * GA4 HTTP Client Unit Tests
 *
 * Tests HTTP request implementation, error handling, timeout behavior,
 * and structured logging for GA4 Measurement Protocol integration.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock logger before importing modules that use it
vi.mock('../../../../../src/utils/logger', () => ({
  appLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import { GA4HttpClient } from '../../../../../src/lib/analytics/ga4/http-client'
import { GA4Payload } from '../../../../../src/lib/analytics/ga4/types'
import { createMockEnv } from '../../../../fixtures/env'
import { appLogger } from '../../../../../src/utils/logger'

describe('GA4HttpClient', () => {
  let httpClient: GA4HttpClient
  let validConfig: any

  beforeEach(() => {
    vi.clearAllMocks()

    validConfig = {
      measurementId: 'G-TEST123456',
      apiSecret: 'test-secret-key',
      timeout: 2000
    }

    // Default successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK'
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Constructor and Initialization', () => {
    it('should initialize successfully with valid config', () => {
      expect(() => {
        httpClient = new GA4HttpClient(validConfig)
      }).not.toThrow()

      expect(appLogger.info).toHaveBeenCalledWith('GA4 HTTP client initialized', {
        measurementId: 'G-TEST123456',
        timeout: 2000,
        endpoint: 'https://www.google-analytics.com/mp/collect'
      })
    })

    it('should throw error with missing measurement ID', () => {
      const invalidConfig = { ...validConfig, measurementId: '' }

      expect(() => {
        new GA4HttpClient(invalidConfig)
      }).toThrow('GA4 measurement ID is required')

      expect(appLogger.error).toHaveBeenCalledWith('GA4 HTTP client: measurement ID is required', {
        config: { measurementId: false, apiSecret: true }
      })
    })

    it('should throw error with missing API secret', () => {
      const invalidConfig = { ...validConfig, apiSecret: '' }

      expect(() => {
        new GA4HttpClient(invalidConfig)
      }).toThrow('GA4 API secret is required')

      expect(appLogger.error).toHaveBeenCalledWith('GA4 HTTP client: API secret is required', {
        config: { measurementId: true, apiSecret: false }
      })
    })

    it('should warn about invalid measurement ID format', () => {
      const invalidFormatConfig = { ...validConfig, measurementId: 'INVALID-FORMAT' }

      expect(() => {
        httpClient = new GA4HttpClient(invalidFormatConfig)
      }).not.toThrow()

      expect(appLogger.warn).toHaveBeenCalledWith('GA4 measurement ID may be invalid', {
        measurementId: 'INVALID-FORMAT',
        expectedFormat: 'G-XXXXXXXXXX'
      })
    })
  })

  describe('sendRequest', () => {
    beforeEach(() => {
      httpClient = new GA4HttpClient(validConfig)
    })

    const createValidPayload = (): GA4Payload => ({
      client_id: 'test-client-id-12345',
      events: [
        {
          name: 'redirect_click',
          parameters: {
            campaign_source: 'test',
            link_url: 'https://example.com'
          }
        }
      ]
    })

    it('should send successful HTTP request to GA4', async () => {
      const payload = createValidPayload()

      await httpClient.sendRequest(payload)

      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.google-analytics.com/mp/collect?measurement_id=G-TEST123456&api_secret=test-secret-key',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: expect.any(AbortSignal)
        }
      )

      // Verify success logging
      expect(appLogger.info).toHaveBeenCalledWith('GA4 event sent successfully', {
        eventName: 'redirect_click',
        eventCount: 1,
        clientId: 'test-client-id-12345',
        latencyMs: expect.any(Number),
        payloadSize: expect.any(Number),
        measurementId: 'G-TEST123456'
      })
    })

    it('should handle HTTP error responses', async () => {
      const payload = createValidPayload()

      // Mock HTTP error response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      })

      await httpClient.sendRequest(payload)

      // Should not throw, but should log error
      expect(appLogger.error).toHaveBeenCalledWith('GA4 event delivery failed',
        expect.objectContaining({
        eventName: 'redirect_click',
        errorType: 'HTTPError',
        errorMessage: 'HTTP 400: Bad Request',
        latencyMs: expect.any(Number),
        timeoutMs: 2000,
        measurementId: 'G-TEST123456',
        httpFailure: true
      })
    )
    })

    it('should handle network errors', async () => {
      const payload = createValidPayload()

      // Mock network error
      const networkError = new TypeError('Failed to fetch')
      networkError.name = 'TypeError'
      mockFetch.mockRejectedValue(networkError)

      await httpClient.sendRequest(payload)

      expect(appLogger.error).toHaveBeenCalledWith('GA4 event delivery failed', {
        eventName: 'redirect_click',
        errorType: 'NetworkError',
        errorMessage: 'Failed to fetch',
        latencyMs: expect.any(Number),
        timeoutMs: 2000,
        measurementId: 'G-TEST123456',
        network: true
      })
    })

    it('should handle timeout errors', async () => {
      const payload = createValidPayload()

      // Mock timeout error
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'TimeoutError'
      mockFetch.mockRejectedValue(timeoutError)

      await httpClient.sendRequest(payload)

      expect(appLogger.error).toHaveBeenCalledWith('GA4 event delivery failed', {
        eventName: 'redirect_click',
        errorType: 'TimeoutError',
        errorMessage: 'Request timeout',
        latencyMs: expect.any(Number),
        timeoutMs: 2000,
        measurementId: 'G-TEST123456',
        timeout: true
      })
    })

    it('should handle invalid payload gracefully', async () => {
      const invalidPayload = {
        client_id: '',
        events: []
      } as GA4Payload

      await httpClient.sendRequest(invalidPayload)

      expect(appLogger.error).toHaveBeenCalledWith('GA4 event delivery failed', {
        eventName: 'unknown',
        errorType: 'ValidationError',
        errorMessage: 'Invalid GA4 payload: missing required fields',
        latencyMs: expect.any(Number),
        timeoutMs: 2000,
        measurementId: 'G-TEST123456',
        validation: true
      })
    })

    it('should use custom timeout from config', async () => {
      const configWithCustomTimeout = {
        ...validConfig,
        timeout: 5000
      }
      httpClient = new GA4HttpClient(configWithCustomTimeout)

      const payload = createValidPayload()
      await httpClient.sendRequest(payload)

      // Verify AbortSignal was created with custom timeout
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      )
    })

    it('should use default timeout when not specified in config', () => {
      const configWithoutTimeout = {
        measurementId: 'G-TEST123456',
        apiSecret: 'test-secret-key'
        // no timeout specified
      }

      expect(() => {
        httpClient = new GA4HttpClient(configWithoutTimeout)
      }).not.toThrow()

      expect(appLogger.info).toHaveBeenCalledWith('GA4 HTTP client initialized', {
        measurementId: 'G-TEST123456',
        timeout: 2000, // Should use default
        endpoint: 'https://www.google-analytics.com/mp/collect'
      })
    })
  })

  describe('getConfig', () => {
    beforeEach(() => {
      httpClient = new GA4HttpClient(validConfig)
    })

    it('should return config with masked API secret', () => {
      const config = httpClient.getConfig()

      expect(config).toEqual({
        measurementId: 'G-TEST123456',
        apiSecret: '***',
        timeout: 2000
      })
    })
  })

  describe('Performance and Concurrency', () => {
    it('should handle multiple concurrent requests', async () => {
      // Clear any previous logs
      vi.clearAllMocks()

      httpClient = new GA4HttpClient(validConfig)
      const payload1 = {
        client_id: 'client-1',
        events: [{ name: 'event1' }]
      }
      const payload2 = {
        client_id: 'client-2',
        events: [{ name: 'event2' }]
      }

      // Both requests should complete successfully
      await Promise.all([
        httpClient.sendRequest(payload1),
        httpClient.sendRequest(payload2)
      ])

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(appLogger.info).toHaveBeenCalledTimes(3) // 1 initialization + 2 success logs
    })

    it('should complete requests within reasonable time', async () => {
      const payload = {
        client_id: 'test-client',
        events: [{ name: 'test_event' }]
      }

      const startTime = Date.now()
      await httpClient.sendRequest(payload)
      const duration = Date.now() - startTime

      // Should complete quickly (in test environment)
      expect(duration).toBeLessThan(100)
    })
  })
})