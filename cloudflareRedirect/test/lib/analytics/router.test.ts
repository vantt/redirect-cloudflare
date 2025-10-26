import { describe, it, expect, vi, beforeEach } from 'vitest'
import { routeAnalyticsEvent } from '../../../src/lib/analytics/router'
import { AnalyticsEvent, EventName, AttributeKey } from '../../../src/lib/analytics/types'
import { AnalyticsProvider } from '../../../src/lib/analytics/provider'

// Mock logger to capture log calls
vi.mock('../../../src/utils/logger', () => ({
  appLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

describe('Analytics Router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('routeAnalyticsEvent', () => {
    it('should handle no providers gracefully', async () => {
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'google' }
      }
      
      await expect(routeAnalyticsEvent(event, [])).resolves.not.toThrow()
      
      // Should log info message about no providers
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: no providers configured',
        expect.objectContaining({
          eventName: 'redirect_click',
          attributeCount: 1
        })
      )
    })

    it('should dispatch to single provider successfully', async () => {
      const mockProvider: AnalyticsProvider = {
        send: vi.fn().mockResolvedValue(undefined)
      }
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'facebook' }
      }
      
      await routeAnalyticsEvent(event, [mockProvider])
      
      expect(mockProvider.send).toHaveBeenCalledWith(event)
      expect(mockProvider.send).toHaveBeenCalledTimes(1)
      
      // Should log dispatch start and success
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatching to provider',
        expect.objectContaining({
          providerName: 'MockProvider',
          eventName: 'redirect_click',
          attributeCount: 1,
          providerIndex: 0
        })
      )
      
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: provider dispatch successful',
        expect.objectContaining({
          providerName: 'MockProvider',
          eventName: 'redirect_click',
          duration: expect.any(Number)
        })
      )
    })

    it('should dispatch to multiple providers concurrently', async () => {
      const mockProvider1: AnalyticsProvider = {
        send: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
        })
      }
      
      const mockProvider2: AnalyticsProvider = {
        send: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 30))
        })
      }
      
      const mockProvider3: AnalyticsProvider = {
        send: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 40))
        })
      }
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_MEDIUM]: 'cpc' }
      }
      
      const startTime = Date.now()
      await routeAnalyticsEvent(event, [mockProvider1, mockProvider2, mockProvider3])
      const duration = Date.now() - startTime
      
      // All providers should be called
      expect(mockProvider1.send).toHaveBeenCalledWith(event)
      expect(mockProvider2.send).toHaveBeenCalledWith(event)
      expect(mockProvider3.send).toHaveBeenCalledWith(event)
      
      // Should complete in roughly the time of the longest provider (50ms + buffer)
      expect(duration).toBeLessThan(100)
      
      // Should log dispatch for each provider
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatching to provider',
        expect.objectContaining({ providerIndex: 0 })
      )
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatching to provider',
        expect.objectContaining({ providerIndex: 1 })
      )
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatching to provider',
        expect.objectContaining({ providerIndex: 2 })
      )
    })

    it('should isolate provider failures - other providers continue', async () => {
      const failingProvider: AnalyticsProvider = {
        send: vi.fn().mockRejectedValue(new Error('Provider error'))
      }
      
      const successfulProvider: AnalyticsProvider = {
        send: vi.fn().mockResolvedValue(undefined)
      }
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_CAMPAIGN]: 'test' }
      }
      
      // Should not throw even when one provider fails
      await expect(routeAnalyticsEvent(event, [failingProvider, successfulProvider])).resolves.not.toThrow()
      
      // Both providers should be called
      expect(failingProvider.send).toHaveBeenCalledWith(event)
      expect(successfulProvider.send).toHaveBeenCalledWith(event)
      
      // Should log both failure and success
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.error).toHaveBeenCalledWith(
        'Analytics router: provider dispatch failed',
        expect.objectContaining({
          providerName: 'MockProvider',
          error: 'Provider error',
          duration: expect.any(Number)
        })
      )
      
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: provider dispatch successful',
        expect.objectContaining({
          providerName: 'MockProvider',
          duration: expect.any(Number)
        })
      )
    })

    it('should handle multiple provider failures', async () => {
      const failingProvider1: AnalyticsProvider = {
        send: vi.fn().mockRejectedValue(new Error('First error'))
      }
      
      const failingProvider2: AnalyticsProvider = {
        send: vi.fn().mockRejectedValue(new Error('Second error'))
      }
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'test' }
      }
      
      // Should not throw even when all providers fail
      await expect(routeAnalyticsEvent(event, [failingProvider1, failingProvider2])).resolves.not.toThrow()
      
      // Should log both failures
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.error).toHaveBeenCalledTimes(2)
      
      expect(appLogger.error).toHaveBeenCalledWith(
        'Analytics router: provider dispatch failed',
        expect.objectContaining({
          error: 'First error'
        })
      )
      
      expect(appLogger.error).toHaveBeenCalledWith(
        'Analytics router: provider dispatch failed',
        expect.objectContaining({
          error: 'Second error'
        })
      )
    })

    it('should apply provider timeout', async () => {
      const slowProvider: AnalyticsProvider = {
        send: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
        })
      }
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'test' }
      }
      
      const startTime = Date.now()
      await routeAnalyticsEvent(event, [slowProvider], { providerTimeout: 100 })
      const duration = Date.now() - startTime
      
      // Should timeout quickly, not wait for the slow provider
      expect(duration).toBeLessThan(200)
      
      // Should log timeout as error
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.error).toHaveBeenCalledWith(
        'Analytics router: provider dispatch failed',
        expect.objectContaining({
          error: 'Provider timeout after 100ms'
        })
      )
    })

    it('should use custom provider names', async () => {
      class CustomProvider implements AnalyticsProvider {
        name = 'CustomAnalytics'
        
        async send(event: AnalyticsEvent): Promise<void> {
          // Implementation
        }
      }
      
      const customProvider = new CustomProvider()
      const mockSend = vi.spyOn(customProvider, 'send').mockResolvedValue(undefined)
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'test' }
      }
      
      await routeAnalyticsEvent(event, [customProvider])
      
      // Should use the custom class name in logs
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatching to provider',
        expect.objectContaining({
          providerName: 'CustomAnalytics'
        })
      )
    })

    it('should handle mixed success and failure with timeouts', async () => {
      const fastProvider: AnalyticsProvider = {
        send: vi.fn().mockResolvedValue(undefined)
      }
      
      const slowProvider: AnalyticsProvider = {
        send: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 300))
        })
      }
      
      const failingProvider: AnalyticsProvider = {
        send: vi.fn().mockRejectedValue(new Error('Failed'))
      }
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'test' }
      }
      
      const startTime = Date.now()
      await routeAnalyticsEvent(event, [fastProvider, slowProvider, failingProvider], { providerTimeout: 150 })
      const duration = Date.now() - startTime
      
      // Should complete quickly due to timeout
      expect(duration).toBeLessThan(200)
      
      // All providers should be attempted
      expect(fastProvider.send).toHaveBeenCalled()
      expect(slowProvider.send).toHaveBeenCalled()
      expect(failingProvider.send).toHaveBeenCalled()
      
      // Should log appropriate outcomes
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.info).toHaveBeenCalledTimes(1) // Only fast provider succeeded
      expect(appLogger.error).toHaveBeenCalledTimes(2) // slow (timeout) + failing providers
    })
  })
})