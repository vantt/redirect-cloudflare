/**
 * Analytics Provider Interface
 * 
 * Defines the contract for analytics providers in the neutral event system.
 * Providers adapt the neutral AnalyticsEvent to vendor-specific payloads.
 * 
 * Part of Epic 7: Analytics Abstraction (Multi-Service)
 */

import { AnalyticsEvent } from './types'

/**
 * Analytics provider contract
 * All analytics providers must implement this interface to receive events
 */
export interface AnalyticsProvider {
  /**
   * Unique identifier for the provider instance
   */
  readonly name: string

  /**
   * Send an analytics event to the provider
   * 
   * @param event - Neutral analytics event to send
   * @returns Promise that resolves when the event is sent (or fails)
   */
  send(event: AnalyticsEvent): Promise<void>
}