import { describe, it, expect, vi, beforeEach } from 'vitest'
import { routeAnalyticsEvent } from '../../../src/lib/analytics/router'
import { AnalyticsEvent, EventName, AttributeKey } from '../../../src/lib/analytics/types'
import { AnalyticsProvider } from '../../../src/lib/analytics/provider'

// Mock logger to capture log calls
vi.mock('../../../src/utils/logger', () => ({
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
    } as any,
    ANALYTICS_KV: {
      get: vi.fn(),
      list: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      getWithMetadata: vi.fn()
    } as any,
    ...overrides
  }
}

describe('Analytics Router - Timeout and Non-Blocking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Timeout Policy Integration', () => {
    it('should use default timeout when ANALYTICS_TIMEOUT_MS not set', async () => {
      const mockProvider = {
        send: vi.fn().mockResolvedValue(undefined)
      }
      
      const event = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'google' }
      }
      
      const startTime = Date.now()
      await routeAnalyticsEvent(event, [mockProvider])
      const duration = Date.now() - startTime
      
      expect(mockProvider.send).toHaveBeenCalledWith(event)
      expect(duration).toBeLessThan(2100) // Should complete quickly
      
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatch complete',
        expect.objectContaining({
          timeout: 2000
        })
      )
    })

    it('should use environment timeout when ANALYTICS_TIMEOUT_MS is set', async () => {
      const mockProvider = {
        send: vi.fn().mockResolvedValue(undefined)
      }
      
      const event = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'google' }
      }
      
      const env = createTestEnv({ ANALYTICS_TIMEOUT_MS: '5000' })
      
      const startTime = Date.now()
      await routeAnalyticsEvent(event, [mockProvider], { providerTimeout: undefined }, env)
      const duration = Date.now() - startTime
      
      expect(mockProvider.send).toHaveBeenCalledWith(event)
      expect(duration).toBeLessThan(5100) // Should use 5000ms timeout
      
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatch complete',
        expect.objectContaining({
          timeout: 5000
        })
      )
    })

    it('should use options timeout when provided', async () => {
      const mockProvider = {
        send: vi.fn().mockResolvedValue(undefined)
      }
      
      const event = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'google' }
      }
      
      const startTime = Date.now()
      await routeAnalyticsEvent(event, [mockProvider], { providerTimeout: 1000 })
      const duration = Date.now() - startTime
      
      expect(mockProvider.send).toHaveBeenCalledWith(event)
      expect(duration).toBeLessThan(1100) // Should use 1000ms timeout
      
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatch complete',
        expect.objectContaining({
          timeout: 1000
        })
      )
    })

    it('should override environment timeout with options timeout', async () => {
      const mockProvider = {
        send: vi.fn().mockResolvedValue(undefined)
      }
      
      const event = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'google' }
      }
      
      const env = createTestEnv({ ANALYTICS_TIMEOUT_MS: '3000' })
      
      const startTime = Date.now()
      await routeAnalyticsEvent(event, [mockProvider], { providerTimeout: 1000 }, env)
      const duration = Date.now() - startTime
      
      expect(mockProvider.send).toHaveBeenCalledWith(event)
      expect(duration).toBeLessThan(1100) // Should use options timeout (1000ms)
      
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatch complete',
        expect.objectContaining({
          timeout: 1000
        })
      )
    })

    it('should warn on invalid ANALYTICS_TIMEOUT_MS and use default', async () => {
      const mockProvider = {
        send: vi.fn().mockResolvedValue(undefined)
      }
      
      const event = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'google' }
      }
      
      const env = createTestEnv({ ANALYTICS_TIMEOUT_MS: 'invalid' })
      
      await routeAnalyticsEvent(event, [mockProvider], {}, env)
      
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.warn).toHaveBeenCalledWith(
        'Analytics router: invalid ANALYTICS_TIMEOUT_MS, using default',
        expect.objectContaining({
          ANALYTICS_TIMEOUT_MS: 'invalid',
          defaultTimeout: 2000
        })
      )
    })
  })

  describe('Non-Blocking Behavior', () => {
    it('should complete promptly even when one provider hangs', async () => {
      const fastProvider = {
        send: vi.fn().mockResolvedValue(undefined)
      }
      
      const slowProvider = {
        send: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 5000)) // Hang for 5 seconds
        })
      }
      
      const event = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'google' }
      }
      
      const startTime = Date.now()
      await routeAnalyticsEvent(event, [fastProvider, slowProvider], { providerTimeout: 500 })
      const duration = Date.now() - startTime
      
      // Should complete quickly due to timeout (not wait for slow provider)
      expect(duration).toBeLessThan(1000)
      
      expect(fastProvider.send).toHaveBeenCalled()
      expect(slowProvider.send).toHaveBeenCalled()
      
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.error).toHaveBeenCalledWith(
        'Analytics router: provider dispatch failed',
        expect.objectContaining({
          isTimeout: true
        })
      )
      
      // Should complete summary with both providers accounted for
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatch complete',
        expect.objectContaining({
          totalProviders: 2,
          successful: 1,
          failed: 1
        })
      )
    })

    it('should never throw on provider failures or timeouts', async () => {
      const failingProvider = {
        send: vi.fn().mockRejectedValue(new Error('Provider error'))
      }
      
      const event = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'google' }
      }
      
      // Should not throw even when provider fails
      await expect(routeAnalyticsEvent(event, [failingProvider], { providerTimeout: 100 })).resolves.not.toThrow()
    })

    it('should handle mixed success and failure outcomes', async () => {
      const successProvider1 = {
        send: vi.fn().mockResolvedValue(undefined)
      }
      
      const timeoutProvider = {
        send: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 300)) // Normal success but slower
        })
      }
      
      const failureProvider = {
        send: vi.fn().mockRejectedValue(new Error('Network error'))
      }
      
      const event = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'google' }
      }
      
      await routeAnalyticsEvent(event, [successProvider1, timeoutProvider, failureProvider], { providerTimeout: 200 })
      
      expect(successProvider1.send).toHaveBeenCalled()
      expect(timeoutProvider.send).toHaveBeenCalled()
      expect(failureProvider.send).toHaveBeenCalled()
      
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatch complete',
        expect.objectContaining({
          totalProviders: 3,
          successful: 2,
          failed: 1
        })
      )
    })
  })

  describe('Timeout Detection and Logging', () => {
    it('should detect timeout and log as timeout error', async () => {
      const slowProvider = {
        send: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 300)) // Slower than 200ms timeout
        })
      }
      
      const event = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'google' }
      }
      
      await routeAnalyticsEvent(event, [slowProvider], { providerTimeout: 200 })
      
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.error).toHaveBeenCalledWith(
        'Analytics router: provider dispatch failed',
        expect.objectContaining({
          isTimeout: true
        })
      )
      
      expect(appLogger.error).toHaveBeenCalledWith(
        'Analytics router: provider dispatch failed',
        expect.objectContaining({
          error: 'Provider timeout after 200ms'
        })
      )
    })

    it('should distinguish between timeout and other errors', async () => {
      const errorProvider = {
        send: vi.fn().mockRejectedValue(new Error('Authentication failed'))
      }
      
      const event = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'google' }
      }
      
      await routeAnalyticsEvent(event, [errorProvider], { providerTimeout: 200 })
      
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.error).toHaveBeenCalledWith(
        'Analytics router: provider dispatch failed',
        expect.objectContaining({
          isTimeout: false
        })
      )
      
      expect(appLogger.error).toHaveBeenCalledWith(
        'Analytics router: provider dispatch failed',
        expect.objectContaining({
          error: 'Authentication failed'
        })
      )
    })
  })

  describe('Performance and Latency Budget', () => {
    it('should complete within reasonable time even with slow providers', async () => {
      const slowProvider1 = {
        send: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 5000))
        })
      }
      
      const slowProvider2 = {
        send: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 4000))
        })
      }
      
      const event = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'google' }
      }
      
      const startTime = Date.now()
      await routeAnalyticsEvent(event, [slowProvider1, slowProvider2], { providerTimeout: 300 })
      const duration = Date.now() - startTime
      
      // Should complete within timeout budget, not wait for slow providers
      expect(duration).toBeLessThan(500)
      
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatch complete',
        expect.objectContaining({
          successful: 0,
          failed: 2
        })
      )
    })
  })
})