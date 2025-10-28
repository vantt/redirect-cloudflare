import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadProviders, getSupportedProviderTokens, validateProviderConfig } from '../../../../src/lib/analytics/registry'
import { Env } from '../../../../src/types/env'

// Mock logger to capture log calls
vi.mock('../../../../src/utils/logger', () => ({
  appLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

// Helper to create minimal Env with required properties
function createTestEnv(overrides: Partial<Env> = {}): Env {
  return {
    REDIRECT_KV: {} as any,
    ANALYTICS_KV: {} as any,
    ...overrides
  }
}

describe('Analytics Registry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadProviders', () => {
    it('should return empty array when ANALYTICS_PROVIDERS is not set', () => {
      const env = createTestEnv()
      
      const providers = loadProviders(env)
      
      expect(providers).toEqual([])
      
      const { appLogger } = require('../../../../src/utils/logger')
      
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics registry: no providers configured',
        expect.objectContaining({ config: undefined })
      )
    })

    it('should return empty array when ANALYTICS_PROVIDERS is empty string', () => {
      const env = createTestEnv({ ANALYTICS_PROVIDERS: '' })
      
      const providers = loadProviders(env)
      
      expect(providers).toEqual([])
      
      const { appLogger } = require('../../../../src/utils/logger')
      
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics registry: empty provider configuration',
        expect.objectContaining({ config: '' })
      )
    })

    it('should return empty array when ANALYTICS_PROVIDERS is whitespace only', () => {
      const env = createTestEnv({ ANALYTICS_PROVIDERS: '   ' })
      
      const providers = loadProviders(env)
      
      expect(providers).toEqual([])
    })

    it('should load single known provider', () => {
      const env = createTestEnv({ 
        ANALYTICS_PROVIDERS: 'ga4',
        GA4_MEASUREMENT_ID: 'GA_MEASUREMENT_ID',
        GA4_API_SECRET: 'GA_API_SECRET'
      })
      
      const providers = loadProviders(env)
      
      expect(providers).toHaveLength(1)
      expect(providers[0].constructor.name).toBe('ExampleGA4Provider')
      
      const { appLogger } = require('../../../../src/utils/logger')
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics registry: loaded provider',
        expect.objectContaining({
          providerToken: 'ga4',
          providerName: 'ExampleGA4Provider'
        })
      )
    })

    it('should load multiple known providers', () => {
      const env = createTestEnv({ 
        ANALYTICS_PROVIDERS: 'ga4,mixpanel',
        GA4_MEASUREMENT_ID: 'GA_MEASUREMENT_ID',
        GA4_API_SECRET: 'GA_API_SECRET',
        MIXPANEL_TOKEN: 'MIXPANEL_TOKEN'
      })
      
      const providers = loadProviders(env)
      
      expect(providers).toHaveLength(2)
      expect(providers[0].constructor.name).toBe('ExampleGA4Provider')
      expect(providers[1].constructor.name).toBe('ExampleMixpanelProvider')
    })

    it('should handle extra whitespace in provider list', () => {
      const env = createTestEnv({ 
        ANALYTICS_PROVIDERS: '  ga4  ,  mixpanel  ',
        GA4_MEASUREMENT_ID: 'GA_MEASUREMENT_ID',
        GA4_API_SECRET: 'GA_API_SECRET',
        MIXPANEL_TOKEN: 'MIXPANEL_TOKEN'
      })
      
      const providers = loadProviders(env)
      
      expect(providers).toHaveLength(2)
      expect(providers.map(p => p.constructor.name)).toEqual(['ExampleGA4Provider', 'ExampleMixpanelProvider'])
    })

    it('should handle unknown provider tokens gracefully', () => {
      const env = createTestEnv({ 
        ANALYTICS_PROVIDERS: 'ga4,unknown,segment',
        GA4_MEASUREMENT_ID: 'GA_MEASUREMENT_ID',
        GA4_API_SECRET: 'GA_API_SECRET'
      })
      
      const providers = loadProviders(env)
      
      // Should load known providers only
      expect(providers).toHaveLength(1)
      expect(providers[0].constructor.name).toBe('ExampleGA4Provider')
      
      const { appLogger } = require('../../../../src/utils/logger')
      expect(appLogger.warn).toHaveBeenCalledWith(
        'Analytics registry: unknown provider token',
        expect.objectContaining({ providerToken: 'unknown' })
      )
      expect(appLogger.warn).toHaveBeenCalledWith(
        'Analytics registry: unknown provider token',
        expect.objectContaining({ providerToken: 'segment' })
      )
    })

    it('should handle provider instantiation errors gracefully', () => {
      const env = createTestEnv({ 
        ANALYTICS_PROVIDERS: 'ga4',
        GA4_MEASUREMENT_ID: undefined, // This might cause instantiation error
        GA4_API_SECRET: 'GA_API_SECRET'
      })
      
      const providers = loadProviders(env)
      
      // Should return empty array due to instantiation error
      expect(providers).toHaveLength(0)
      
      const { appLogger } = require('../../../../src/utils/logger')
      expect(appLogger.error).toHaveBeenCalledWith(
        'Analytics registry: failed to instantiate provider',
        expect.objectContaining({ providerToken: 'ga4' })
      )
    })

    it('should be case insensitive', () => {
      const env = createTestEnv({ 
        ANALYTICS_PROVIDERS: 'GA4,MixPanel',
        GA4_MEASUREMENT_ID: 'GA_MEASUREMENT_ID',
        GA4_API_SECRET: 'GA_API_SECRET',
        MIXPANEL_TOKEN: 'MIXPANEL_TOKEN'
      })
      
      const providers = loadProviders(env)
      
      expect(providers).toHaveLength(2)
      expect(providers.map(p => p.constructor.name)).toEqual(['ExampleGA4Provider', 'ExampleMixpanelProvider'])
    })

    it('should log summary with all configuration details', () => {
      const env = createTestEnv({ 
        ANALYTICS_PROVIDERS: 'ga4,mixpanel,unknown',
        GA4_MEASUREMENT_ID: 'GA_MEASUREMENT_ID',
        GA4_API_SECRET: 'GA_API_SECRET',
        MIXPANEL_TOKEN: 'MIXPANEL_TOKEN'
      })
      
      const providers = loadProviders(env)
      
      const { appLogger } = require('../../../../src/utils/logger')
      expect(appLogger.info).toHaveBeenCalledWith(
        'Analytics registry: provider loading complete',
        expect.objectContaining({
          config: 'ga4,mixpanel,unknown',
          requestedTokens: ['ga4', 'mixpanel', 'unknown'],
          loadedProviders: 2,
          unknownTokens: ['unknown'],
          providerNames: ['ExampleGA4Provider', 'ExampleMixpanelProvider']
        })
      )
    })
  })

  describe('getSupportedProviderTokens', () => {
    it('should return list of known provider tokens', () => {
      const tokens = getSupportedProviderTokens()
      
      expect(tokens).toEqual(['ga4', 'mixpanel'])
      expect(tokens).toContain('ga4')
      expect(tokens).toContain('mixpanel')
    })
  })

  describe('validateProviderConfig', () => {
    it('should validate empty configuration as valid', () => {
      const result = validateProviderConfig('')
      
      expect(result.isValid).toBe(true)
      expect(result.knownTokens).toEqual([])
      expect(result.unknownTokens).toEqual([])
    })

    it('should validate whitespace-only configuration as valid', () => {
      const result = validateProviderConfig('   ')
      
      expect(result.isValid).toBe(true)
      expect(result.knownTokens).toEqual([])
      expect(result.unknownTokens).toEqual([])
    })

    it('should validate configuration with only known providers', () => {
      const result = validateProviderConfig('ga4,mixpanel')
      
      expect(result.isValid).toBe(true)
      expect(result.knownTokens).toEqual(['ga4', 'mixpanel'])
      expect(result.unknownTokens).toEqual([])
    })

    it('should identify unknown providers', () => {
      const result = validateProviderConfig('ga4,unknown,segment')
      
      expect(result.isValid).toBe(false)
      expect(result.knownTokens).toEqual(['ga4'])
      expect(result.unknownTokens).toEqual(['unknown', 'segment'])
    })

    it('should be case insensitive', () => {
      const result = validateProviderConfig('GA4,MIXPANEL')
      
      expect(result.isValid).toBe(true)
      expect(result.knownTokens).toEqual(['ga4', 'mixpanel'])
      expect(result.unknownTokens).toEqual([])
    })

    it('should handle extra whitespace', () => {
      const result = validateProviderConfig('  ga4  ,  mixpanel  ')
      
      expect(result.isValid).toBe(true)
      expect(result.knownTokens).toEqual(['ga4', 'mixpanel'])
      expect(result.unknownTokens).toEqual([])
    })

    it('should handle mixed known and unknown providers', () => {
      const result = validateProviderConfig('ga4,unknown,mixpanel')
      
      expect(result.isValid).toBe(false)
      expect(result.knownTokens).toEqual(['ga4', 'mixpanel'])
      expect(result.unknownTokens).toEqual(['unknown'])
    })
  })

  describe('Safety and Error Handling', () => {
    it('should never throw on bad configuration', () => {
      const badConfigs = [
        undefined,
        '',
        'nonexistent_provider',
        'ga4,',
        ',ga4',
        'ga4,,mixpanel',
        'GA4,UNKNOWN',
        null as any
      ]

      for (const config of badConfigs) {
        expect(() => {
          const env = createTestEnv({ ANALYTICS_PROVIDERS: config })
          loadProviders(env)
        }).not.toThrow()
      }
    })

    it('should handle missing environment variables gracefully', () => {
      const env = createTestEnv({ 
        ANALYTICS_PROVIDERS: 'ga4,mixpanel'
        // Missing required env vars for providers
      })
      
      const providers = loadProviders(env)
      
      // Should handle gracefully without throwing
      expect(Array.isArray(providers)).toBe(true)
    })
  })
})
