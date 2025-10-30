/**
 * Test Environment Fixtures for Env Interface
 *
 * Shared test fixtures providing consistent Env setups across unit and integration tests.
 * All fixtures are typed with Env interface from src/types/env.ts.
 *
 * Updated in Story 7.9: Now uses proper KV namespace mocks instead of empty objects
 */

import type { Env } from '../../src/types/env.js'
import { createMockKV } from '../utils/mock-kv.js'

/**
 * Default test environment with safe baseline values
 * Used as foundation for most test scenarios
 *
 * Story 7.9: Now uses proper KV mocks with functional get/put/delete methods
 */
export const defaultTestEnv: Partial<Env> = {
  REDIRECT_KV: createMockKV(),
  ANALYTICS_KV: createMockKV(),
  ALLOWED_DOMAINS: 'example.com,test.com',
  ENABLE_TRACKING: 'false',
  DEFAULT_REDIRECT_URL: 'https://example.com',
  ANALYTICS_PROVIDERS: '',
  ANALYTICS_TIMEOUT_MS: '2000'
}

/**
 * Test environment with GA4 analytics enabled
 * Includes non-production GA4 credentials for testing analytics flows
 *
 * Story 7.9: Now uses proper KV mocks
 */
export const testEnvWithGA4: Env = {
  REDIRECT_KV: createMockKV(),
  ANALYTICS_KV: createMockKV(),
  ALLOWED_DOMAINS: 'example.com,test.com',
  ENABLE_TRACKING: 'true',
  DEFAULT_REDIRECT_URL: 'https://example.com',
  ANALYTICS_PROVIDERS: 'ga4',
  GA4_MEASUREMENT_ID: 'G-TEST123456',
  GA4_API_SECRET: 'test_secret_12345',
  ANALYTICS_TIMEOUT_MS: '2000'
}

/**
 * Minimal test environment with only required fields
 * Useful for testing core redirect functionality without analytics
 *
 * Story 7.9: Now uses proper KV mocks
 */
export const testEnvMinimal: Env = {
  REDIRECT_KV: createMockKV(),
  ANALYTICS_KV: createMockKV(),
  ENABLE_TRACKING: 'false',
  ANALYTICS_TIMEOUT_MS: '2000'
}

/**
 * Test environment with invalid configuration for error testing
 * Includes malformed values to test validation logic
 *
 * Story 7.9: Now uses proper KV mocks
 */
export const testEnvInvalid: Partial<Env> = {
  REDIRECT_KV: createMockKV(),
  ANALYTICS_KV: createMockKV(),
  ALLOWED_DOMAINS: '', // Empty domain list - should cause validation error
  ENABLE_TRACKING: 'invalid_boolean', // Invalid boolean value
  ANALYTICS_PROVIDERS: 'unknown_provider', // Unknown provider
  GA4_MEASUREMENT_ID: '', // Empty GA4 ID when providers includes ga4
  ANALYTICS_TIMEOUT_MS: '-1000' // Negative timeout
}

/**
 * Factory function to create test environments with custom overrides
 * Performs deep merge to avoid mutating base fixtures
 *
 * Story 7.9: Now creates fresh KV mocks for each test to prevent state leakage
 *
 * @param overrides - Partial Env properties to override defaults
 * @returns Complete Env object with merged properties
 */
export function createTestEnv(overrides: Partial<Env> = {}): Env {
  // Start with default test env as base
  const base: Partial<Env> = { ...defaultTestEnv }

  // Merge overrides deeply (one level deep for Env interface)
  const merged = { ...base, ...overrides }

  // Ensure required KV namespaces are always present with fresh mocks
  // Use overrides if provided, otherwise create new mocks
  return {
    REDIRECT_KV: overrides.REDIRECT_KV || createMockKV(),
    ANALYTICS_KV: overrides.ANALYTICS_KV || createMockKV(),
    ...merged
  } as Env
}