/**
 * Provider Mocks for Testing
 * 
 * Mock implementations of AnalyticsProvider for testing router behavior.
 * These mocks simulate success, failure, and timeout scenarios.
 * 
 * Part of Story 7.7: Test Harness + Provider Mocks
 */

import { AnalyticsEvent, EventName, AttributeKey } from '../../../src/lib/analytics/types'
import { AnalyticsProvider } from '../../../src/lib/analytics/provider'

/**
 * Base mock provider with configurable behavior
 */
export class MockProvider implements AnalyticsProvider {
  private name: string
  private behavior: 'success' | 'failure' | 'timeout' | 'slow'
  private delay: number

  constructor(name: string, behavior: 'success' | 'failure' | 'timeout' | 'slow' = 'success', delay: number = 0) {
    this.name = name
    this.behavior = behavior
    this.delay = delay
  }

  async send(event: AnalyticsEvent): Promise<void> {
    // Add artificial delay for testing timing
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay))
    }

    switch (this.behavior) {
      case 'success':
        // Do nothing - resolve successfully
        break
        
      case 'failure':
        // Throw error to simulate network failure
        throw new Error(`${this.name} failed to send event`)
        
      case 'timeout':
        // Simulate timeout by hanging longer than expected timeout
        await new Promise(resolve => setTimeout(resolve, 5000))
        break
        
      case 'slow':
        // Simulate slow but successful response
        await new Promise(resolve => setTimeout(resolve, 300))
        break
        
      default:
        throw new Error(`Unknown behavior: ${this.behavior}`)
    }
  }
}

/**
 * Mock provider that simulates timeout behavior
 * Will hang longer than typical timeout to test timeout protection
 */
export class TimeoutMockProvider implements AnalyticsProvider {
  constructor(private timeoutDelay: number = 5000) {}

  async send(event: AnalyticsEvent): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.timeoutDelay))
  }
}

/**
 * Mock provider that simulates authentication failure
 */
export class AuthFailureMockProvider implements AnalyticsProvider {
  constructor(private error: string = 'Authentication failed') {}

  async send(event: AnalyticsEvent): Promise<void> {
    throw new Error(this.error)
  }
}

/**
 * Mock provider that simulates network error
 */
export class NetworkErrorMockProvider implements AnalyticsProvider {
  constructor(private error: string = 'Network error') {}

  async send(event: AnalyticsEvent): Promise<void> {
    throw new Error(this.error)
  }
}

/**
 * Factory function to create mock providers
 */
export function createMockProvider(
  name: string,
  behavior: 'success' | 'failure' | 'timeout' | 'slow' = 'success',
  delay: number = 0
): MockProvider {
  return new MockProvider(name, behavior, delay)
}

export function createSuccessProvider(name: string): MockProvider {
  return createMockProvider(name, 'success')
}

export function createFailureProvider(name: string, error: string): MockProvider {
  return new MockProvider(name, 'failure')
}

export function createTimeoutProvider(delay: number = 5000): TimeoutMockProvider {
  return new TimeoutMockProvider(delay)
}

export function createAuthFailureProvider(name: string, error: string): AuthFailureMockProvider {
  return new AuthFailureMockProvider(name, error)
}

export function createNetworkErrorProvider(name: string, error: string): NetworkErrorMockProvider {
  return new NetworkErrorMockProvider(name, error)
}

/**
 * Utility function to create mock provider arrays for testing
 */
export function createProviderArray(
  configs: Array<{ name: string; behavior?: 'success' | 'failure' | 'timeout' | 'slow'; delay?: number }>
): MockProvider[] {
  return configs.map(config => 
    createMockProvider(config.name, config.behavior || 'success', config.delay)
  )
}