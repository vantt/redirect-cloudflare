/**
 * Analytics Router E2E Tests
 * 
 * End-to-end tests for analytics router using mock providers.
 * Tests multi-provider scenarios: success, failure, timeout, and mixed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AnalyticsEvent, EventName } from '../../../src/lib/analytics/types'
import { AnalyticsProvider } from '../../../src/lib/analytics/provider'
import { 
  createSuccessMock,
  createFailureMock,
  createTimeoutMock,
  createProvidersByType
} from './providers/provider-mocks'

// Import the actual router implementation for testing
import { routeAnalyticsEvent } from '../../../src/lib/analytics/router'

/**
 * Test wrapper around routeAnalyticsEvent that captures results for testing
 * Since the actual router returns void for production use, we wrap it to capture
 * the logged results and provider behavior for test assertions
 */
async function routeAnalyticsEventForTesting(
  providers: AnalyticsProvider[], 
  event: AnalyticsEvent
): Promise<{
  totalProviders: number
  successful: number
  failed: number
  timedOut: number
  duration: number
}> {
  const startTime = Date.now()
  
  // Mock the logger to capture provider results
  const logCalls: any[] = []
  const originalLog = console.log
  console.log = (...args) => {
    logCalls.push(args)
    originalLog(...args)
  }
  
  try {
    // Call the actual router
    await routeAnalyticsEvent(event, providers)
    
    // Extract results from log calls
    const providerCalls = logCalls.filter(call => 
      Array.isArray(call) && 
      call.length > 0 && 
      typeof call[0] === 'string' &&
      call[0].includes('provider dispatch')
    )
    
    const successful = providerCalls.filter(call => 
      call[0].includes('successful')
    ).length
    
    const failed = providerCalls.filter(call => 
      call[0].includes('failed')
    ).length
    
    const timedOut = providerCalls.filter(call => 
      JSON.stringify(call).includes('isTimeout": true')
    ).length
    
    return {
      totalProviders: providers.length,
      successful,
      failed,
      timedOut,
      duration: Date.now() - startTime
    }
    
  } finally {
    // Restore console
    console.log = originalLog
  }
}

