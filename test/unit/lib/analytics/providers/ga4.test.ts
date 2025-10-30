import { describe, it, expect, vi } from 'vitest';
import { AnalyticsEvent, EventName, AttributeKey } from '../../../../../src/lib/analytics/types';
import { ExampleGA4Provider } from '../../../../../src/lib/analytics/providers/ga4';

describe('ExampleGA4Provider', () => {
  it('should implement AnalyticsProvider interface', () => {
    const provider = new ExampleGA4Provider('GA_MEASUREMENT_ID', 'API_SECRET');
    
    // Should have send method
    expect(typeof provider.send).toBe('function');
  });

  it('should throw error when trying to send (example only)', async () => {
    const provider = new ExampleGA4Provider('GA_MEASUREMENT_ID', 'API_SECRET');
    
    const event: AnalyticsEvent = {
      name: EventName.REDIRECT_CLICK,
      attributes: {
        utm_source: 'google',
        utm_medium: 'cpc'
      }
    };

    await expect(provider.send(event)).rejects.toThrow('Example provider - implement in Epic 8');
  });

  it('should demonstrate attribute mapping logic', () => {
    const provider = new ExampleGA4Provider('GA_MEASUREMENT_ID', 'API_SECRET');
    
    const event: AnalyticsEvent = {
      name: EventName.REDIRECT_CLICK,
      attributes: {
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: 'spring_sale',
        xptdk: 'shopee_data',
        session_count: 3,
        is_mobile: true
      }
    };

    // Access private method through type assertion for testing
    const providerAny = provider as any;
    const mapped = providerAny.mapAttributes(event.attributes);

    expect(mapped.utm_source).toBe('facebook');
    expect(mapped.utm_medium).toBe('social');
    expect(mapped.utm_campaign).toBe('spring_sale');
    expect(mapped.xptdk).toBe('shopee_data');
    
    // Should include non-standard attributes as well, converting all to string
    expect(mapped.session_count).toBe('3');
    expect(mapped.is_mobile).toBe('true');
  });

  it('should handle empty attributes gracefully', () => {
    const provider = new ExampleGA4Provider('GA_MEASUREMENT_ID', 'API_SECRET');
    
    const event: AnalyticsEvent = {
      name: EventName.REDIRECT_CLICK,
      attributes: {}
    };

    const providerAny = provider as any;
    const mapped = providerAny.mapAttributes(event.attributes);

    expect(Object.keys(mapped)).toHaveLength(0);
  });

  it('should convert all values to strings', () => {
    const provider = new ExampleGA4Provider('GA_MEASUREMENT_ID', 'API_SECRET');
    
    const event: AnalyticsEvent = {
      name: EventName.REDIRECT_CLICK,
      attributes: {
        utm_source: 'google',
        session_count: 42,
        is_premium: false
      }
    };

    const providerAny = provider as any;
    const mapped = providerAny.mapAttributes(event.attributes);

    expect(typeof mapped.utm_source).toBe('string');
    expect(mapped.utm_source).toBe('google');
    expect(typeof mapped.session_count).toBe('string');
    expect(mapped.session_count).toBe('42');
    expect(typeof mapped.is_premium).toBe('string');
    expect(mapped.is_premium).toBe('false');
  });
});