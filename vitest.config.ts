/// <reference types="vitest" />

/**
 * Vitest Configuration for Cloudflare Workers Testing
 * 
 * This configuration sets up testing environment for redirect service.
 * 
 * Fixtures and Test Environment:
 * - Shared test environment fixtures are located in test/fixtures/env.ts
 * - Configuration helpers are available in test/helpers/config.ts
 * - Global test setup is handled by test/setup.ts
 * 
 * Usage in tests:
 * import { createMockEnv, testEnvWithGA4 } from './test/helpers/config.ts'
 * const env = createMockEnv({ ENABLE_TRACKING: 'true' })
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts', 'test/**/*.test.js'],
    exclude: ['node_modules', 'dist',],
    testTimeout: 10000,
    hookTimeout: 10000,
    // Temporarily disable setupFiles to isolate issue
    // setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
})