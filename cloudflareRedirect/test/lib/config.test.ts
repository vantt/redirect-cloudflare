import { describe, it, expect } from 'vitest'
import { loadConfig, validateRequiredEnvVars, getEnvValue } from '../../src/lib/config'
import { RedirectError } from '../../src/lib/errors'
import type { Env } from '../../src/types/env'

describe('config module', () => {
  describe('loadConfig', () => {
    it('should load and parse all environment variables successfully', () => {
      const mockEnv: Partial<Env> = {
        ALLOWED_DOMAINS: 'example.com,trusted.org',
        ENABLE_TRACKING: 'true',
        DEFAULT_REDIRECT_URL: 'https://fallback.com',
        ANALYTICS_PROVIDERS: 'ga4',
        GA4_MEASUREMENT_ID: 'G-TEST123',
        GA4_API_SECRET: 'secret123',
        ANALYTICS_TIMEOUT_MS: '3000'
      }

      const config = loadConfig(mockEnv as Env)

      expect(config.allowedDomains).toEqual(['example.com', 'trusted.org'])
      expect(config.enableTracking).toBe(true)
      expect(config.defaultRedirectUrl).toBe('https://fallback.com')
      expect(config.analyticsProviders).toEqual(['ga4'])
      expect(config.ga4MeasurementId).toBe('G-TEST123')
      expect(config.ga4ApiSecret).toBe('secret123')
      expect(config.analyticsTimeoutMs).toBe(3000)
    })

    it('should use default values when environment variables are not set', () => {
      const mockEnv: Partial<Env> = {}

      const config = loadConfig(mockEnv as Env)

      expect(config.allowedDomains).toBeUndefined()
      expect(config.enableTracking).toBe(false)
      expect(config.defaultRedirectUrl).toBeUndefined()
      expect(config.analyticsProviders).toBeUndefined()
      expect(config.analyticsTimeoutMs).toBe(2000) // default timeout
    })

    it('should trim whitespace from comma-separated lists', () => {
      const mockEnv: Partial<Env> = {
        ALLOWED_DOMAINS: ' example.com , trusted.org ',
        ANALYTICS_PROVIDERS: ' ga4 , mixpanel '
      }

      const config = loadConfig(mockEnv as Env)

      expect(config.allowedDomains).toEqual(['example.com', 'trusted.org'])
      expect(config.analyticsProviders).toEqual(['ga4', 'mixpanel'])
    })
  })

  describe('validateRequiredEnvVars', () => {
    it('should not throw error with valid configuration', () => {
      const mockEnv: Partial<Env> = {
        ANALYTICS_PROVIDERS: 'ga4',
        GA4_MEASUREMENT_ID: 'G-TEST123',
        GA4_API_SECRET: 'secret123',
        ALLOWED_DOMAINS: 'example.com',
        ANALYTICS_TIMEOUT_MS: '2000'
      }

      expect(() => validateRequiredEnvVars(mockEnv as Env)).not.toThrow()
    })

    it('should not throw error when no analytics providers are configured', () => {
      const mockEnv: Partial<Env> = {}

      expect(() => validateRequiredEnvVars(mockEnv as Env)).not.toThrow()
    })

    it('should throw descriptive error when GA4_MEASUREMENT_ID is missing with ga4 provider', () => {
      const mockEnv: Partial<Env> = {
        ANALYTICS_PROVIDERS: 'ga4',
        GA4_API_SECRET: 'secret123'
        // Missing GA4_MEASUREMENT_ID
      }

      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow(RedirectError)
      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow(
        'GA4_MEASUREMENT_ID is required when ANALYTICS_PROVIDERS includes "ga4"'
      )
    })

    it('should throw descriptive error when GA4_API_SECRET is missing with ga4 provider', () => {
      const mockEnv: Partial<Env> = {
        ANALYTICS_PROVIDERS: 'ga4',
        GA4_MEASUREMENT_ID: 'G-TEST123'
        // Missing GA4_API_SECRET
      }

      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow(RedirectError)
      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow(
        'GA4_API_SECRET is required when ANALYTICS_PROVIDERS includes "ga4"'
      )
    })

    it('should validate GA4 credentials when ga4 is one of multiple providers', () => {
      const mockEnv: Partial<Env> = {
        ANALYTICS_PROVIDERS: 'mixpanel,ga4,amplitude',
        // Missing GA4 credentials
      }

      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow(RedirectError)
      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow('GA4_MEASUREMENT_ID')
    })

    it('should throw error for invalid ALLOWED_DOMAINS format with empty domains', () => {
      const mockEnv: Partial<Env> = {
        ALLOWED_DOMAINS: 'example.com,,trusted.org' // Empty domain in the middle
      }

      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow(RedirectError)
      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow(
        'ALLOWED_DOMAINS must be a comma-separated list of non-empty domain names'
      )
    })

    it('should throw error for ALLOWED_DOMAINS with invalid characters', () => {
      const mockEnv: Partial<Env> = {
        ALLOWED_DOMAINS: 'example.com,invalid domain with spaces'
      }

      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow(RedirectError)
      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow(
        'ALLOWED_DOMAINS contains invalid domain format'
      )
    })

    it('should throw error when ANALYTICS_TIMEOUT_MS is not a number', () => {
      const mockEnv: Partial<Env> = {
        ANALYTICS_TIMEOUT_MS: 'not-a-number'
      }

      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow(RedirectError)
      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow(
        'ANALYTICS_TIMEOUT_MS must be a valid number'
      )
    })

    it('should throw error when ANALYTICS_TIMEOUT_MS is not a positive number', () => {
      const mockEnv: Partial<Env> = {
        ANALYTICS_TIMEOUT_MS: '-100'
      }

      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow(RedirectError)
      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow(
        'ANALYTICS_TIMEOUT_MS must be a positive number'
      )
    })

    it('should throw error when ANALYTICS_TIMEOUT_MS is zero', () => {
      const mockEnv: Partial<Env> = {
        ANALYTICS_TIMEOUT_MS: '0'
      }

      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow(RedirectError)
      expect(() => validateRequiredEnvVars(mockEnv as Env)).toThrow(
        'ANALYTICS_TIMEOUT_MS must be a positive number'
      )
    })
  })

  describe('getEnvValue', () => {
    it('should return environment value with correct type', () => {
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
      const mockEnv = {}

      expect(getEnvValue<string>(mockEnv, 'MISSING_VAR', 'default')).toBe('default')
      expect(getEnvValue<number>(mockEnv, 'MISSING_VAR', 100)).toBe(100)
      expect(getEnvValue<boolean>(mockEnv, 'MISSING_VAR', false)).toBe(false)
    })

    it('should throw error when env var is undefined and no default provided', () => {
      const mockEnv = {}

      expect(() => getEnvValue(mockEnv, 'MISSING_VAR')).toThrow(
        'Environment variable MISSING_VAR is not defined and no default value provided'
      )
    })

    it('should return undefined as default value when explicitly provided', () => {
      const mockEnv = {}

      expect(getEnvValue<string | undefined>(mockEnv, 'MISSING_VAR', undefined)).toBeUndefined()
    })
  })
})
