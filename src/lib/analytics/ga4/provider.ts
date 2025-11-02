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

  constructor(config: GA4Config) {
    this.config = config
    this.isEnabled = !!config.measurementId && !!config.apiSecret

    if (!this.isEnabled) {
      appLogger.warn('GA4 provider disabled: missing measurement ID or API secret')
    } else {
      appLogger.info('GA4 provider initialized', {
        measurementId: config.measurementId,
        debug: config.debug
      })
    }
  }

  /**
   * Sends an AnalyticsEvent to GA4 using Measurement Protocol v2
   *
   * @param event - Neutral analytics event to send
   * @returns Promise that resolves when event is processed (note: actual HTTP delivery in Story 8.2)
   */
  async send(event: AnalyticsEvent): Promise<void> {
    try {
      // Check if provider is enabled
      if (!this.isEnabled) {
        appLogger.debug('GA4 provider disabled - skipping event', { eventName: event.name })
        return
      }

      // Validate event structure
      if (!event || !event.name) {
        appLogger.warn('Invalid event structure - skipping GA4 send', { event })
        return
      }

      // Build GA4 payload
      const payload = buildGA4Payload(event, this.config.measurementId)

      // Log the payload (for Story 8.1 - actual HTTP delivery in Story 8.2)
      appLogger.info('GA4 payload built (HTTP delivery in Story 8.2)', {
        eventName: event.name,
        clientId: payload.client_id,
        eventCount: payload.events.length,
        debug: this.config.debug ? payload : undefined
      })

      // TODO: Story 8.2 - Implement actual HTTP delivery to GA4
      // await this.sendToGA4(payload)

    } catch (error) {
      // Log error but don't throw to maintain provider isolation
      appLogger.error('GA4 provider: failed to process event', {
        eventName: event?.name,
        error: error instanceof Error ? error.message : String(error)
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
    return {
      measurementId: this.config.measurementId,
      apiSecret: this.config.apiSecret ? '***' : undefined,
      debug: this.config.debug,
      defaultParameters: this.config.defaultParameters
    }
  }

  /**
   * Sends payload to GA4 servers via Measurement Protocol v2
   * This method will be implemented in Story 8.2
   *
   * @param payload - GA4 Measurement Protocol payload
   */
  private async sendToGA4(payload: GA4Payload): Promise<void> {
    // TODO: Story 8.2 - Implement HTTP POST to GA4 Measurement API
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${this.config.measurementId}&api_secret=${this.config.apiSecret}`

    // Implementation will be added in Story 8.2
    throw new Error('HTTP delivery to be implemented in Story 8.2')
  }
}