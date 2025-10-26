/**
 * Analytics Router
 * 
 * Dispatches neutral AnalyticsEvent to multiple providers concurrently
 * with per-provider isolation and structured logging.
 * 
 * Part of Epic 7: Analytics Abstraction (Multi-Service)
 */

import { AnalyticsEvent } from './types'
import { AnalyticsProvider } from './provider'
import { appLogger } from '../../utils/logger'

/**
 * Router configuration options
 */
export interface RouterOptions {
  /** Timeout for individual provider calls (milliseconds) */
  providerTimeout?: number
}

/**
 * Default router configuration
 */
const DEFAULT_ROUTER_OPTIONS: RouterOptions = {
  providerTimeout: 2000 // 2 seconds default (will be configurable in Story 7.5)
}

/**
 * Routes an analytics event to multiple providers concurrently
 * 
 * Errors are isolated per provider - if one provider fails,
 * other providers continue to receive the event.
 * 
 * @param event - The analytics event to route
 * @param providers - Array of analytics providers to dispatch to
 * @param options - Optional router configuration
 */
export async function routeAnalyticsEvent(
  event: AnalyticsEvent,
  providers: AnalyticsProvider[],
  options: RouterOptions = {}
): Promise<void> {
  const routerOptions = { ...DEFAULT_ROUTER_OPTIONS, ...options }
  
  // No providers case - complete without errors (noop)
  if (providers.length === 0) {
    appLogger.info('Analytics router: no providers configured', {
      eventName: event.name,
      attributeCount: Object.keys(event.attributes).length
    })
    return
  }

  // Dispatch to all providers concurrently
  const providerPromises = providers.map((provider, index) => 
    dispatchToProvider(provider, event, index, routerOptions.providerTimeout!)
  )

  // Wait for all providers to complete (or fail)
  // Don't throw - errors are handled individually
  await Promise.allSettled(providerPromises)
}

/**
 * Dispatches event to a single provider with error isolation and logging
 * 
 * @param provider - The analytics provider to dispatch to
 * @param event - The analytics event to send
 * @param providerIndex - Index of the provider (for logging)
 * @param timeout - Timeout in milliseconds
 */
async function dispatchToProvider(
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
    providerIndex
  })

  try {
    // Create timeout signal for provider call
    const timeoutController = new AbortController()
    const timeoutId = setTimeout(() => timeoutController.abort(), timeout)
    
    // Send event to provider with timeout
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
    
    // Log the error but don't re-throw (isolation)
    appLogger.error('Analytics router: provider dispatch failed', {
      providerName,
      eventName: event.name,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      providerIndex
    })
    
    // Error isolation - don't let one provider failure affect others
  }
}

/**
 * Creates a promise that rejects when the abort signal triggers
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