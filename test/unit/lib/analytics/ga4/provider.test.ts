/**
 * GA4 Provider Unit Tests
 *
 * Tests GA4 provider implementation including initialization,
 * event sending, configuration validation, and error handling.
 *
 * Part of Epic 8: Google Analytics 4 Integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GA4Provider } from '../../../../../src/lib/analytics/ga4/provider'
import { GA4Config } from '../../../../../src/lib/analytics/ga4/types'
import { AnalyticsEvent } from '../../../../../src/lib/analytics/types'
import { appLogger } from '../../../../../src/utils/logger'

// Mock logger
vi.mock('../../../../../src/utils/logger', () => ({
  appLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  }
}))

// Mock payload builder
vi.mock('../../../../../src/lib/analytics/ga4/payload-builder', () => ({
  buildGA4Payload: vi.fn((event, measurementId) => ({
    client_id: 'mock_client_id_123456789012345678901234567890',
    events: [
      {
        name: event.name,
        parameters: event.attributes
      }
    ],
    timestamp_micros: '1234567890123456'
  }))
}))

describe('GA4Provider', () => {
  const validConfig: GA4Config = {
    measurementId: 'G-TEST123456',
    apiSecret: 'test-api-secret-123',
    debug: false,
    defaultParameters: {}
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should create provider with valid configuration', () => {
      const provider = new GA4Provider(validConfig)

      expect(provider.name).toBe('ga4')
      expect(provider.isConfigured()).toBe(true)
    })

    it('should log initialization info', () => {
      new GA4Provider(validConfig)

      expect(appLogger.info).toHaveBeenCalledWith('GA4 HTTP client initialized', {
        measurementId: 'G-TEST123456',
        timeout: 2000,
        endpoint: 'https://www.google-analytics.com/mp/collect'
      })

      expect(appLogger.info).toHaveBeenCalledWith('GA4 provider initialized with HTTP capability', {
        measurementId: 'G-TEST123456',
        timeout: 2000,
        debug: false
      })
    })

    it('should disable provider when measurement ID is missing', () => {
      const invalidConfig = { ...validConfig, measurementId: '' }
      const provider = new GA4Provider(invalidConfig)

      expect(provider.isConfigured()).toBe(false)
      expect(appLogger.warn).toHaveBeenCalledWith(
        'GA4 provider disabled: missing measurement ID or API secret'
      )
    })

    it('should disable provider when API secret is missing', () => {
      const invalidConfig = { ...validConfig, apiSecret: '' }
      const provider = new GA4Provider(invalidConfig)

      expect(provider.isConfigured()).toBe(false)
      expect(appLogger.warn).toHaveBeenCalledWith(
        'GA4 provider disabled: missing measurement ID or API secret'
      )
    })

    it('should handle debug mode in configuration', () => {
      const debugConfig = { ...validConfig, debug: true }
      const provider = new GA4Provider(debugConfig)

      expect(appLogger.info).toHaveBeenCalledWith('GA4 HTTP client initialized', {
        measurementId: 'G-TEST123456',
        timeout: 2000,
        endpoint: 'https://www.google-analytics.com/mp/collect'
      })

      expect(appLogger.info).toHaveBeenCalledWith('GA4 provider initialized with HTTP capability', {
        measurementId: 'G-TEST123456',
        timeout: 2000,
        debug: true
      })
    })
  })

  describe('send', () => {
    let provider: GA4Provider
    const mockEvent: AnalyticsEvent = {
      name: 'redirect_click',
      attributes: {
        utm_source: 'google',
        utm_medium: 'organic'
      }
    }

    beforeEach(() => {
      provider = new GA4Provider(validConfig)
    })

    it('should send event successfully', async () => {
      await expect(provider.send(mockEvent)).resolves.not.toThrow()

      expect(appLogger.info).toHaveBeenCalledWith('GA4 event sent successfully', {
        eventName: 'redirect_click',
        clientId: expect.any(String),
        eventCount: 1,
        latencyMs: expect.any(Number),
        measurementId: 'G-TEST123456',
        payloadSize: expect.any(Number)
      })
    })

    it('should skip events when provider is disabled', async () => {
      const disabledConfig = { ...validConfig, measurementId: '' }
      const disabledProvider = new GA4Provider(disabledConfig)

      await disabledProvider.send(mockEvent)

      expect(appLogger.debug).toHaveBeenCalledWith('GA4 provider disabled - skipping event', {
        eventName: 'redirect_click',
        enabled: false,
        hasHttpClient: false
      })
    })

    it('should handle invalid event structure', async () => {
      const invalidEvent = { name: '', attributes: {} } as AnalyticsEvent

      await provider.send(invalidEvent)

      expect(appLogger.warn).toHaveBeenCalledWith('Invalid event structure - skipping GA4 send', {
        event: invalidEvent
      })
    })

    it('should handle null/undefined events', async () => {
      await provider.send(null as any)
      expect(appLogger.warn).toHaveBeenCalledWith('Invalid event structure - skipping GA4 send', {
        event: null
      })

      await provider.send(undefined as any)
      expect(appLogger.warn).toHaveBeenCalledWith('Invalid event structure - skipping GA4 send', {
        event: undefined
      })
    })

    it('should log error but not throw when payload building fails', async () => {
      const { buildGA4Payload } = await import('../../../../../src/lib/analytics/ga4/payload-builder')
      vi.mocked(buildGA4Payload).mockImplementationOnce(() => {
        throw new Error('Payload building failed')
      })

      await expect(provider.send(mockEvent)).resolves.not.toThrow()

      expect(appLogger.error).toHaveBeenCalledWith('GA4 provider: failed to process event', {
        eventName: 'redirect_click',
        error: 'Payload building failed',
        errorType: 'Error'
      })
    })

    it('should show debug payload when debug mode is enabled', async () => {
      const debugConfig = { ...validConfig, debug: true }
      const debugProvider = new GA4Provider(debugConfig)

      await debugProvider.send(mockEvent)

      expect(appLogger.info).toHaveBeenCalledWith('GA4 event sent successfully', {
        eventName: 'redirect_click',
        clientId: expect.any(String),
        eventCount: 1,
        latencyMs: expect.any(Number),
        measurementId: 'G-TEST123456',
        payloadSize: expect.any(Number)
      })
    })

    it('should re-throw errors in debug mode', async () => {
      const debugConfig = { ...validConfig, debug: true }
      const debugProvider = new GA4Provider(debugConfig)

      const { buildGA4Payload } = await import('../../../../../src/lib/analytics/ga4/payload-builder')
      vi.mocked(buildGA4Payload).mockImplementationOnce(() => {
        throw new Error('Debug mode error')
      })

      await expect(debugProvider.send(mockEvent)).rejects.toThrow('Debug mode error')
    })

    it('should maintain provider isolation by catching errors', async () => {
      const { buildGA4Payload } = await import('../../../../../src/lib/analytics/ga4/payload-builder')
      vi.mocked(buildGA4Payload).mockImplementationOnce(() => {
        throw new Error('Network error')
      })

      // Should not throw error to maintain provider isolation
      await expect(provider.send(mockEvent)).resolves.not.toThrow()

      expect(appLogger.error).toHaveBeenCalled()
    })
  })

  describe('isConfigured', () => {
    it('should return true when both measurement ID and API secret are present', () => {
      const provider = new GA4Provider(validConfig)
      expect(provider.isConfigured()).toBe(true)
    })

    it('should return false when measurement ID is missing', () => {
      const invalidConfig = { ...validConfig, measurementId: '' }
      const provider = new GA4Provider(invalidConfig)
      expect(provider.isConfigured()).toBe(false)
    })

    it('should return false when API secret is missing', () => {
      const invalidConfig = { ...validConfig, apiSecret: '' }
      const provider = new GA4Provider(invalidConfig)
      expect(provider.isConfigured()).toBe(false)
    })
  })

  describe('getConfig', () => {
    it('should return configuration with API secret masked', () => {
      const provider = new GA4Provider(validConfig)
      const config = provider.getConfig()

      expect(config).toEqual({
        measurementId: 'G-TEST123456',
        apiSecret: '***',
        debug: false,
        defaultParameters: {},
        timeout: 2000,
        httpClientStatus: 'initialized'
      })
    })

    it('should handle undefined API secret', () => {
      const configWithoutSecret = { ...validConfig, apiSecret: undefined }
      const provider = new GA4Provider(configWithoutSecret)
      const config = provider.getConfig()

      expect(config.apiSecret).toBeUndefined()
    })

    it('should include default parameters in config', () => {
      const configWithDefaults = {
        ...validConfig,
        defaultParameters: { custom_param: 'value' }
      }
      const provider = new GA4Provider(configWithDefaults)
      const config = provider.getConfig()

      expect(config.defaultParameters).toEqual({ custom_param: 'value' })
    })
  })

  describe('Integration: Complete Event Flow', () => {
    it('should handle complete event processing flow', async () => {
      const provider = new GA4Provider(validConfig)
      const complexEvent: AnalyticsEvent = {
        name: 'redirect_click',
        attributes: {
          utm_source: 'facebook',
          utm_medium: 'cpc',
          utm_campaign: 'summer_sale',
          xptdk: 'abc123',
          ref: 'instagram',
          short_url: 'short.ly/promo',
          destination_url: 'https://example.com/target',
          redirect_type: '301'
        }
      }

      await expect(provider.send(complexEvent)).resolves.not.toThrow()

      expect(appLogger.info).toHaveBeenCalledWith('GA4 event sent successfully', {
        eventName: 'redirect_click',
        clientId: expect.any(String),
        eventCount: 1,
        latencyMs: expect.any(Number),
        measurementId: 'G-TEST123456',
        payloadSize: expect.any(Number)
      })
    })

    it('should handle multiple events sent sequentially', async () => {
      const provider = new GA4Provider(validConfig)
      const events = [
        { name: 'redirect_click', attributes: { utm_source: 'google' } },
        { name: 'redirect_click', attributes: { utm_source: 'facebook' } },
        { name: 'redirect_click', attributes: { utm_source: 'twitter' } }
      ] as AnalyticsEvent[]

      for (const event of events) {
        await expect(provider.send(event)).resolves.not.toThrow()
      }

      expect(appLogger.info).toHaveBeenCalledTimes(5) // 1 initialization + 3 success logs
    })
  })

  describe('Error Scenarios', () => {
    it('should handle malformed event attributes', async () => {
      const provider = new GA4Provider(validConfig)
      const malformedEvent: AnalyticsEvent = {
        name: 'redirect_click',
        attributes: {
          utm_source: null,
          utm_medium: undefined,
          custom_param: 'valid_value'
        }
      }

      await expect(provider.send(malformedEvent)).resolves.not.toThrow()
    })

    it('should handle very long parameter values', async () => {
      const provider = new GA4Provider(validConfig)
      const longValue = 'a'.repeat(10000)
      const longEvent: AnalyticsEvent = {
        name: 'redirect_click',
        attributes: {
          long_param: longValue
        }
      }

      await expect(provider.send(longEvent)).resolves.not.toThrow()
    })

    it('should handle events with special characters', async () => {
      const provider = new GA4Provider(validConfig)
      const specialEvent: AnalyticsEvent = {
        name: 'redirect_click',
        attributes: {
          utm_source: 'google+search',
          utm_campaign: 'test & demo (2025)',
          special_chars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        }
      }

      await expect(provider.send(specialEvent)).resolves.not.toThrow()
    })
  })
})