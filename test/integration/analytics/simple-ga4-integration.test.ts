/**
 * Simple GA4 Integration Test
 *
 * Tests basic GA4 functionality without complex imports
 * by testing the exports directly from the module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock console to avoid noise
const originalConsole = global.console
beforeEach(() => {
  global.console = {
    ...originalConsole,
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
})

afterEach(() => {
  global.console = originalConsole
})

describe('Simple GA4 Integration', () => {
  it('should validate GA4 module structure', async () => {
    // Test that we can import GA4 provider factory
    const { createGA4Provider } = await import('../../../src/lib/analytics/providers/ga4')

    expect(typeof createGA4Provider).toBe('function')

    // Test provider creation
    const mockEnv = {
      GA4_MEASUREMENT_ID: 'G-TEST123456',
      GA4_API_SECRET: 'test-secret',
      GA4_DEBUG: 'false'
    }

    expect(() => createGA4Provider(mockEnv)).not.toThrow()
  })

  it('should create GA4 provider with valid configuration', async () => {
    const { createGA4Provider } = await import('../../../src/lib/analytics/providers/ga4')

    const mockEnv = {
      GA4_MEASUREMENT_ID: 'G-TEST123456',
      GA4_API_SECRET: 'test-secret',
      GA4_DEBUG: 'false'
    }

    const provider = createGA4Provider(mockEnv)

    expect(provider).toBeDefined()
    expect(provider.name).toBe('ga4')
    expect(typeof provider.send).toBe('function')
  })

  it('should handle GA4 provider with missing configuration', async () => {
    const { createGA4Provider } = await import('../../../src/lib/analytics/providers/ga4')

    const invalidEnv = {
      GA4_MEASUREMENT_ID: '',
      GA4_API_SECRET: ''
    }

    // Should not throw error, but provider may be disabled
    expect(() => createGA4Provider(invalidEnv)).not.toThrow()
  })

  it('should test GA4 payload builder', async () => {
    // Test payload builder separately
    const { buildGA4Payload } = await import('../../../src/lib/analytics/ga4/payload-builder')

    const mockEvent = {
      name: 'redirect_click',
      attributes: {
        utm_source: 'google',
        utm_medium: 'organic',
        short_url: 'short.ly/test'
      }
    }

    const payload = buildGA4Payload(mockEvent, 'G-TEST123456')

    expect(payload).toBeDefined()
    expect(payload.client_id).toBeDefined()
    expect(payload.events).toHaveLength(1)
    expect(payload.events[0].name).toBe('redirect_click')
  })

  it('should test analytics registry with GA4', async () => {
    const { loadProviders } = await import('../../../src/lib/analytics/registry')

    const mockEnv = {
      ANALYTICS_PROVIDERS: 'ga4',
      GA4_MEASUREMENT_ID: 'G-TEST123456',
      GA4_API_SECRET: 'test-secret',
      ENABLE_TRACKING: 'true'
    }

    const providers = loadProviders(mockEnv as any)

    expect(providers).toHaveLength(1)
    expect(providers[0].name).toBe('ga4')
  })

  it('should test analytics registry without GA4', async () => {
    const { loadProviders } = await import('../../../src/lib/analytics/registry')

    const mockEnv = {
      ANALYTICS_PROVIDERS: '',
      ENABLE_TRACKING: 'true'
    }

    const providers = loadProviders(mockEnv as any)

    expect(providers).toHaveLength(0)
  })
})