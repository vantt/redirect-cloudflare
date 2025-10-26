import { describe, it, expect } from 'vitest'

// Simple direct test to verify fixtures work
describe('Environment Fixtures', () => {
  it('should be able to import fixtures', async () => {
    const { createMockEnv } = await import('../helpers/config.js')
    const env = createMockEnv()
    expect(env.ENABLE_TRACKING).toBe('false')
    expect(env.ANALYTICS_TIMEOUT_MS).toBe('2000')
  })

  it('should create test environment with overrides', async () => {
    const { createMockEnv } = await import('../helpers/config.js')
    const env = createMockEnv({ ENABLE_TRACKING: 'true' })
    expect(env.ENABLE_TRACKING).toBe('true')
    expect(env.ANALYTICS_TIMEOUT_MS).toBe('2000')
  })

  it('should import GA4 environment preset', async () => {
    const { testEnvWithGA4 } = await import('../fixtures/env.js')
    expect(testEnvWithGA4.ENABLE_TRACKING).toBe('true')
    expect(testEnvWithGA4.GA4_MEASUREMENT_ID).toBe('G-TEST123456')
  })
})