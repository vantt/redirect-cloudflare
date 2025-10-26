import { describe, it, expect, vi, beforeEach } from 'vitest'
import { routeAnalyticsEvent } from '../../../src/lib/analytics/router'
import { AnalyticsEvent, EventName, AttributeKey } from '../../../src/lib/analytics/types'
import { 
  createMockProvider,
  createTestEnv,
  MockProvider
} from './provider-mocks'
import { appLogger } from '../../../src/utils/logger'

// Mock logger to capture all log calls
vi.mock('../../../src/utils/logger', () => ({
  appLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

describe('Analytics Router - E2E Test Harness', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Test Harness Setup', () => {
    it('should initialize test environment correctly', () => {
      const env = createTestEnv()
      expect(env.REDIRECT_KV).toBeDefined()
      expect(env.ANALYTICS_KV).toBeDefined()
    })

    it('should have mock provider factories available', () => {
      const successProvider = createMockProvider('TestSuccess')
      expect(successProvider).toBeInstanceOf(MockProvider)
      expect(successProvider.name).toBe('TestSuccess')
    })

    it('should have structured logging capture ready', () => {
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.info).toBeDefined()
      expect(appLogger.error).toBeDefined()
      expect(appLogger.warn).toBeDefined()
    })
  })

  describe('AC1: Mocks for Providers Implementing AnalyticsProvider', () => {
    it('should have provider mocks that implement AnalyticsProvider interface', () => {
      const mockProvider = createMockProvider('TestProvider')
      
      // Should implement the required method
      expect(typeof mockProvider.send).toBe('function')
      
      // Should handle async operations
      expect(mockProvider.send(mockProvider.constructor as any, mockProvider.constructor as any)).toBeInstanceOf(Promise)
    })
  })

  describe('AC2: E2E Tests Covering Scenarios', () => {
    it('should handle no providers case', async () => {
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'test' }
      }
      
      await routeAnalyticsEvent(event, [], { providerTimeout: 100 }, createTestEnv())
      
      // Should complete without errors
      const { appLogger } = await import('../../../src/utils/logger')
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: no providers configured',
        expect.objectContaining({
          eventName: 'redirect_click',
          attributeCount: 1,
          timeout: 100
        })
      )
      
      // Should not log any errors
      expect(appLogger.error).not.toHaveBeenCalled()
    })

    it('should handle single provider success', async () => {
      const successProvider = createMockProvider('SingleSuccess')
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'google' }
      }
      
      await routeAnalyticsEvent(event, [successProvider], { providerTimeout: 200 }, createTestEnv())
      
      const { appLogger } = await import('../../../src/utils/logger')
      
      // Should log dispatch attempt and success
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatching to provider',
        expect.objectContaining({
          providerName: 'SingleSuccess',
          eventName: 'redirect_click',
          attributeCount: 1,
          providerIndex: 0,
          timeout: 200
        })
      )
      
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: provider dispatch successful',
        expect.objectContaining({
          providerName: 'SingleSuccess',
          eventName: 'redirect_click',
          duration: expect.any(Number),
          providerIndex: 0,
          timestamp: expect.any(String)
        })
      )
      
      // Should log completion summary
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatch complete',
        expect.objectContaining({
          eventName: 'redirect_click',
          totalProviders: 1,
          successful: 1,
          failed: 0,
          duration: expect.any(Number),
          timeout: 200
        })
      )
      
      // Should not log any errors
      expect(appLogger.error).not.toHaveBeenCalled()
    })

    it('should handle multiple providers with mixed success/failure', async () => {
      const successProvider1 = createMockProvider('Success1')
      const failureProvider = createMockProvider('Failure1', 'failure')
      const successProvider2 = createMockProvider('Success2')
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'mixed' }
      }
      
      await routeAnalyticsEvent(event, [successProvider1, failureProvider, successProvider2], { providerTimeout: 150 }, createTestEnv())
      
      const { appLogger } = await import('../../../src/utils/logger')
      
      // Should log 3 dispatch attempts
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatching to provider',
        expect.objectContaining({ providerName: 'Success1' })
      )
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatching to provider',
        expect.objectContaining({ providerName: 'Failure1' })
      )
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatching to provider',
        expect.objectContaining({ providerName: 'Success2' })
      )
      
      // Should log 2 successes and 1 failure
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: provider dispatch successful',
        expect.objectContaining({ providerName: 'Success1' })
      )
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: provider dispatch successful',
        expect.objectContaining({ providerName: 'Success2' })
      )
      
      // Should log failure
      expect(appLogger.error).toHaveBeenCalledWith(
        'Analytics router: provider dispatch failed',
        expect.objectContaining({
          providerName: 'Failure1',
          error: 'failure',
          isTimeout: false
        })
      )
      
      // Should log completion summary
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatch complete',
        expect.objectContaining({
          eventName: 'redirect_click',
          totalProviders: 3,
          successful: 2,
          failed: 1,
          duration: expect.any(Number),
          timeout: 150
        })
      )
    })

    it('should handle provider timeout', async () => {
      const timeoutProvider = createMockProvider('TimeoutProvider', 'timeout', 300) // Slower than 100ms timeout
      const successProvider = createMockProvider('SuccessAfterTimeout')
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'timeout-test' }
      }
      
      await routeAnalyticsEvent(event, [timeoutProvider, successProvider], { providerTimeout: 100 }, createTestEnv())
      
      const { appLogger } = await import('../../../src/utils/logger')
      
      // Should log both providers dispatched
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatching to provider',
        expect.objectContaining({ providerName: 'TimeoutProvider' })
      )
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatching to provider',
        expect.objectContaining({ providerName: 'SuccessAfterTimeout' })
      )
      
      // Should log timeout failure
      expect(appLogger.error).toHaveBeenCalledWith(
        'Analytics router: provider dispatch failed',
        expect.objectContaining({
          providerName: 'TimeoutProvider',
          error: 'Provider timeout after 100ms',
          isTimeout: true
        })
      )
      
      // Should log success for other provider
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: provider dispatch successful',
        expect.objectContaining({
          providerName: 'SuccessAfterTimeout',
          duration: expect.any(Number),
          timestamp: expect.any(String)
        })
      )
      
      // Should log completion summary
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatch complete',
        expect.objectContaining({
          eventName: 'redirect_click',
          totalProviders: 2,
          successful: 1,
          failed: 1,
          duration: expect.any(Number),
          timeout: 100
        })
      )
    })

    it('should complete within timeout budget even when providers are slow', async () => {
      const slowProvider1 = createMockProvider('Slow1', 'success', 200) // 200ms delay
      const slowProvider2 = createMockProvider('Slow2', 'success', 150) // 150ms delay
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'slow-test' }
      }
      
      const startTime = Date.now()
      await routeAnalyticsEvent(event, [slowProvider1, slowProvider2], { providerTimeout: 100 }, createTestEnv())
      const duration = Date.now() - startTime
      
      const { appLogger } = await import('../../../src/utils/logger')
      
      // Should complete quickly despite slow providers (within ~200ms + overhead)
      expect(duration).toBeLessThan(300)
      
      // Should log completion summary
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics router: dispatch complete',
        expect.objectContaining({
          eventName: 'redirect_click',
          totalProviders: 2,
          successful: 2,
          failed: 0,
          duration: expect.any(Number),
          timeout: 100
        })
      )
    })
  })

  describe('Development Experience', () => {
    it('should provide developer guide for adding new providers', () => {
      const env = createTestEnv()
      
      // This test documents the development experience for Story 7.6
      // In actual implementation, developers would use these mocks and patterns
      
      expect(env).toBeDefined()
      
      // Test completion guide would verify:
      // 1. New provider implements AnalyticsProvider interface
      const testProvider = createMockProvider('NewProvider')
      expect(typeof testProvider.send).toBe('function')
      expect(testProvider.send(testProvider.constructor as any, testProvider.constructor as any)).toBeInstanceOf(Promise)
      
      // 2. Provider is registered in environment
      const testEnvWithProvider = createTestEnv({
        ANALYTICS_PROVIDERS: 'NewProvider,test'
      })
      
      // 3. Router processes provider correctly
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { [AttributeKey.UTM_SOURCE]: 'test' }
      }
      
      await routeAnalyticsEvent(event, [testProvider], { providerTimeout: 100 }, testEnvWithProvider)
      
      // Developer should see logs showing the new provider being called
      expect(testProvider.send).toHaveBeenCalledWith(event)
    })
  })
})