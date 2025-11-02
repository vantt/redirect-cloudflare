import { describe, it, expect, vi } from 'vitest';
import { AnalyticsEvent, EventName, AttributeKey } from '../../../../../src/lib/analytics/types';
import { createGA4Provider } from '../../../../../src/lib/analytics/providers/ga4';

describe('GA4 Provider Factory', () => {
  it('should create GA4 provider with environment config', () => {
    const mockEnv = {
      GA4_MEASUREMENT_ID: 'G-TEST123456',
      GA4_API_SECRET: 'test-secret'
    };

    const provider = createGA4Provider(mockEnv);

    expect(provider.name).toBe('ga4');
    expect(typeof provider.send).toBe('function');
  });

  it('should handle missing environment variables', () => {
    const mockEnv = {};

    const provider = createGA4Provider(mockEnv);

    expect(provider.name).toBe('ga4');
    expect(provider.isConfigured()).toBe(false);
  });
});