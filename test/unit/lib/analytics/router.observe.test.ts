import { describe, it, expect, vi, beforeEach } from 'vitest'
import { routeAnalyticsEvent } from '../../../../src/lib/analytics/router'
import { AnalyticsEvent, EventName, AttributeKey } from '../../../../src/lib/analytics/types'
import { AnalyticsProvider } from '../../../../src/lib/analytics/provider'

// Mock logger to capture log calls
vi.mock('../../../../src/utils/logger', () => ({
  appLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

// Helper to create minimal Env with required properties
function createTestEnv(overrides = {}) {
  return {
    REDIRECT_KV: {
      get: vi.fn(),
      list: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      getWithMetadata: vi.fn()
    },
    ANALYTICS_KV: {
      get: vi.fn(),
      list: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      getWithMetadata: vi.fn()
    },
    ...overrides
  }
}

describe('Analytics Router - Structured Logging and Observability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Structured Logging (Story 5.2 compliance)', () => {
    it('should log dispatch attempt with required schema fields', async () => {
      const mockProvider: AnalyticsProvider = {
        name: 'MockProvider',
        send: vi.fn().mockResolvedValue(undefined)
      }
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {
          [AttributeKey.UTM_SOURCE]: 'google',
          [AttributeKey.UTM_CAMPAIGN]: 'spring_sale',
          [AttributeKey.REF]: 'profile'
        }
      }
      
      await routeAnalyticsEvent(event, [mockProvider], { providerTimeout: 100 }, createTestEnv())
      
      const { appLogger } = await import('../../../../src/utils/logger')
      
      // Should log dispatch attempt with required fields
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatching to provider',
        expect.objectContaining({
          providerName: 'MockProvider',
          eventName: 'redirect_click',
          attributeCount: 3,
          providerIndex: 0,
          timeout: 100
        })
      )
    })

    it('should log success with duration and timestamp', async () => {
      const mockProvider: AnalyticsProvider = {
        name: 'MockProvider',
        send: vi.fn().mockResolvedValue(undefined)
      }

      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'facebook' }
      }

      await routeAnalyticsEvent(event, [mockProvider], { providerTimeout: 50 }, createTestEnv())

      const { appLogger } = await import('../../../../src/utils/logger')

      // Should log success with duration and timestamp
      const successCall = (appLogger.info as any).mock.calls.find(
        (call: any) => call[0] === 'Analytics router: provider dispatch successful'
      )

      expect(successCall).toBeDefined()
      expect(successCall[1]).toMatchObject({
        providerName: 'MockProvider',
        eventName: 'redirect_click',
        duration: expect.any(Number),
        providerIndex: 0
      })
    })

    it('should log failure with error details and duration', async () => {
      const mockProvider: AnalyticsProvider = {
        name: 'MockProvider',
        send: vi.fn().mockRejectedValue(new Error('Network error'))
      }
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_MEDIUM]: 'email' }
      }
      
      await routeAnalyticsEvent(event, [mockProvider], { providerTimeout: 200 }, createTestEnv())

      const { appLogger } = await import('../../../../src/utils/logger')

      // Should log failure with error details
      const errorCall = (appLogger.error as any).mock.calls.find(
        (call: any) => call[0] === 'Analytics router: provider dispatch failed'
      )

      expect(errorCall).toBeDefined()
      expect(errorCall[1]).toMatchObject({
        providerName: 'MockProvider',
        eventName: 'redirect_click',
        error: 'Network error',
        duration: expect.any(Number),
        providerIndex: 0,
        isTimeout: false // Should not be timeout
      })
    })

    it('should log timeout failure with timeout flag', async () => {
      const mockProvider: AnalyticsProvider = {
        name: 'MockProvider',
        send: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 300)) // Slower than timeout
        })
      }

      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'twitter' }
      }

      await routeAnalyticsEvent(event, [mockProvider], { providerTimeout: 100 }, createTestEnv())

      const { appLogger } = await import('../../../../src/utils/logger')

      // Should log failure with timeout flag set
      const errorCall = (appLogger.error as any).mock.calls.find(
        (call: any) => call[0] === 'Analytics router: provider dispatch failed'
      )

      expect(errorCall).toBeDefined()
      expect(errorCall[1]).toMatchObject({
        providerName: 'MockProvider',
        eventName: 'redirect_click',
        error: expect.stringContaining('timeout'),
        duration: expect.any(Number),
        providerIndex: 0,
        isTimeout: true // Should be marked as timeout
      })
    })

    it('should log completion summary with success/failure counts and duration', async () => {
      const successProvider: AnalyticsProvider = {
        name: 'SuccessProvider',
        send: vi.fn().mockResolvedValue(undefined)
      }

      const failProvider: AnalyticsProvider = {
        name: 'FailProvider',
        send: vi.fn().mockRejectedValue(new Error('Auth failed'))
      }

      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'linkedin' }
      }

      await routeAnalyticsEvent(event, [successProvider, failProvider], { providerTimeout: 150 }, createTestEnv())

      const { appLogger } = await import('../../../../src/utils/logger')

      // Should log completion summary
      const summaryCall = (appLogger.info as any).mock.calls.find(
        (call: any) => call[0] === 'Analytics router: dispatch complete'
      )

      expect(summaryCall).toBeDefined()
      expect(summaryCall[1]).toMatchObject({
        eventName: 'redirect_click',
        totalProviders: 2,
        successful: 1,
        failed: 1,
        duration: expect.any(Number),
        timeout: 150
      })
    })

    it('should log no providers case correctly', async () => {
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'organic' }
      }

      await routeAnalyticsEvent(event, [], { providerTimeout: 200 }, createTestEnv())

      const { appLogger } = await import('../../../../src/utils/logger')

      // Should log no providers case
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: no providers configured',
        expect.objectContaining({
          eventName: 'redirect_click',
          attributeCount: 1,
          timeout: 200
        })
      )

      // Should not log dispatch start/completion for no providers
      const dispatchCalls = (appLogger.info as any).mock.calls.filter(
        (call: any) => call[0] === 'Analytics router: dispatching to provider'
      )

      expect(dispatchCalls).toHaveLength(0)
    })
  })

  describe('No PII in Logs (Privacy compliance)', () => {
    it('should not log attribute values in structured logs', async () => {
      const mockProvider: AnalyticsProvider = {
        send: vi.fn().mockResolvedValue(undefined)
      }
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {
          [AttributeKey.UTM_SOURCE]: 'google',
          [AttributeKey.UTM_CAMPAIGN]: 'summer_sale',
          [AttributeKey.REF]: 'profile_id_123', // PII - should not appear
          [AttributeKey.XPTDK]: 'user_tracking_token' // PII - should not appear
        }
      }
      
      await routeAnalyticsEvent(event, [mockProvider], { providerTimeout: 100 }, createTestEnv())
      
      const { appLogger } = await import('../../../../src/utils/logger')
      
      // Should log attempt with count but not expose values
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatching to provider',
        expect.objectContaining({
          providerName: 'MockProvider',
          eventName: 'redirect_click',
          attributeCount: 4, // Total attributes including PII
          providerIndex: 0,
          timeout: 100
        })
      )
      
      // Success log should not contain PII values
      const successCall = (appLogger.info as any).mock.calls.find(
        (call: any) => call[0] === 'Analytics router: provider dispatch successful'
      )
      
      expect(successCall[1]).toMatchObject({
        providerName: 'MockProvider',
        eventName: 'redirect_click',
        duration: expect.any(Number),
        providerIndex: 0,
        timestamp: expect.any(String)
      })
      
      // Verify no PII in log strings
      const allCalls = (appLogger.info as any).mock.calls.flat()
      const logStrings = allCalls.map((call: any) => JSON.stringify(call.args[0]))
      
      // Should not contain PII attribute values
      expect(logStrings.some((log: string) => log.includes('profile_id_123'))).toBe(false)
      expect(logStrings.some((log: string) => log.includes('user_tracking_token'))).toBe(false)
    })

    it('should use provider names and event names instead of raw attributes in logs', async () => {
      const mockProvider: AnalyticsProvider = {
        send: vi.fn().mockResolvedValue(undefined)
      }
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {
          [AttributeKey.UTM_SOURCE]: 'google',
          [AttributeKey.UTM_CAMPAIGN]: 'campaign_with_sensitive_data'
        }
      }
      
      await routeAnalyticsEvent(event, [mockProvider], { providerTimeout: 100 }, createTestEnv())
      
      const { appLogger } = await import('../../../../src/utils/logger')
      
      // Should log using event name and provider name (not raw attribute data)
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatching to provider',
        expect.objectContaining({
          providerName: 'MockProvider',
          eventName: 'redirect_click', // Event name, not raw attributes
          attributeCount: 2, // Count only, not values
          providerIndex: 0,
          timeout: 100
        })
      )
      
      // Should not expose sensitive attribute data
      const allCalls = (appLogger.info as any).mock.calls.flat()
      const logStrings = allCalls.map((call: any) => JSON.stringify(call.args[0]))
      
      expect(logStrings.some((log: string) => log.includes('campaign_with_sensitive_data'))).toBe(false)
    })

    it('should handle no providers case without PII exposure', async () => {
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {
          [AttributeKey.UTM_SOURCE]: 'direct',
          [AttributeKey.REF]: 'user_id',
          [AttributeKey.XPTDK]: 'session_token'
        }
      }
      
      await routeAnalyticsEvent(event, [], { providerTimeout: 100 }, createTestEnv())
      
      const { appLogger } = await import('../../../../src/utils/logger')
      
      // Should log event name only, no attributes when no providers
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: no providers configured',
        expect.objectContaining({
          eventName: 'redirect_click',
          attributeCount: 3, // Would be 3 but no providers so safe
          timeout: 100
        })
      )
      
      // Verify no PII exposed in any logs
      const allCalls = (appLogger.info as any).mock.calls.flat()
      const logStrings = allCalls.map((call: any) => JSON.stringify(call.args[0]))
      
      expect(logStrings.some((log: string) => log.includes('direct'))).toBe(false) // No source attribute
      expect(logStrings.some((log: string) => log.includes('user_id'))).toBe(false) // No PII
      expect(logStrings.some((log: string) => log.includes('session_token'))).toBe(false) // No PII
      expect(logStrings.some((log: string) => log.includes('user_tracking_token'))).toBe(false) // No PII
    })
  })

  describe('Consistent Schema Across Providers', () => {
    it('should maintain consistent logging format across multiple providers', async () => {
      const mockProvider1: AnalyticsProvider = {
        send: vi.fn().mockResolvedValue(undefined)
      }
      
      const mockProvider2: AnalyticsProvider = {
        send: vi.fn().mockRejectedValue(new Error('Network timeout'))
      }
      
      const mockProvider3: AnalyticsProvider = {
        send: vi.fn().mockRejectedValue(new Error('Auth error'))
      }
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'google' }
      }
      
      await routeAnalyticsEvent(event, [mockProvider1, mockProvider2, mockProvider3], { providerTimeout: 80 }, createTestEnv())
      
      const { appLogger } = await import('../../../../src/utils/logger')
      
      // Should log completion summary with consistent schema
      const summaryCall = (appLogger.info as any).mock.calls.find(
        (call: any) => call[0] === 'Analytics router: dispatch complete'
      )
      
      expect(summaryCall).toBeDefined()
      expect(summaryCall[1]).toMatchObject({
        eventName: 'redirect_click',
        totalProviders: 3,
        successful: 1,
        failed: 2,
        duration: expect.any(Number),
        timeout: 80
      })
      
      // All logs should have same schema structure
      const infoCalls = (appLogger.info as any).mock.calls.filter(
        (call: any) => call[0].includes('Analytics router: dispatching to provider')
      )
      
      infoCalls.forEach((call: any) => {
        const logEntry = call.args[0]
        expect(logEntry).toMatchObject({
          providerName: expect.any(String),
          eventName: 'redirect_click',
          attributeCount: 1,
          providerIndex: expect.any(Number),
          timeout: 80
        })
      })
      
      // All error logs should have same schema structure
      const errorCalls = (appLogger.error as any).mock.calls.filter(
        (call: any) => call[0].includes('Analytics router: provider dispatch failed')
      )
      
      errorCalls.forEach((call: any) => {
        const logEntry = call.args[0]
        expect(logEntry).toMatchObject({
          providerName: expect.any(String),
          eventName: 'redirect_click',
          error: expect.any(String),
          duration: expect.any(Number),
          providerIndex: expect.any(Number),
          timestamp: expect.any(String),
          isTimeout: expect.any(Boolean)
        })
      })
    })
  })

  describe('Performance and Timing Metrics', () => {
    it('should capture accurate duration measurements', async () => {
      const mockProvider: AnalyticsProvider = {
        send: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 50)) // 50ms delay
        })
      }
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'test' }
      }
      
      const startTime = Date.now()
      await routeAnalyticsEvent(event, [mockProvider], { providerTimeout: 100 }, createTestEnv())
      const endTime = Date.now()
      const actualDuration = endTime - startTime
      
      const { appLogger } = await import('../../../../src/utils/logger')
      
      // Should capture duration accurately
      const successCall = (appLogger.info as any).mock.calls.find(
        (call: any) => call[0] === 'Analytics router: provider dispatch successful'
      )
      
      expect(successCall).toBeDefined()
      expect(successCall[1].duration).toBeDefined()
      expect(successCall[1].duration).toBeLessThan(100) // Should be less than timeout
      
      // Should be reasonably close to actual duration (allowing for function overhead)
      expect(Math.abs(successCall[1].duration - actualDuration)).toBeLessThan(10)
    })

    it('should log completion summary with performance timing', async () => {
      const slowProvider: AnalyticsProvider = {
        send: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 200)) // 200ms delay
        })
      }
      
      const fastProvider: AnalyticsProvider = {
        send: vi.fn().mockResolvedValue(undefined)
      }
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'google' }
      }
      
      await routeAnalyticsEvent(event, [fastProvider, slowProvider], { providerTimeout: 150 }, createTestEnv())
      
      const { appLogger } = await import('../../../../src/utils/logger')
      
      // Should log completion summary with duration
      const summaryCall = (appLogger.info as any).mock.calls.find(
        (call: any) => call[0] === 'Analytics router: dispatch complete'
      )
      
      expect(summaryCall).toBeDefined()
      expect(summaryCall[1]).toMatchObject({
        eventName: 'redirect_click',
        totalProviders: 2,
        successful: 1,
        failed: 1,
        duration: expect.any(Number),
        timeout: 150
      })
      
      // Duration should reflect total processing time (including slow provider)
      const loggedDuration = summaryCall[1].duration
      expect(loggedDuration).toBeGreaterThan(200) // Should be > 200ms due to slow provider
      expect(loggedDuration).toBeLessThan(250) // But reasonable (< 250ms)
    })
  })
})
