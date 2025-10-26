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
   * Send an analytics event to the provider
   * 
   * @param event - Neutral analytics event to send
   * @returns Promise that resolves when the event is sent (or fails)
   */
  send(event: AnalyticsEvent): Promise<void>
}

/**
 * Example GA4 Provider Adapter (for illustration only)
 * 
 * This example shows how to adapt a neutral AnalyticsEvent 
 * to GA4 Measurement Protocol payload format.
 * 
 * NOTE: This is documentation only - actual implementation in Epic 8
 */
export class ExampleGA4Provider implements AnalyticsProvider {
  constructor(
    private measurementId: string,
    private apiSecret: string
  ) {}

  async send(event: AnalyticsEvent): Promise<void> {
    // Example transformation logic (documentation only):
    // 
    // const ga4Payload = {
    //   client_id: this.generateClientId(),
    //   events: [{
    //     name: event.name,
    //     parameters: this.mapAttributes(event.attributes)
    //   }]
    // }
    //
    // // Send to GA4 Measurement Protocol endpoint
    // await fetch(`https://www.google-analytics.com/mp/collect`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(ga4Payload)
    // })
    
    throw new Error('Example provider - implement in Epic 8')
  }

  /**
   * Map neutral attributes to GA4 parameter format
   * 
   * @param attributes - Neutral event attributes
   * @returns GA4-specific parameters object
   */
  private mapAttributes(attributes: Record<string, string | number | boolean>): Record<string, string> {
    // Example mapping logic:
    const ga4Params: Record<string, string> = {}
    
    // Direct attribute mapping for standard tracking parameters
    if (attributes.utm_source) ga4Params.utm_source = String(attributes.utm_source)
    if (attributes.utm_medium) ga4Params.utm_medium = String(attributes.utm_medium)
    if (attributes.utm_campaign) ga4Params.utm_campaign = String(attributes.utm_campaign)
    if (attributes.utm_content) ga4Params.utm_content = String(attributes.utm_content)
    if (attributes.utm_term) ga4Params.utm_term = String(attributes.utm_term)
    if (attributes.xptdk) ga4Params.xptdk = String(attributes.xptdk)
    if (attributes.ref) ga4Params.ref = String(attributes.ref)
    
    return ga4Params
  }

  /**
   * Generate a client ID for GA4 (example implementation)
   */
  private generateClientId(): string {
    // In practice, this would use a hash of timestamp + random value
    // as specified in Epic 8
    return 'example_client_id'
  }
}

/**
 * Example Mixpanel Provider Adapter (for illustration only)
 * 
 * Shows how another provider might adapt the same neutral event
 * to a completely different vendor payload format.
 */
export class ExampleMixpanelProvider implements AnalyticsProvider {
  constructor(private token: string) {}

  async send(event: AnalyticsEvent): Promise<void> {
    // Example transformation logic:
    //
    // const mixpanelPayload = {
    //   event: event.name,
    //   properties: {
    //     ...event.attributes,
    //     distinct_id: this.generateUserId(),
    //     time: Date.now()
    //   }
    // }
    //
    // // Send to Mixpanel API
    // await fetch('https://api.mixpanel.com/track', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(mixpanelPayload)
    // })
    
    throw new Error('Example provider - implement in future epic')
  }

  private generateUserId(): string {
    return 'example_user_id'
  }
}