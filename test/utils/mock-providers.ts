/**
 * Provider Mocks for Testing
 *
 * Implements AnalyticsProvider interface with various mock behaviors
 * for testing analytics routing and provider management
 *
 * Part of Epic 7: Analytics Abstraction (Story 7.2)
 */

import { AnalyticsEvent, AnalyticsAttributes } from '../../src/lib/analytics/types';
import { AnalyticsProvider } from '../../src/lib/analytics/provider';

/**
 * Base mock provider with configurable name and delay
 */
abstract class BaseMockProvider implements AnalyticsProvider {
  constructor(public readonly name: string = 'mock', protected delay: number = 0) {}

  isConfigured(): boolean {
    return true // Mock providers are always configured
  }

  abstract send(event: AnalyticsEvent): Promise<void>
}

/**
 * Mock provider that always resolves successfully
 */
export class SuccessMockProvider extends BaseMockProvider {
  constructor(name: string = 'mock', delay: number = 0) {
    super(name, delay)
  }

  async send(event: AnalyticsEvent): Promise<void> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay))
    }
    // Silent success
  }
}

/**
 * Mock provider that always rejects with error
 */
export class FailureMockProvider extends BaseMockProvider {
  constructor(
    public readonly name: string = 'mock',
    protected delay: number = 0,
    private errorMessage: string = 'Mock provider failed to send event'
  ) {
    super(name, delay)
  }

  async send(event: AnalyticsEvent): Promise<void> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay))
    }
    throw new Error(this.errorMessage)
  }
}

/**
 * Mock provider that never resolves (hangs forever)
 */
export class TimeoutMockProvider extends BaseMockProvider {
  constructor(
    public readonly name: string = 'mock',
    private timeoutDelay: number = 0
  ) {
    super(name, 0) // Delay not used in timeout provider
  }

  async send(event: AnalyticsEvent): Promise<void> {
    if (this.timeoutDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.timeoutDelay))
    }
    // Never resolve - hangs forever
    return new Promise(() => {})
  }
}

/**
 * Disabled mock provider for testing scenarios where
 * provider should not send events
 */
export class DisabledMockProvider extends BaseMockProvider {
  async send(event: AnalyticsEvent): Promise<void> {
    // Silent - no action
  }
}

/**
 * Bulk mock provider for testing multiple event scenarios
 */
export class BulkMockProvider extends BaseMockProvider {
  constructor(name: string = 'mock', private successRate: number = 1.0) {
    super(name, 0)
  }

  async send(event: AnalyticsEvent): Promise<void> {
    const shouldSucceed = Math.random() < this.successRate
    if (!shouldSucceed) {
      throw new Error('Bulk provider failed randomly')
    }
  }
}

/**
 * Factory function to create success mock provider
 */
export function createSuccessMock(options: { name?: string; delay?: number } = {}): SuccessMockProvider {
  const { name = 'SuccessMock', delay = 0 } = options
  return new SuccessMockProvider(name, delay)
}

/**
 * Factory function to create failure mock provider
 */
export function createFailureMock(options: { name?: string; delay?: number; errorMessage?: string } = {}): FailureMockProvider {
  const {
    name = 'FailureMock',
    delay = 0,
    errorMessage = 'Mock provider failed to send event'
  } = options
  return new FailureMockProvider(name, delay, errorMessage)
}

/**
 * Factory function to create timeout mock provider
 */
export function createTimeoutMock(options: { name?: string; delay?: number } = {}): TimeoutMockProvider {
  const { name = 'TimeoutMock', delay = 0 } = options
  return new TimeoutMockProvider(name, delay)
}

/**
 * Factory function to create disabled mock provider
 */
export function createDisabledMock(options: { name?: string } = {}): DisabledMockProvider {
  const { name = 'DisabledMock' } = options
  return new DisabledMockProvider(name)
}

/**
 * Factory function to create bulk mock provider
 */
export function createBulkMock(options: { name?: string; successRate?: number } = {}): BulkMockProvider {
  const { name = 'BulkMock', successRate = 1.0 } = options
  return new BulkMockProvider(name, successRate)
}

/**
 * Types for createProvidersByType function
 */
export type ProviderType = 'all-success' | 'all-failure' | 'mixed' | 'bulk'

/**
 * Factory function to create arrays of mock providers by type
 */
export function createProvidersByType(type: ProviderType): AnalyticsProvider[] {
  switch (type) {
    case 'all-success':
      return [
        createSuccessMock({ name: 'Success1' }),
        createSuccessMock({ name: 'Success2' }),
        createSuccessMock({ name: 'Success3' })
      ]

    case 'all-failure':
      return [
        createFailureMock({ name: 'Failure1' }),
        createFailureMock({ name: 'Failure2' }),
        createFailureMock({ name: 'Failure3' })
      ]

    case 'mixed':
      return [
        createSuccessMock({ name: 'Success1' }),
        createFailureMock({ name: 'Failure1' }),
        createSuccessMock({ name: 'Success2' }),
        createTimeoutMock({ name: 'Timeout1' })
      ]

    case 'bulk':
      return [
        createBulkMock({ name: 'Bulk1', successRate: 0.8 }),
        createBulkMock({ name: 'Bulk2', successRate: 0.6 }),
        createBulkMock({ name: 'Bulk3', successRate: 1.0 })
      ]

    default:
      throw new Error(`Unknown provider type: ${type}`)
  }
}