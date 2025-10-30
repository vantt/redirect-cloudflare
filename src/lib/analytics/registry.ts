/**
 * Analytics Provider Registry
 *
 * Loads analytics providers based on environment configuration.
 * This module is provider-agnostic and relies on dependency injection.
 *
 * Part of Epic 7: Analytics Abstraction (Multi-Service)
 */

import { AnalyticsProvider } from './provider'
import { Env } from '../../types/env'
import { appLogger } from '../../utils/logger'

/**
 * Defines the shape of a provider factory map, where keys are provider tokens (e.g., "ga4")
 * and values are factory functions that create a provider instance.
 */
export interface ProviderFactories {
  [token: string]: (env: Env) => AnalyticsProvider
}

const DEFAULT_ANALYTICS_PROVIDERS = ''

/**
 * Loads analytics providers based on a given configuration and a set of factories.
 *
 * @param env - The environment variables, containing the provider configuration string.
 * @param providerFactories - A map of provider tokens to their factory functions.
 * @returns An array of initialized analytics provider instances.
 */
export function loadProviders(env: Env, providerFactories: ProviderFactories): AnalyticsProvider[] {
  const providersConfig = env.ANALYTICS_PROVIDERS || DEFAULT_ANALYTICS_PROVIDERS

  if (!providersConfig.trim()) {
    return []
  }

  const providerTokens = providersConfig
    .split(',')
    .map(token => token.trim().toLowerCase())
    .filter(token => token)

  const providers: AnalyticsProvider[] = []

  for (const token of providerTokens) {
    const factory = providerFactories[token]
    if (factory) {
      try {
        const provider = factory(env)
        providers.push(provider)
      } catch (error) {
        appLogger.error(`Analytics registry: failed to instantiate provider '${token}'`, {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    } else {
      appLogger.warn(`Analytics registry: unknown provider token '${token}'`, {
        knownTokens: Object.keys(providerFactories),
      })
    }
  }

  return providers
}
