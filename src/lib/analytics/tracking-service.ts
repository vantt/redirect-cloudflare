import type { Env, TrackingParams, AnalyticsEvent } from '../../types/env';
import { appLogger } from '../../utils/logger';
import { extractTrackingParams } from '../tracking';

export interface RedirectTrackingContext {
  shortUrl: string;
  destinationUrl: string;
  redirectType: 'permanent' | 'temporary';
  userAgent?: string;
  ip?: string;
  originalRequestUrl?: string;
}

function extractTrackingParamsWithFallback(
  destinationUrl: string,
  originalRequestUrl?: string
): TrackingParams {
  const destinationParams = extractTrackingParams(destinationUrl);
  const originalParams = originalRequestUrl ? extractTrackingParams(originalRequestUrl) : {};

  const merged = { ...destinationParams, ...originalParams };

  appLogger.info('Tracking parameter extraction', {
    destination_param_count: Object.keys(destinationParams).length,
    original_param_count: Object.keys(originalParams).length,
    merged_param_count: Object.keys(merged).length,
  });

  return merged;
}

function buildRedirectEvent(
  context: RedirectTrackingContext,
  trackingParams: TrackingParams
): AnalyticsEvent {
  const event: AnalyticsEvent = {
    name: 'redirect_click',
    params: {
      ...trackingParams,
      short_url: context.shortUrl,
      destination_url: context.destinationUrl,
      redirect_type: context.redirectType,
    },
    user_id: context.ip,
    timestamp: new Date().toISOString(),
  };

  if (context.userAgent) {
    event.params.user_agent = context.userAgent;
  }

  return event;
}

import { routeAnalyticsEvent } from './router';
import { loadProviders } from './registry';

export async function trackRedirect(context: RedirectTrackingContext, env: Env): Promise<void> {
  try {
    const trackingParams = extractTrackingParamsWithFallback(
      context.destinationUrl,
      context.originalRequestUrl
    );

    const event = buildRedirectEvent(context, trackingParams);

    const providers = loadProviders(env);

    if (providers.length > 0) {
      await routeAnalyticsEvent(event, providers);
    }
  } catch (error) {
    appLogger.error('Tracking service failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ...context,
    });
  }
}
