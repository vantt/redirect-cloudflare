/**
 * Analytics Provider Mocks
 * 
 * Mock implementations of AnalyticsProvider for testing various scenarios:
 * - Success: Always succeeds
 * - Failure: Always fails with error
 * - Timeout: Always times out
 * 
 * Used in E2E tests to verify router behavior under different conditions
 */

import { AnalyticsProvider } from '../../../../src/lib/analytics/provider'
import { AnalyticsEvent } from '../../../../src/lib/analytics/types'

/**
 * Configuration for mock providers
 */
export interface MockProviderConfig {
  /** Name of the mock provider */
  name: string
  /** Delay in milliseconds before resolving/rejecting */
  delay?: number
  /** Error message to throw (for failure mock) */
  errorMessage?: string
}

/**
 * Success Mock Provider
 * 
 * Always succeeds after optional delay
 */
export class SuccessMockProvider implements AnalyticsProvider {
  private readonly name: string
  private readonly delay: number

  constructor(config: MockProviderConfig = { name: 'SuccessMock' }) {
    this.name = config.name
    this.delay = config.delay || 0
  }

  async send(event: AnalyticsEvent): Promise<void> {
    // Simulate network delay if configured
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay))
    }

    // Log success for debugging (not in production)
    console.log(`[${this.name}] ✓ Event sent: ${event.name}`, {
      attributeCount: Object.keys(event.attributes).length
    })
  }
}

/**
 * Failure Mock Provider
 * 
 * Always fails with configurable error message
 */
export class FailureMockProvider implements AnalyticsProvider {
  private readonly name: string
  private readonly delay: number
  private readonly errorMessage: string

  constructor(config: MockProviderConfig = { 
    name: 'FailureMock',
    errorMessage: 'Mock provider failed to send event'
  }) {
    this.name = config.name
    this.delay = config.delay || 0
    this.errorMessage = config.errorMessage || 'Mock provider failed to send event'
  }

  async send(event: AnalyticsEvent): Promise<void> {
    // Simulate network delay if configured
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay))
    }

    // Log failure for debugging (not in production)
    console.log(`[${this.name}] ✗ Event failed: ${event.name}`, {
      attributeCount: Object.keys(event.attributes).length,
      error: this.errorMessage
    })

    throw new Error(this.errorMessage)
  }
}

/**
 * Timeout Mock Provider
 * 
 * Always times out after specified duration (default 3000ms)
 */
export class TimeoutMockProvider implements AnalyticsProvider {
  private readonly name: string
  private readonly timeoutMs: number

  constructor(config: MockProviderConfig = { name: 'TimeoutMock' }) {
    this.name = config.name
    this.timeoutMs = config.delay || 3000
  }

  async send(event: AnalyticsEvent): Promise<void> {
    // Log timeout attempt for debugging (not in production)
    console.log(`[${this.name}] ⏱️ Event timeout: ${event.name}`, {
      attributeCount: Object.keys(event.attributes).length,
      timeoutMs: this.timeoutMs
    })

    // Wait for timeout duration, then never resolve/reject
    // This simulates a hanging request
    await new Promise(() => {
      // Never resolve - this will cause timeout
      setTimeout(() => {
        // This will never be reached
      }, this.timeoutMs)
    })
  }
}

/**
 * Provider factory functions for easy test setup
 */

export function createSuccessMock(config?: Partial<MockProviderConfig>): SuccessMockProvider {
  return new SuccessMockProvider({ name: 'SuccessMock', ...config })
}

export function createFailureMock(config?: Partial<MockProviderConfig>): FailureMockProvider {
  return new FailureMockProvider({ 
    name: 'FailureMock',
    errorMessage: 'Mock provider failed to send event',
    ...config 
  })
}

export function createTimeoutMock(config?: Partial<MockProviderConfig>): TimeoutMockProvider {
  return new TimeoutMockProvider({ name: 'TimeoutMock', ...config })
}

/**
 * Create an array of providers for testing
 */
export function createMockProviders(): AnalyticsProvider[] {
  return [
    createSuccessMock({ name: 'SuccessProvider1' }),
    createFailureMock({ name: 'FailureProvider1', errorMessage: 'First provider failed' }),
    createSuccessMock({ name: 'SuccessProvider2' }),
    createTimeoutMock({ name: 'TimeoutProvider1', delay: 5000 })
  ]
}

/**
 * Create providers by type for specific test scenarios
 */
export function createProvidersByType(type: 'all-success' | 'all-failure' | 'mixed'): AnalyticsProvider[] {
  switch (type) {
    case 'all-success':
      return [
        createSuccessMock({ name: 'Success1' }),
        createSuccessMock({ name: 'Success2' }),
        createSuccessMock({ name: 'Success3' })
      ]
    
    case 'all-failure':
      return [
        createFailureMock({ name: 'Failure1', errorMessage: 'Provider 1 crashed' }),
        createFailureMock({ name: 'Failure2', errorMessage: 'Provider 2 error' }),
        createFailureMock({ name: 'Failure3', errorMessage: 'Provider 3 failed' })
      ]
    
    case 'mixed':
      return [
        createSuccessMock({ name: 'MixedSuccess1' }),
        createFailureMock({ name: 'MixedFailure1', errorMessage: 'Mixed provider error' }),
        createSuccessMock({ name: 'MixedSuccess2' }),
        createTimeoutMock({ name: 'MixedTimeout1', delay: 4000 })
      ]
    
    default:
      throw new Error(`Unknown provider type: ${type}`)
  }
}