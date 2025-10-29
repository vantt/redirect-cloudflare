import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackRedirect } from '../../../../src/lib/analytics/tracking-service';
import * as router from '../../../../src/lib/analytics/router';
import * as registry from '../../../../src/lib/analytics/registry';
import { defaultTestEnv } from '../../../fixtures/env';

describe('TrackingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract params from destination only', async () => {
    const routeAnalyticsEventSpy = vi.spyOn(router, 'routeAnalyticsEvent');
    const loadProvidersSpy = vi.spyOn(registry, 'loadProviders').mockReturnValue([{} as any]);

    await trackRedirect(
      {
        shortUrl: 'abc',
        destinationUrl: 'https://example.com?utm_source=google',
        redirectType: 'temporary',
      },
      defaultTestEnv
    );

    expect(loadProvidersSpy).toHaveBeenCalled();
    expect(routeAnalyticsEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ utm_source: 'google' }),
      }),
      expect.any(Array)
    );
  });

  it('should extract params from original request only', async () => {
    const routeAnalyticsEventSpy = vi.spyOn(router, 'routeAnalyticsEvent');
    await trackRedirect(
      {
        shortUrl: 'abc',
        destinationUrl: 'https://example.com',
        redirectType: 'temporary',
        originalRequestUrl: 'https://my.app/r?to=abc&utm_source=facebook',
      },
      defaultTestEnv
    );

    expect(routeAnalyticsEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ utm_source: 'facebook' }),
      }),
      expect.any(Array)
    );
  });

  it('should merge params with original winning', async () => {
    const routeAnalyticsEventSpy = vi.spyOn(router, 'routeAnalyticsEvent');
    await trackRedirect(
      {
        shortUrl: 'abc',
        destinationUrl: 'https://example.com?utm_source=google&utm_medium=cpc',
        redirectType: 'temporary',
        originalRequestUrl: 'https://my.app/r?to=abc&utm_source=facebook',
      },
      defaultTestEnv
    );

    expect(routeAnalyticsEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ utm_source: 'facebook', utm_medium: 'cpc' }),
      }),
      expect.any(Array)
    );
  });
});