describe('Analytics Router E2E Tests', () => {
  let testEvent: AnalyticsEvent
  let consoleSpy: {
    log: ReturnType<typeof vi.fn>
    error: ReturnType<typeof vi.fn>
    warn: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    testEvent = {
      name: EventName.REDIRECT_CLICK,
      attributes: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'test-campaign'
      }
    }

    // Spy on console to capture logging
    consoleSpy = {
      log: vi.fn().mockImplementation(() => {}),
      error: vi.fn().mockImplementation(() => {}),
      warn: vi.fn().mockImplementation(() => {})
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('No Providers', () => {
    it('should complete without errors when no providers configured', async () => {
      const providers: AnalyticsProvider[] = []

      const result = await routeAnalyticsEventForTesting(providers, testEvent)

      expect(result).toEqual({
        totalProviders: 0,
        successful: 0,
        failed: 0,
        timedOut: 0,
        duration: expect.any(Number)
      })
    })
  })

  describe('Single Provider', () => {
    it('should handle single successful provider', async () => {
      const providers = [createSuccessMock({ name: 'SingleSuccess' })]

      const result = await routeAnalyticsEventForTesting(providers, testEvent)

      expect(result).toEqual({
        totalProviders: 1,
        successful: 1,
        failed: 0,
        timedOut: 0,
        duration: expect.any(Number)
      })
    })

    it('should handle single failing provider', async () => {
      const providers = [createFailureMock({ 
        name: 'SingleFailure',
        errorMessage: 'Provider connection failed'
      })]

      const result = await routeAnalyticsEventForTesting(providers, testEvent)

      expect(result).toEqual({
        totalProviders: 1,
        successful: 0,
        failed: 1,
        timedOut: 0,
        duration: expect.any(Number)
      })
    })

    it('should handle single timeout provider', async () => {
      const providers = [createTimeoutMock({ name: 'SingleTimeout', delay: 5000 })]

      const resultPromise = routeAnalyticsEventForTesting(providers, testEvent)
      
      // Fast-forward timers to trigger timeout
      await vi.advanceTimersByTimeAsync(6000)
      
      const result = await resultPromise

      expect(result).toEqual({
        totalProviders: 1,
        successful: 0,
        failed: 0,
        timedOut: 1,
        duration: expect.any(Number)
      })
    })
  })

  describe('Multi-Provider Scenarios', () => {
    it('should handle all-success providers', async () => {
      const providers = createProvidersByType('all-success')

      const result = await routeAnalyticsEventForTesting(providers, testEvent)

      expect(result.totalProviders).toBe(3)
      expect(result.successful).toBe(3)
      expect(result.failed).toBe(0)
      expect(result.timedOut).toBe(0)
    })

    it('should handle all-failure providers', async () => {
      const providers = createProvidersByType('all-failure')

      const result = await routeAnalyticsEventForTesting(providers, testEvent)

      expect(result.totalProviders).toBe(3)
      expect(result.successful).toBe(0)
      expect(result.failed).toBe(3)
      expect(result.timedOut).toBe(0)
    })

    it('should handle mixed providers (success, failure, timeout)', async () => {
      const providers = createProvidersByType('mixed')

      const resultPromise = routeAnalyticsEventForTesting(providers, testEvent)
      
      // Fast-forward timers to trigger timeout
      await vi.advanceTimersByTimeAsync(6000)
      
      const result = await resultPromise

      expect(result.totalProviders).toBe(4)
      expect(result.successful).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.timedOut).toBe(1)
    })
  })

  describe('Performance and Reliability', () => {
    it('should complete within reasonable time for successful providers', async () => {
      const providers = [
        createSuccessMock({ delay: 100 }),
        createSuccessMock({ delay: 200 }),
        createSuccessMock({ delay: 150 })
      ]

      const startTime = Date.now()
      const result = await routeAnalyticsEventForTesting(providers, testEvent)
      const endTime = Date.now()

      // Should complete quickly (all providers succeed)
      expect(endTime - startTime).toBeLessThan(1000)
      expect(result.successful).toBe(3)
    })

    it('should not block redirect flow when providers fail', async () => {
      const providers = [
        createFailureMock({ delay: 100 }),
        createTimeoutMock({ delay: 5000 }),
        createFailureMock({ delay: 50 })
      ]

      const startTime = Date.now()
      const resultPromise = routeAnalyticsEventForTesting(providers, testEvent)
      
      // Fast-forward to trigger timeout
      await vi.advanceTimersByTimeAsync(6000)
      
      const result = await resultPromise
      const endTime = Date.now()

      // Should complete within timeout bounds, not hang
      expect(endTime - startTime).toBeLessThan(7000)
      expect(result.timedOut).toBe(1)
      expect(result.failed).toBe(2)
    })

    it('should handle concurrent provider execution', async () => {
      const providers = [
        createSuccessMock({ delay: 1000 }),
        createSuccessMock({ delay: 1000 }),
        createSuccessMock({ delay: 1000 })
      ]

      // All providers should execute in parallel, not sequentially
      const startTime = Date.now()
      const resultPromise = routeAnalyticsEventForTesting(providers, testEvent)
      
      // Fast-forward past all delays
      await vi.advanceTimersByTimeAsync(1500)
      
      const result = await resultPromise
      const endTime = Date.now()

      // Should complete in ~1000ms, not 3000ms (parallel execution)
      expect(endTime - startTime).toBeLessThan(2000)
      expect(result.successful).toBe(3)
    })
  })

  describe('Edge Cases', () => {
    it('should handle events with no attributes', async () => {
      const providers = [createSuccessMock()]
      const emptyEvent: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {}
      }

      const result = await routeAnalyticsEventForTesting(providers, emptyEvent)

      expect(result.successful).toBe(1)
      expect(result.failed).toBe(0)
    })

    it('should handle events with complex attributes', async () => {
      const providers = [createSuccessMock()]
      const complexEvent: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {
          utm_source: 'facebook',
          utm_medium: 'social',
          utm_campaign: 'promo',
          click_count: 5,
          is_mobile: true,
          timestamp: Date.now(),
          custom_data: { nested: 'object' } as any // Complex object
        }
      }

      const result = await routeAnalyticsEventForTesting(providers, complexEvent)

      expect(result.successful).toBe(1)
      expect(result.failed).toBe(0)
    })

    it('should handle empty provider array', async () => {
      const providers: AnalyticsProvider[] = []

      const result = await routeAnalyticsEventForTesting(providers, testEvent)

      expect(result).toEqual({
        totalProviders: 0,
        successful: 0,
        failed: 0,
        timedOut: 0,
        duration: expect.any(Number)
      })
    })
  })
})