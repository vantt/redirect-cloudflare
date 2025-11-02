import { GA4Provider } from '../ga4';
import type { GA4Config } from '../ga4/types';

/**
 * GA4 Provider Factory
 *
 * Factory function to create GA4 provider instances for the analytics registry.
 * Uses the new GA4Provider implementation from src/lib/analytics/ga4/.
 *
 * Part of Epic 8: GA4 Provider Implementation
 */

/**
 * Creates a GA4 provider instance from environment configuration
 *
 * @param env - Environment variables containing GA4 configuration
 * @returns GA4Provider instance
 */
export function createGA4Provider(env: any): GA4Provider {
  const config: GA4Config = {
    measurementId: env.GA4_MEASUREMENT_ID || '',
    apiSecret: env.GA4_API_SECRET || '',
    debug: env.GA4_DEBUG === 'true',
    defaultParameters: {}
  };

  return new GA4Provider(config);
}

// Re-export for backward compatibility
export { GA4Provider } from '../ga4';
export type { GA4Config } from '../ga4/types';