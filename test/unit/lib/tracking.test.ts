import { describe, it, expect } from 'vitest';
import { buildGA4Payload } from '../../../src/lib/tracking';
import { TrackingParams } from '../../../src/types/env';

describe('buildGA4Payload', () => {
  const measurementId = 'G-XXXXXXXXXX';

  it('should build a GA4 payload with full parameters', () => {
    const params: TrackingParams = {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'summer_sale',
      utm_content: 'banner_ad',
      utm_term: 'running_shoes',
      xptdk: '12345',
      ref: 'facebook',
    };

    const payload = buildGA4Payload(params, measurementId) as any;

    expect(payload.client_id).toBeDefined();
    expect(payload.events).toHaveLength(1);
    expect(payload.events[0].name).toBe('redirect_click');
    expect(payload.events[0].params).toEqual(params);
  });

  it('should build a GA4 payload with minimal parameters', () => {
    const params: TrackingParams = {
      utm_source: 'facebook',
    };

    const payload = buildGA4Payload(params, measurementId) as any;

    expect(payload.client_id).toBeDefined();
    expect(payload.events).toHaveLength(1);
    expect(payload.events[0].name).toBe('redirect_click');
    expect(payload.events[0].params).toEqual(params);
  });

  it('should build a GA4 payload with custom parameters', () => {
    const params: TrackingParams = {
      xptdk: 'shopee-123',
      ref: 'fb-post',
    };

    const payload = buildGA4Payload(params, measurementId) as any;

    expect(payload.client_id).toBeDefined();
    expect(payload.events).toHaveLength(1);
    expect(payload.events[0].name).toBe('redirect_click');
    expect(payload.events[0].params).toEqual(params);
  });

  it('should omit undefined fields from the payload', () => {
    const params: TrackingParams = {
      utm_source: 'google',
      utm_medium: undefined,
    };

    const payload = buildGA4Payload(params, measurementId) as any;

    expect(payload.events[0].params).toEqual({ utm_source: 'google' });
  });

  it('should throw if measurementId is missing', () => {
    expect(() => buildGA4Payload({}, '')).toThrowError('GA4 measurement ID is required to build payload');
  });
});
