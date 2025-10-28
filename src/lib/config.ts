import type { Env } from '../types/env'
import { RedirectError } from './errors'

/**
 * Configuration object with parsed and validated environment variables
 */
export interface Config {
  allowedDomains?: string[]
  enableTracking: boolean
  defaultRedirectUrl?: string
  analyticsProviders?: string[]
  ga4MeasurementId?: string
  ga4ApiSecret?: string
  analyticsTimeoutMs: number
}

/**
 * Loads and validates all environment variables from Env
 * @param env - Cloudflare Workers environment bindings
 * @returns Parsed configuration object
 */
export function loadConfig(env: Env): Config {
  const config: Config = {
    enableTracking: env.ENABLE_TRACKING === 'true',
    analyticsTimeoutMs: parseInt(env.ANALYTICS_TIMEOUT_MS || '2000', 10),
  }

  // Parse ALLOWED_DOMAINS if set
  if (env.ALLOWED_DOMAINS) {
    config.allowedDomains = env.ALLOWED_DOMAINS.split(',').map(d => d.trim())
  }

  // Parse DEFAULT_REDIRECT_URL if set
  if (env.DEFAULT_REDIRECT_URL) {
    config.defaultRedirectUrl = env.DEFAULT_REDIRECT_URL
  }

  // Parse ANALYTICS_PROVIDERS if set
  if (env.ANALYTICS_PROVIDERS) {
    config.analyticsProviders = env.ANALYTICS_PROVIDERS.split(',').map(p => p.trim())
  }

  // Parse GA4 credentials if set
  if (env.GA4_MEASUREMENT_ID) {
    config.ga4MeasurementId = env.GA4_MEASUREMENT_ID
  }

  if (env.GA4_API_SECRET) {
    config.ga4ApiSecret = env.GA4_API_SECRET
  }

  return config
}

/**
 * Validates required environment variables based on conditional requirements
 * Throws RedirectError if validation fails
 * @param env - Cloudflare Workers environment bindings
 */
export function validateRequiredEnvVars(env: Env): void {
  // Validate GA4 credentials if GA4 provider is enabled
  if (env.ANALYTICS_PROVIDERS?.includes('ga4')) {
    if (!env.GA4_MEASUREMENT_ID) {
      throw new RedirectError(
        'GA4_MEASUREMENT_ID is required when ANALYTICS_PROVIDERS includes "ga4"',
        500,
        'CONFIG_VALIDATION_ERROR'
      )
    }

    if (!env.GA4_API_SECRET) {
      throw new RedirectError(
        'GA4_API_SECRET is required when ANALYTICS_PROVIDERS includes "ga4"',
        500,
        'CONFIG_VALIDATION_ERROR'
      )
    }
  }

  // Validate ALLOWED_DOMAINS format (comma-separated)
  if (env.ALLOWED_DOMAINS) {
    const domains = env.ALLOWED_DOMAINS.split(',').map(d => d.trim())

    // Check that each domain is non-empty
    const hasEmptyDomain = domains.some(d => d.length === 0)
    if (hasEmptyDomain) {
      throw new RedirectError(
        'ALLOWED_DOMAINS must be a comma-separated list of non-empty domain names',
        500,
        'CONFIG_VALIDATION_ERROR'
      )
    }

    // Basic domain format validation (simple check for valid characters)
    const invalidDomainPattern = /[<>:"/\\|?*\s]/
    const hasInvalidDomain = domains.some(d => invalidDomainPattern.test(d))
    if (hasInvalidDomain) {
      throw new RedirectError(
        'ALLOWED_DOMAINS contains invalid domain format. Domains should not contain special characters or whitespace.',
        500,
        'CONFIG_VALIDATION_ERROR'
      )
    }
  }

  // Validate ANALYTICS_TIMEOUT_MS is a positive number
  if (env.ANALYTICS_TIMEOUT_MS) {
    const timeout = parseInt(env.ANALYTICS_TIMEOUT_MS, 10)

    if (isNaN(timeout)) {
      throw new RedirectError(
        'ANALYTICS_TIMEOUT_MS must be a valid number',
        500,
        'CONFIG_VALIDATION_ERROR'
      )
    }

    if (timeout <= 0) {
      throw new RedirectError(
        'ANALYTICS_TIMEOUT_MS must be a positive number',
        500,
        'CONFIG_VALIDATION_ERROR'
      )
    }
  }
}

/**
 * Safe environment value getter with type safety and default values
 * @param env - Environment object to read from
 * @param key - Environment variable key
 * @param defaultValue - Default value if env var is undefined
 * @returns Environment value or default
 */
export function getEnvValue<T = any>(env: Record<string, any>, key: string, defaultValue?: T): T {
  const value = env[key]

  if (value === undefined) {
    // Check if a default value argument was provided (even if it's undefined)
    if (arguments.length >= 3) {
      return defaultValue as T
    }
    throw new Error(`Environment variable ${key} is not defined and no default value provided`)
  }

  return value as T
}
