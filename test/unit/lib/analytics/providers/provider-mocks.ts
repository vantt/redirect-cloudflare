import { AnalyticsProvider } from '../../../../../src/lib/analytics/provider';
import { AnalyticsEvent } from '../../../../../src/lib/analytics/types';

export class SuccessMockProvider implements AnalyticsProvider {
  constructor(private options: { name?: string, delay?: number } = {}) {}

  async send(event: AnalyticsEvent): Promise<void> {
    if (this.options.delay) {
      await new Promise(resolve => setTimeout(resolve, this.options.delay));
    }
    return Promise.resolve();
  }
}

export class FailureMockProvider implements AnalyticsProvider {
  constructor(private options: { name?: string, delay?: number, errorMessage?: string } = {}) {}

  async send(event: AnalyticsEvent): Promise<void> {
    if (this.options.delay) {
      await new Promise(resolve => setTimeout(resolve, this.options.delay));
    }
    return Promise.reject(new Error(this.options.errorMessage || 'Mock provider failed to send event'));
  }
}

export class TimeoutMockProvider implements AnalyticsProvider {
  constructor(private options: { name?: string, delay?: number } = {}) {}

  async send(event: AnalyticsEvent): Promise<void> {
    return new Promise(() => {}); // Never resolves
  }
}

export function createSuccessMock(options: { name?: string, delay?: number } = {}): AnalyticsProvider {
  return new SuccessMockProvider(options);
}

export function createFailureMock(options: { name?: string, delay?: number, errorMessage?: string } = {}): AnalyticsProvider {
  return new FailureMockProvider(options);
}

export function createTimeoutMock(options: { name?: string, delay?: number } = {}): AnalyticsProvider {
  return new TimeoutMockProvider(options);
}

export function createProvidersByType(type: 'all-success' | 'all-failure' | 'mixed'): AnalyticsProvider[] {
  switch (type) {
    case 'all-success':
      return [new SuccessMockProvider({name: 'Success1'}), new SuccessMockProvider({name: 'Success2'}), new SuccessMockProvider({name: 'Success3'})];
    case 'all-failure':
      return [new FailureMockProvider(), new FailureMockProvider(), new FailureMockProvider()];
    case 'mixed':
      return [new SuccessMockProvider(), new FailureMockProvider(), new SuccessMockProvider(), new TimeoutMockProvider()];
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}
