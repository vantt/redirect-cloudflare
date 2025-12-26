/**
 * GA4 Analytics Provider Implementation
 *
 * Implements the AnalyticsProvider interface for Google Analytics 4 integration.
 * Transforms neutral AnalyticsEvent objects into GA4 Measurement Protocol v2 payloads
 * and sends them to GA4 servers.
 *
 * Part of Epic 8: Google Analytics 4 Integration
 */

import { AnalyticsProvider } from '../provider'
import { AnalyticsEvent } from '../types'
import { GA4Config, GA4Payload } from './types'
import { buildGA4Payload } from './payload-builder'
import { GA4HttpClient } from './http-client'
import { appLogger } from '../../../utils/logger'

/**
 * GA4 Analytics Provider
 *
 * Implements AnalyticsProvider interface for GA4 Measurement Protocol v2 integration.
 * Handles transformation of neutral events to GA4 format and delivery to GA4 servers.
 */
export class GA4Provider implements AnalyticsProvider {
  readonly name = 'ga4'

  private config: GA4Config
  private isEnabled: boolean
  private httpClient: GA4HttpClient | null

  constructor(config: GA4Config) {
    this.config = config
    this.isEnabled = !!config.measurementId && !!config.apiSecret
    this.httpClient = null

    if (!this.isEnabled) {
      appLogger.warn('GA4 provider disabled: missing measurement ID or API secret')
    } else {
      try {
        // Initialize HTTP client with validation
        this.httpClient = new GA4HttpClient(config)

        appLogger.info('GA4 provider initialized with HTTP capability', {
          measurementId: config.measurementId,
          timeout: config.timeout || 2000,
          debug: config.debug
        })
      } catch (error) {
        // HTTP client initialization failed
        this.isEnabled = false
        appLogger.error('GA4 provider initialization failed', {
          measurementId: config.measurementId,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
  }

  /**
   * Sends an AnalyticsEvent to GA4 using Measurement Protocol v2
   *
   * @param event - Neutral analytics event to send
   * @returns Promise that resolves when event is processed
   */
  async send(event: AnalyticsEvent): Promise<void> {
    try {
      // Check if provider is enabled
      if (!this.isEnabled || !this.httpClient) {
        appLogger.debug('GA4 provider disabled - skipping event', {
          eventName: event.name,
          enabled: this.isEnabled,
          hasHttpClient: !!this.httpClient
        })
        return
      }

      // Validate event structure
      if (!event || !event.name) {
        appLogger.warn('Invalid event structure - skipping GA4 send', { event })
        return
      }

      // Build GA4 payload
      const payload = buildGA4Payload(event, this.config.measurementId, this.config.debug)

      // Send HTTP request to GA4
      await this.httpClient.sendRequest(payload)

    } catch (error) {
      // Log error but don't throw to maintain provider isolation
      appLogger.error('GA4 provider: failed to process event', {
        eventName: event?.name,
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      })

      // Provider isolation: errors should not block other providers
      if (this.config.debug) {
        throw error // Re-throw in debug mode for testing
      }
    }
  }

  /**
   * Validates GA4 configuration
   *
   * @returns True if configuration is valid
   */
  isConfigured(): boolean {
    return this.isEnabled
  }

  /**
   * Gets current configuration (for debugging)
   *
   * @returns Configuration object (with sensitive data masked)
   */
  getConfig(): Partial<GA4Config> {
    const config = {
      measurementId: this.config.measurementId,
      apiSecret: this.config.apiSecret ? '***' : undefined,
      debug: this.config.debug,
      defaultParameters: this.config.defaultParameters,
      timeout: this.config.timeout || 2000
    }

    // Include HTTP client status if available
    if (this.httpClient) {
      return { ...config, httpClientStatus: 'initialized' }
    }

    return { ...config, httpClientStatus: 'not_initialized' }
  }
}