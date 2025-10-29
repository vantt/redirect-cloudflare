import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../../src/index';
import * as trackingService from '../../../src/lib/analytics/tracking-service';
import { defaultTestEnv } from '../../fixtures/env';

describe('Redirect Tracking Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should succeed even if tracking service fails', async () => {
    const trackRedirectSpy = vi.spyOn(trackingService, 'trackRedirect').mockRejectedValue(new Error('Tracking service failed'));

    const res = await app.request('/r?to=https://example.com', {}, defaultTestEnv);

    expect(res.status).toBe(302);
    expect(trackRedirectSpy).toHaveBeenCalled();
  });
});
