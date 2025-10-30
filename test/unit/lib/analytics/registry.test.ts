import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadProviders } from '../../../../src/lib/analytics/registry';
import { Env } from '../../../../src/types/env';
import { AnalyticsProvider } from '../../../../src/lib/analytics/provider';
import {
  SuccessMockProvider,
  FailureMockProvider,
  TimeoutMockProvider,
} from '../../../utils/mock-providers';

// Helper to create a minimal Env object for testing
function createTestEnv(overrides: Partial<Env> = {}): Env {
  return {
    REDIRECT_KV: {} as any,
    ANALYTICS_KV: {} as any,
    ...overrides,
  };
}

// Mock factories for testing
const mockFactories = {
  success: vi.fn((env: Env) => new SuccessMockProvider('success-mock')),
  failure: vi.fn((env: Env) => new FailureMockProvider('failure-mock')),
  timeout: vi.fn((env: Env) => new TimeoutMockProvider('timeout-mock')),
};

describe('Analytics Registry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadProviders', () => {
    it('should return an empty array when ANALYTICS_PROVIDERS is not set', () => {
      const env = createTestEnv();
      const providers = loadProviders(env, mockFactories);
      expect(providers).toEqual([]);
    });

    it('should load a single provider', () => {
      const env = createTestEnv({ ANALYTICS_PROVIDERS: 'success' });
      const providers = loadProviders(env, mockFactories);
      expect(providers).toHaveLength(1);
      expect(providers[0]).toBeInstanceOf(SuccessMockProvider);
      expect(mockFactories.success).toHaveBeenCalledWith(env);
    });

    it('should load multiple providers', () => {
      const env = createTestEnv({ ANALYTICS_PROVIDERS: 'success,failure' });
      const providers = loadProviders(env, mockFactories);
      expect(providers).toHaveLength(2);
      expect(providers[0]).toBeInstanceOf(SuccessMockProvider);
      expect(providers[1]).toBeInstanceOf(FailureMockProvider);
    });

    it('should handle unknown providers gracefully', () => {
      const env = createTestEnv({ ANALYTICS_PROVIDERS: 'success,unknown,failure' });
      const providers = loadProviders(env, mockFactories);
      expect(providers).toHaveLength(2);
      expect(providers.some(p => p instanceof SuccessMockProvider)).toBe(true);
      expect(providers.some(p => p instanceof FailureMockProvider)).toBe(true);
    });

    it('should handle instantiation errors gracefully', () => {
      mockFactories.failure.mockImplementation(() => {
        throw new Error('Instantiation failed');
      });
      const env = createTestEnv({ ANALYTICS_PROVIDERS: 'success,failure' });
      const providers = loadProviders(env, mockFactories);
      expect(providers).toHaveLength(1);
      expect(providers[0]).toBeInstanceOf(SuccessMockProvider);
    });
  });
});
