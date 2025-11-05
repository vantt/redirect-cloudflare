/**
 * Configuration Testing Helpers
 *
 * Ergonomic wrapper functions around test environment fixtures.
 * Provides convenience functions and re-exports commonly used presets.
 *
 * Updated in Story 7.9: All test environments now include proper KV namespace mocks
 * with functional get/put/delete/list methods. No need to manually add KV bindings.
 */

import { 
  defaultTestEnv, 
  testEnvWithGA4, 
  testEnvMinimal, 
  testEnvInvalid, 
  createTestEnv 
} from '../fixtures/env.js'
import type { Env } from '../../src/types/env.js'

/**
 * Convenience wrapper around createTestEnv
 * Provides a more ergonomic name for test authors
 *
 * Story 7.9: Automatically includes proper KV namespace mocks.
 * All returned Env objects have functional REDIRECT_KV.
 * Note: ANALYTICS_KV removed - retry queue deferred to Epic 9
 *
 * @param overrides - Partial Env properties to customize the test environment
 * @returns Complete Env object suitable for testing with KV bindings
 *
 * @example
 * ```typescript
 * const env = createMockEnv({ ALLOWED_DOMAINS: 'example.com' })
 * await app.request('/r?to=https://example.com', {}, env)
 * ```
 */
export function createMockEnv(overrides: Partial<Env> = {}): Env {
  return createTestEnv(overrides)
}

// Re-export commonly used fixture presets for direct import
export { 
  defaultTestEnv,
  testEnvWithGA4,
  testEnvMinimal,
  testEnvInvalid
}

// Re-export createTestEnv for advanced usage
export { createTestEnv }

/**
 * Helper to create environment with multiple analytics providers
 * Useful for testing provider routing and fanout scenarios
 */
export function createTestEnvWithMultipleProviders(providers: string[] = ['ga4', 'mixpanel']): Env {
  return createTestEnv({
    ENABLE_TRACKING: 'true',
    ANALYTICS_PROVIDERS: providers.join(','),
    GA4_MEASUREMENT_ID: providers.includes('ga4') ? 'G-TEST123456' : undefined,
    GA4_API_SECRET: providers.includes('ga4') ? 'test_secret_12345' : undefined,
    MIXPANEL_TOKEN: providers.includes('mixpanel') ? 'test_mixpanel_token' : undefined
  })
}

/**
 * Helper to create environment for testing domain validation
 * @param allowedDomains - Comma-separated list of allowed domains
 * @returns Env configured for domain validation testing
 */
export function createTestEnvForDomains(allowedDomains: string): Env {
  return createTestEnv({
    ALLOWED_DOMAINS: allowedDomains
  })
}

/**
 * Helper to create environment for testing timeout scenarios
 * @param timeoutMs - Timeout in milliseconds for analytics providers
 * @returns Env configured for timeout testing
 */
export function createTestEnvForTimeout(timeoutMs: number): Env {
  return createTestEnv({
    ENABLE_TRACKING: 'true',
    ANALYTICS_PROVIDERS: 'ga4',
    GA4_MEASUREMENT_ID: 'G-TEST123456',
    GA4_API_SECRET: 'test_secret_12345',
    ANALYTICS_TIMEOUT_MS: timeoutMs.toString()
  })
}