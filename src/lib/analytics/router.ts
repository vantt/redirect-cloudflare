/**
 * Analytics Router
 * 
 * Dispatches neutral AnalyticsEvent to multiple providers concurrently
 * with per-provider isolation, timeout protection, and structured logging.
 * 
 * Part of Epic 7: Analytics Abstraction (Multi-Service)
 */

import { AnalyticsEvent } from './types'
import { AnalyticsProvider } from './provider'
import { Env } from '../../types/env'
import { appLogger } from '../../utils/logger'

/**
 * Default timeout for individual provider calls (milliseconds)
 */
const DEFAULT_PROVIDER_TIMEOUT = 2000

/**
 * Router configuration options
 */
export interface RouterOptions {
  /** Timeout for individual provider calls (milliseconds) - overrides env default */
  providerTimeout?: number
}

/**
 * Resolves timeout from environment or default
 * 
 * @param env - Environment variables
 * @returns Timeout in milliseconds
 */
function resolveProviderTimeout(env?: Env): number {
  // Use provided option first
  if (env?.ANALYTICS_TIMEOUT_MS) {
    const envTimeout = parseInt(env.ANALYTICS_TIMEOUT_MS, 10)
    if (!isNaN(envTimeout) && envTimeout > 0) {
      return envTimeout
    }
    appLogger.warn('Analytics router: invalid ANALYTICS_TIMEOUT_MS, using default', {
      ANALYTICS_TIMEOUT_MS: env.ANALYTICS_TIMEOUT_MS,
      defaultTimeout: DEFAULT_PROVIDER_TIMEOUT
    })
  }
  
  return DEFAULT_PROVIDER_TIMEOUT
}

/**
 * Routes an analytics event to multiple providers concurrently
 * 
 * Errors are isolated per provider - if one provider fails,
 * other providers continue to receive the event.
 * Router always returns promptly to avoid blocking redirect response.
 * 
 * @param event - The analytics event to route
 * @param providers - Array of analytics providers to dispatch to
 * @param options - Optional router configuration
 * @param env - Environment variables (for timeout configuration)
 */
export async function routeAnalyticsEvent(
  event: AnalyticsEvent,
  providers: AnalyticsProvider[],
  options: RouterOptions = {},
  env?: Env
): Promise<void> {
  const timeout = options.providerTimeout ?? resolveProviderTimeout(env)
  
  // No providers case - complete without errors (noop)
  if (providers.length === 0) {
    appLogger.info('Analytics router: no providers configured', {
      eventName: event.name,
      attributeCount: Object.keys(event.attributes).length,
      timeout
    })
    return
  }

  const startTime = Date.now()
  
  // Dispatch to all providers concurrently with individual timeouts
  const providerPromises = providers.map((provider, index) => 
    dispatchToProviderWithTimeout(provider, event, index, timeout)
  )

  // Wait for all providers to complete (or fail)
  // Use Promise.allSettled to ensure we never wait for a single hanging provider
  const results = await Promise.allSettled(providerPromises)
  
  // Log router completion summary
  const duration = Date.now() - startTime
  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  appLogger.info('Analytics router: dispatch complete', {
    eventName: event.name,
    totalProviders: providers.length,
    successful,
    failed,
    duration,
    timeout
  })
  
  // Never throw - router is fire-and-forget from caller perspective
}

/**
 * Dispatches event to a single provider with timeout and error isolation
 * 
 * @param provider - The analytics provider to dispatch to
 * @param event - The analytics event to send
 * @param providerIndex - Index of the provider (for logging)
 * @param timeout - Timeout in milliseconds
 */
async function dispatchToProviderWithTimeout(
  provider: AnalyticsProvider,
  event: AnalyticsEvent,
  providerIndex: number,
  timeout: number
): Promise<void> {
  const providerName = provider.constructor.name || `Provider${providerIndex}`
  const startTime = Date.now()
  
  appLogger.info('Analytics router: dispatching to provider', {
    providerName,
    eventName: event.name,
    attributeCount: Object.keys(event.attributes).length,
    providerIndex,
    timeout
  })

  try {
    // Create timeout controller for provider call
    const timeoutController = new AbortController()
    const timeoutId = setTimeout(() => timeoutController.abort(), timeout)
    
    // Race provider call against timeout
    await Promise.race([
      provider.send(event),
      createTimeoutPromise(timeoutController.signal, timeout)
    ])
    
    clearTimeout(timeoutId)

    const duration = Date.now() - startTime
    appLogger.info('Analytics router: provider dispatch successful', {
      providerName,
      eventName: event.name,
      duration,
      providerIndex
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    
    // Determine if this was a timeout vs other error
    const isTimeout = error instanceof Error && 
      (error.message.includes('timeout') || error.message.includes('aborted'))
    
    // Log error but don't re-throw (isolation)
    appLogger.error('Analytics router: provider dispatch failed', {
      providerName,
      eventName: event.name,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      providerIndex,
      isTimeout
    })
    
    // Error isolation - don't let one provider failure affect others
    // or throw to caller (non-blocking guarantee)
  }
}

/**
 * Creates a promise that rejects when abort signal triggers
 * Used for implementing timeout behavior
 * 
 * @param signal - AbortSignal that will trigger timeout
 * @param timeout - Timeout duration in milliseconds
 * @returns Promise that rejects on timeout
 */
function createTimeoutPromise(signal: AbortSignal, timeout: number): Promise<never> {
  return new Promise((_, reject) => {
    signal.addEventListener('abort', () => {
      reject(new Error(`Provider timeout after ${timeout}ms`))
    })
  })
}