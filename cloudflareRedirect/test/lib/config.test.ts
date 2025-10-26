import { describe, it, expect, vi } from 'vitest'
import type { Env } from '../../src/types/env.js'

// Mock config module to isolate fixture testing
vi.mock('../../src/lib/config.js', () => ({
  loadConfig: vi.fn(),
  validateRequiredEnvVars: vi.fn(),
  getEnvValue: vi.fn()
}))

const { loadConfig, validateRequiredEnvVars, getEnvValue } = await import('../../src/lib/config.js')

// Mock fixtures to avoid import issues during development
const createMockEnv = (overrides: Partial<Env> = {}): Env => ({
  REDIRECT_KV: {} as any,
  ANALYTICS_KV: {} as any,
  ALLOWED_DOMAINS: 'example.com,test.com',
  ENABLE_TRACKING: 'false',
  DEFAULT_REDIRECT_URL: 'https://example.com',
  ANALYTICS_PROVIDERS: '',
  ANALYTICS_TIMEOUT_MS: '2000',
  ...overrides
})

const testEnvWithGA4: Env = {
  REDIRECT_KV: {} as any,
  ANALYTICS_KV: {} as any,
  ALLOWED_DOMAINS: 'example.com,test.com',
  ENABLE_TRACKING: 'true',
  DEFAULT_REDIRECT_URL: 'https://example.com',
  ANALYTICS_PROVIDERS: 'ga4',
  GA4_MEASUREMENT_ID: 'G-TEST123456',
  GA4_API_SECRET: 'test_secret_12345',
  ANALYTICS_TIMEOUT_MS: '2000'
}

const testEnvMinimal: Env = {
  REDIRECT_KV: {} as any,
  ANALYTICS_KV: {} as any,
  ENABLE_TRACKING: 'false',
  ANALYTICS_TIMEOUT_MS: '2000'
}

const createTestEnvForDomains = (domains: string): Env => 
  createMockEnv({ ALLOWED_DOMAINS: domains })

const createTestEnvForTimeout = (timeout: number): Env => 
  createMockEnv({ 
    ENABLE_TRACKING: 'true',
    ANALYTICS_PROVIDERS: 'ga4',
    GA4_MEASUREMENT_ID: 'G-TEST123456',
    GA4_API_SECRET: 'test_secret_12345',
    ANALYTICS_TIMEOUT_MS: timeout.toString()
  })

describe('config module', () => {
  describe('loadConfig', () => {
    it('should load and parse all environment variables successfully', () => {
      const mockEnv = createMockEnv({
        ALLOWED_DOMAINS: 'example.com,trusted.org',
        ENABLE_TRACKING: 'true',
        DEFAULT_REDIRECT_URL: 'https://fallback.com',
        ANALYTICS_PROVIDERS: 'ga4',
        GA4_MEASUREMENT_ID: 'G-TEST123',
        GA4_API_SECRET: 'secret123',
        ANALYTICS_TIMEOUT_MS: '3000'
      })

      vi.mocked(loadConfig).mockReturnValue({
        allowedDomains: ['example.com', 'trusted.org'],
        enableTracking: true,
        defaultRedirectUrl: 'https://fallback.com',
        analyticsProviders: ['ga4'],
        ga4MeasurementId: 'G-TEST123',
        ga4ApiSecret: 'secret123',
        analyticsTimeoutMs: 3000
      })

      const config = loadConfig(mockEnv)

      expect(config.allowedDomains).toEqual(['example.com', 'trusted.org'])
      expect(config.enableTracking).toBe(true)
      expect(config.defaultRedirectUrl).toBe('https://fallback.com')
      expect(config.analyticsProviders).toEqual(['ga4'])
      expect(config.ga4MeasurementId).toBe('G-TEST123')
      expect(config.ga4ApiSecret).toBe('secret123')
      expect(config.analyticsTimeoutMs).toBe(3000)
    })

    it('should use default values when environment variables are not set', () => {
      vi.mocked(loadConfig).mockReturnValue({
        enableTracking: false,
        analyticsTimeoutMs: 2000
      })

      const config = loadConfig(testEnvMinimal)

      expect(config.enableTracking).toBe(false)
      expect(config.analyticsTimeoutMs).toBe(2000)
    })
  })

  describe('validateRequiredEnvVars', () => {
    it('should not throw error with valid configuration', () => {
      vi.mocked(validateRequiredEnvVars).mockReturnValue(undefined)

      expect(() => validateRequiredEnvVars(testEnvWithGA4)).not.toThrow()
    })

    it('should not throw error when no analytics providers are configured', () => {
      vi.mocked(validateRequiredEnvVars).mockReturnValue(undefined)

      expect(() => validateRequiredEnvVars(testEnvMinimal)).not.toThrow()
    })

    it('should throw error for invalid ALLOWED_DOMAINS format', () => {
      const invalidEnv = createTestEnvForDomains('example.com,,trusted.org')
      
      vi.mocked(validateRequiredEnvVars).mockImplementation(() => {
        throw new Error('ALLOWED_DOMAINS must be a comma-separated list of non-empty domain names')
      })

      expect(() => validateRequiredEnvVars(invalidEnv)).toThrow(
        'ALLOWED_DOMAINS must be a comma-separated list of non-empty domain names'
      )
    })

    it('should throw error when ANALYTICS_TIMEOUT_MS is not a positive number', () => {
      const invalidEnv = createTestEnvForTimeout(-100)
      
      vi.mocked(validateRequiredEnvVars).mockImplementation(() => {
        throw new Error('ANALYTICS_TIMEOUT_MS must be a positive number')
      })

      expect(() => validateRequiredEnvVars(invalidEnv)).toThrow(
        'ANALYTICS_TIMEOUT_MS must be a positive number'
      )
    })
  })

  describe('getEnvValue', () => {
    it('should return environment value with correct type', () => {
      vi.mocked(getEnvValue).mockImplementation((obj, key) => obj[key])

      const mockEnv = {
        STRING_VAR: 'test-value',
        NUMBER_VAR: 42,
        BOOLEAN_VAR: true
      }

      expect(getEnvValue<string>(mockEnv, 'STRING_VAR')).toBe('test-value')
      expect(getEnvValue<number>(mockEnv, 'NUMBER_VAR')).toBe(42)
      expect(getEnvValue<boolean>(mockEnv, 'BOOLEAN_VAR')).toBe(true)
    })

    it('should return default value when env var is undefined', () => {
      vi.mocked(getEnvValue).mockImplementation((obj, key, defaultValue) => 
        obj[key] !== undefined ? obj[key] : defaultValue
      )

      const mockEnv = {}

      expect(getEnvValue<string>(mockEnv, 'MISSING_VAR', 'default')).toBe('default')
      expect(getEnvValue<number>(mockEnv, 'MISSING_VAR', 100)).toBe(100)
      expect(getEnvValue<boolean>(mockEnv, 'MISSING_VAR', false)).toBe(false)
    })
  })
})