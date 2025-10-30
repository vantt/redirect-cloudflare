/**
 * Analytics Router E2E Tests
 *
 * End-to-end tests for analytics router using mock providers.
 * Tests multi-provider scenarios: success, failure, timeout, and mixed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock logger to capture log calls
vi.mock('../../src/utils/logger', () => ({
  appLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))
import { AnalyticsEvent, EventName } from '../../src/lib/analytics/types'
import { AnalyticsProvider } from '../../src/lib/analytics/provider'
import {
  createSuccessMock,
  createFailureMock,
  createTimeoutMock,
  createProvidersByType
} from '../utils/mock-providers'

// Import the actual router implementation for testing
import { routeAnalyticsEvent } from '../../src/lib/analytics/router'

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

  // Import the mocked logger to access its calls
  const { appLogger } = await import('../../src/utils/logger')

  // Clear previous calls
  vi.clearAllMocks()

  // Call the actual router
  await routeAnalyticsEvent(event, providers)

  // Extract results from logger calls
  const infoCalls = (appLogger.info as any).mock.calls
  const errorCalls = (appLogger.error as any).mock.calls

  // Count successful providers (info logs with "provider dispatch successful")
  const successful = infoCalls.filter((call: any[]) =>
    call[0] === 'Analytics router: provider dispatch successful'
  ).length

  // Count failed providers (error logs with "provider dispatch failed")
  const failedCalls = errorCalls.filter((call: any[]) =>
    call[0] === 'Analytics router: provider dispatch failed'
  )
  const failed = failedCalls.length

  // Count timeouts (failed calls where isTimeout is true)
  const timedOut = failedCalls.filter((call: any[]) =>
    call[1]?.isTimeout === true
  ).length

  return {
    totalProviders: providers.length,
    successful,
    failed,
    timedOut,
    duration: Date.now() - startTime
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
      // Use real timers for this test since it involves actual timeouts
      vi.useRealTimers()

      const providers = [createTimeoutMock({ name: 'SingleTimeout', delay: 5000 })]

      const result = await routeAnalyticsEventForTesting(providers, testEvent)

      expect(result).toEqual({
        totalProviders: 1,
        successful: 0,
        failed: 1, // Timeout is counted as a failure
        timedOut: 1, // And specifically flagged as timeout
        duration: expect.any(Number)
      })

      // Restore fake timers for other tests
      vi.useFakeTimers()
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
      // Use real timers for this test since it involves actual timeouts
      vi.useRealTimers()

      const providers = createProvidersByType('mixed')

      const result = await routeAnalyticsEventForTesting(providers, testEvent)

      expect(result.totalProviders).toBe(4)
      expect(result.successful).toBe(2)
      expect(result.failed).toBe(2) // 1 regular failure + 1 timeout = 2 total failures
      expect(result.timedOut).toBe(1) // Timeout is subset of failures

      // Restore fake timers for other tests
      vi.useFakeTimers()
    })
  })

  describe('Performance and Reliability', () => {
    it('should complete within reasonable time for successful providers', async () => {
      // Use real timers to measure actual performance
      vi.useRealTimers()

      const providers = [
        createSuccessMock({ delay: 100 }),
        createSuccessMock({ delay: 200 }),
        createSuccessMock({ delay: 150 })
      ]

      const startTime = Date.now()
      const result = await routeAnalyticsEventForTesting(providers, testEvent)
      const endTime = Date.now()

      // Should complete quickly (all providers succeed in parallel)
      expect(endTime - startTime).toBeLessThan(1000)
      expect(result.successful).toBe(3)

      vi.useFakeTimers()
    })

    it('should not block redirect flow when providers fail', async () => {
      // Use real timers to test actual timeout behavior
      vi.useRealTimers()

      const providers = [
        createFailureMock({ delay: 100 }),
        createTimeoutMock({ delay: 5000 }),
        createFailureMock({ delay: 50 })
      ]

      const startTime = Date.now()
      const result = await routeAnalyticsEventForTesting(providers, testEvent)
      const endTime = Date.now()

      // Should complete within timeout bounds (router timeout is 2000ms)
      // 2 failure providers + 1 timeout provider = 3 total failures
      expect(endTime - startTime).toBeLessThan(3000)
      expect(result.timedOut).toBe(1) // 1 timeout (subset of failures)
      expect(result.failed).toBe(3) // 2 regular failures + 1 timeout = 3 total

      vi.useFakeTimers()
    })

    it('should handle concurrent provider execution', async () => {
      // Use real timers to verify parallel execution
      vi.useRealTimers()

      const providers = [
        createSuccessMock({ delay: 1000 }),
        createSuccessMock({ delay: 1000 }),
        createSuccessMock({ delay: 1000 })
      ]

      // All providers should execute in parallel, not sequentially
      const startTime = Date.now()
      const result = await routeAnalyticsEventForTesting(providers, testEvent)
      const endTime = Date.now()

      // Should complete in ~1000ms, not 3000ms (parallel execution)
      expect(endTime - startTime).toBeLessThan(1500)
      expect(result.successful).toBe(3)

      vi.useFakeTimers()
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
