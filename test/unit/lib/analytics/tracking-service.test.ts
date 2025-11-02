import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackRedirect } from '../../../../src/lib/analytics/tracking-service';
import * as router from '../../../../src/lib/analytics/router';
import * as registry from '../../../../src/lib/analytics/registry';
import { createTestEnv } from '../../../fixtures/env';
import { AnalyticsProvider } from '../../../../src/lib/analytics/provider';

class MockProvider implements AnalyticsProvider {
  readonly name = 'mock-provider';

  async send(): Promise<void> {
    // do nothing
  }
}

describe('TrackingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(registry, 'loadProviders').mockReturnValue([new MockProvider()]);
    vi.spyOn(router, 'routeAnalyticsEvent').mockImplementation(async () => {});
  });

  it('should extract params from destination only', async () => {
    await trackRedirect(
      {
        shortUrl: 'abc',
        destinationUrl: 'https://example.com?utm_source=google',
        redirectType: 'temporary',
      },
      createTestEnv()
    );

    expect(registry.loadProviders).toHaveBeenCalled();
    expect(router.routeAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'redirect_click',
        attributes: expect.objectContaining({
          utm_source: 'google',
          short_url: 'abc',
          destination_url: 'https://example.com?utm_source=google',
          redirect_type: 'temporary'
        }),
      }),
      expect.any(Array)
    );
  });

  it('should extract params from original request only', async () => {
    await trackRedirect(
      {
        shortUrl: 'abc',
        destinationUrl: 'https://example.com',
        redirectType: 'temporary',
        originalRequestUrl: 'https://my.app/r?to=abc&utm_source=facebook',
      },
      createTestEnv()
    );

    expect(router.routeAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'redirect_click',
        attributes: expect.objectContaining({
          utm_source: 'facebook',
          short_url: 'abc',
          destination_url: 'https://example.com',
          redirect_type: 'temporary'
        }),
      }),
      expect.any(Array)
    );
  });

  it('should merge params with original winning', async () => {
    await trackRedirect(
      {
        shortUrl: 'abc',
        destinationUrl: 'https://example.com?utm_source=google&utm_medium=cpc',
        redirectType: 'temporary',
        originalRequestUrl: 'https://my.app/r?to=abc&utm_source=facebook',
      },
      createTestEnv()
    );

    expect(router.routeAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'redirect_click',
        attributes: expect.objectContaining({
          utm_source: 'facebook',  // original wins
          utm_medium: 'cpc',
          short_url: 'abc',
          destination_url: 'https://example.com?utm_source=google&utm_medium=cpc',
          redirect_type: 'temporary'
        }),
      }),
      expect.any(Array)
    );
  });
});
