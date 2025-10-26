/**
 * Analytics Provider Registry
 * 
 * Loads analytics providers based on environment configuration.
 * Enables/disables providers per environment without code changes.
 * 
 * Part of Epic 7: Analytics Abstraction (Multi-Service)
 */

import { AnalyticsProvider } from './provider'
import { ExampleGA4Provider, ExampleMixpanelProvider } from './provider'
import { Env } from '../../types/env'
import { appLogger } from '../../utils/logger'

/**
 * Known provider tokens and their factory functions
 */
interface ProviderFactories {
  [token: string]: (env: Env) => AnalyticsProvider
}

/**
 * Provider factory mappings
 * Add new providers here by extending the factories object
 */
const PROVIDER_FACTORIES: ProviderFactories = {
  /**
   * Google Analytics 4 provider
   * Environment variables needed: GA4_MEASUREMENT_ID, GA4_API_SECRET
   */
  ga4: (env: Env) => {
    const measurementId = env.GA4_MEASUREMENT_ID || ''
    const apiSecret = env.GA4_API_SECRET || ''
    
    return new ExampleGA4Provider(measurementId, apiSecret)
  },

  /**
   * Mixpanel provider (placeholder for future implementation)
   * Environment variables needed: MIXPANEL_TOKEN
   */
  mixpanel: (env: Env) => {
    const token = env.MIXPANEL_TOKEN || ''
    
    return new ExampleMixpanelProvider(token)
  }
}

/**
 * Default environment configuration for providers
 */
const DEFAULT_ANALYTICS_PROVIDERS = ''

/**
 * Loads analytics providers based on environment configuration
 * 
 * @param env - Environment variables object
 * @returns Array of configured analytics providers
 */
export function loadProviders(env: Env): AnalyticsProvider[] {
  const providersConfig = env.ANALYTICS_PROVIDERS || DEFAULT_ANALYTICS_PROVIDERS
  
  // Handle empty or unset configuration
  if (!providersConfig.trim()) {
    appLogger.info('Analytics registry: no providers configured', {
      config: providersConfig
    })
    return []
  }

  // Parse comma-separated provider tokens
  const providerTokens = providersConfig
    .split(',')
    .map(token => token.trim().toLowerCase())
    .filter(token => token.length > 0)

  if (providerTokens.length === 0) {
    appLogger.info('Analytics registry: empty provider configuration', {
      config: providersConfig
    })
    return []
  }

  const providers: AnalyticsProvider[] = []
  const unknownTokens: string[] = []

  // Process each provider token
  for (const token of providerTokens) {
    const factory = PROVIDER_FACTORIES[token]
    
    if (factory) {
      try {
        const provider = factory(env)
        providers.push(provider)
        
        appLogger.info('Analytics registry: loaded provider', {
          providerToken: token,
          providerName: provider.constructor.name
        })
      } catch (error) {
        // Log instantiation error but continue with other providers
        appLogger.error('Analytics registry: failed to instantiate provider', {
          providerToken: token,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    } else {
      // Track unknown tokens for warning
      unknownTokens.push(token)
      appLogger.warn('Analytics registry: unknown provider token', {
        providerToken: token,
        knownTokens: Object.keys(PROVIDER_FACTORIES)
      })
    }
  }

  // Log summary of loaded providers
  appLogger.info('Analytics registry: provider loading complete', {
    config: providersConfig,
    requestedTokens: providerTokens,
    loadedProviders: providers.length,
    unknownTokens,
    providerNames: providers.map(p => p.constructor.name)
  })

  return providers
}

/**
 * Gets list of supported provider tokens
 * Useful for documentation and validation
 */
export function getSupportedProviderTokens(): string[] {
  return Object.keys(PROVIDER_FACTORIES)
}

/**
 * Validates provider configuration
 * Returns validation result without throwing
 */
export function validateProviderConfig(providersConfig: string): {
  isValid: boolean
  knownTokens: string[]
  unknownTokens: string[]
} {
  if (!providersConfig.trim()) {
    return {
      isValid: true,
      knownTokens: [],
      unknownTokens: []
    }
  }

  const tokens = providersConfig
    .split(',')
    .map(token => token.trim().toLowerCase())
    .filter(token => token.length > 0)

  const supportedTokens = getSupportedProviderTokens()
  const knownTokens = tokens.filter(token => supportedTokens.includes(token))
  const unknownTokens = tokens.filter(token => !supportedTokens.includes(token))

  return {
    isValid: unknownTokens.length === 0,
    knownTokens,
    unknownTokens
  }
}