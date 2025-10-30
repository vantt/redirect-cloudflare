/**
 * Provider Mocks Unit Tests
 * 
 * Tests that provider mocks implement AnalyticsProvider interface correctly
 * and behave as expected in success, failure, and timeout scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnalyticsEvent, EventName } from '../../../../../src/lib/analytics/types'
import { 
  SuccessMockProvider, 
  FailureMockProvider, 
  TimeoutMockProvider,
  createSuccessMock,
  createFailureMock,
  createTimeoutMock,
  createProvidersByType
} from '../../../../utils/mock-providers';

describe('Provider Mocks', () => {
  let testEvent: AnalyticsEvent

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    testEvent = {
      name: EventName.REDIRECT_CLICK,
      attributes: {
        utm_source: 'test',
        utm_medium: 'cpc',
        utm_campaign: 'test-campaign'
      }
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('SuccessMockProvider', () => {
    it('should implement AnalyticsProvider interface', () => {
      const provider = createSuccessMock()
      expect(typeof provider.send).toBe('function')
    })

    it('should resolve successfully without delay', async () => {
      const provider = createSuccessMock({ name: 'TestSuccess' })
      
      await expect(provider.send(testEvent)).resolves.not.toThrow()
    })

    it('should resolve successfully after configured delay', async () => {
      const provider = createSuccessMock({ delay: 1000 })
      const sendPromise = provider.send(testEvent)
      
      // Should not resolve immediately
      await vi.advanceTimersByTime(999)
      await expect(Promise.resolve()).resolves.toBeUndefined()
      
      // Should resolve after delay
      await vi.advanceTimersByTime(1)
      await expect(sendPromise).resolves.not.toThrow()
    })
  })

  describe('FailureMockProvider', () => {
    it('should implement AnalyticsProvider interface', () => {
      const provider = createFailureMock()
      expect(typeof provider.send).toBe('function')
    })

    it('should reject with default error message', async () => {
      const provider = createFailureMock({ name: 'TestFailure' })
      
      await expect(provider.send(testEvent)).rejects.toThrow('Mock provider failed to send event')
    })

    it('should reject with custom error message', async () => {
      const customError = 'Custom provider error message'
      const provider = createFailureMock({ errorMessage: customError })
      
      await expect(provider.send(testEvent)).rejects.toThrow(customError)
    })

    it('should reject after configured delay', async () => {
      const provider = createFailureMock({ delay: 1000 })
      const sendPromise = provider.send(testEvent)
      
      // Should not reject immediately
      await vi.advanceTimersByTime(999)
      await expect(Promise.resolve()).resolves.toBeUndefined()
      
      // Should reject after delay
      await vi.advanceTimersByTime(1)
      await expect(sendPromise).rejects.toThrow()
    })
  })

  describe('TimeoutMockProvider', () => {
    it('should implement AnalyticsProvider interface', () => {
      const provider = createTimeoutMock()
      expect(typeof provider.send).toBe('function')
    })

    it('should never resolve (hang forever)', async () => {
      const provider = createTimeoutMock({ name: 'TestTimeout', delay: 1000 })
      const sendPromise = provider.send(testEvent)
      
      // Should still be pending after the configured timeout
      await vi.advanceTimersByTime(2000)
      await expect(Promise.resolve()).resolves.toBeUndefined()
      
      // Should still be pending even after long time
      await vi.advanceTimersByTime(10000)
      await expect(Promise.resolve()).resolves.toBeUndefined()
    })
  })

  describe('Provider Factory Functions', () => {
    it('should create success mock with correct name', () => {
      const provider = createSuccessMock({ name: 'CustomSuccess' })
      expect(provider).toBeInstanceOf(SuccessMockProvider)
    })

    it('should create failure mock with custom error', () => {
      const provider = createFailureMock({ 
        name: 'CustomFailure',
        errorMessage: 'Custom error' 
      })
      expect(provider).toBeInstanceOf(FailureMockProvider)
    })

    it('should create timeout mock with custom delay', () => {
      const provider = createTimeoutMock({ delay: 5000 })
      expect(provider).toBeInstanceOf(TimeoutMockProvider)
    })
  })

  describe('createProvidersByType', () => {
    it('should create all-success providers', () => {
      const providers = createProvidersByType('all-success')
      
      expect(providers).toHaveLength(3)
      expect(providers[0].name).toBe('Success1')
      expect(providers[1].name).toBe('Success2')
      expect(providers[2].name).toBe('Success3')
    })

    it('should create all-failure providers', () => {
      const providers = createProvidersByType('all-failure')
      
      expect(providers).toHaveLength(3)
      providers.forEach((provider) => {
        expect(provider).toBeInstanceOf(FailureMockProvider)
      })
    })

    it('should create mixed providers', () => {
      const providers = createProvidersByType('mixed')
      
      expect(providers).toHaveLength(4)
      expect(providers[0]).toBeInstanceOf(SuccessMockProvider)
      expect(providers[1]).toBeInstanceOf(FailureMockProvider)
      expect(providers[2]).toBeInstanceOf(SuccessMockProvider)
      expect(providers[3]).toBeInstanceOf(TimeoutMockProvider)
    })

    it('should throw error for unknown provider type', () => {
      expect(() => createProvidersByType('unknown' as any)).toThrow('Unknown provider type: unknown')
    })
  })

  describe('Event Handling', () => {
    it('should handle events with different attribute types', async () => {
      const provider = createSuccessMock()
      const complexEvent: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'test',
          click_count: 5,
          is_mobile: true,
          timestamp: Date.now()
        }
      }
      
      await expect(provider.send(complexEvent)).resolves.not.toThrow()
    })

    it('should handle events with no attributes', async () => {
      const provider = createSuccessMock()
      const emptyEvent: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {}
      }
      
      await expect(provider.send(emptyEvent)).resolves.not.toThrow()
    })
  })
})
