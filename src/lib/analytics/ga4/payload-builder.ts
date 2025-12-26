/**
 * GA4 Measurement Protocol Payload Builder
 *
 * Transforms neutral AnalyticsEvent objects into GA4 Measurement Protocol v2
 * compliant payloads with proper parameter mapping and client ID generation.
 *
 * Part of Epic 8: Google Analytics 4 Integration
 */

import { AnalyticsEvent, AttributeKey } from '../types'
import { GA4Payload, GA4Event, GA4StandardParameters } from './types'
import { appLogger } from '../../../utils/logger'

/**
 * Generates a GA4-compliant client ID
 * Uses timestamp + random hash to avoid PII while maintaining consistency
 *
 * @returns UUID-like client identifier without hyphens
 */
export function generateGA4ClientId(): string {
  const timestamp = Date.now()
  const random1 = Math.random().toString(36).substring(2, 15)
  const random2 = Math.random().toString(36).substring(2, 15)
  let hash = btoa(`${timestamp}-${random1}-${random2}`).replace(/[^a-zA-Z0-9]/g, '')

  // Ensure we have enough characters for 32-character client ID
  while (hash.length < 32) {
    hash += Math.random().toString(36).substring(2, 15)
  }

  return hash.substring(0, 32)
}

/**
 * Maps AnalyticsEvent attributes to GA4 standard parameters
 * Follows the parameter mapping strategy defined in Story 8.1
 *
 * @param attributes - AnalyticsEvent attributes to map
 * @returns GA4 standard parameters object
 */
export function mapAttributesToGA4Parameters(attributes: Record<string, any>): GA4StandardParameters {
  const ga4Params: GA4StandardParameters = {}

  // Map UTM parameters to GA4 campaign parameters
  if (attributes[AttributeKey.UTM_SOURCE]) {
    ga4Params.campaign_source = String(attributes[AttributeKey.UTM_SOURCE])
  }

  if (attributes[AttributeKey.UTM_MEDIUM]) {
    ga4Params.campaign_medium = String(attributes[AttributeKey.UTM_MEDIUM])
  }

  if (attributes[AttributeKey.UTM_CAMPAIGN]) {
    ga4Params.campaign_name = String(attributes[AttributeKey.UTM_CAMPAIGN])
  }

  if (attributes[AttributeKey.UTM_CONTENT]) {
    ga4Params.campaign_content = String(attributes[AttributeKey.UTM_CONTENT])
  }

  if (attributes[AttributeKey.UTM_TERM]) {
    ga4Params.campaign_keyword = String(attributes[AttributeKey.UTM_TERM])
  }

  // Map redirect metadata (higher priority)
  if (attributes.short_url) {
    ga4Params.engagement_id = String(attributes.short_url)
  }

  if (attributes.destination_url) {
    ga4Params.link_url = String(attributes.destination_url)
  }

  if (attributes.redirect_type) {
    ga4Params.link_domain = String(attributes.redirect_type)
  }

  // Note: xptdk and ref are handled in extractCustomParameters as custom parameters
  // They are not mapped to standard GA4 parameters

  return ga4Params
}

/**
 * Extracts custom parameters from AnalyticsEvent attributes
 * Parameters that don't map to GA4 standard parameters are included as custom
 *
 * @param attributes - AnalyticsEvent attributes
 * @returns Object of custom parameters
 */
export function extractCustomParameters(attributes: Record<string, any>): Record<string, any> {
  const customParams: Record<string, any> = {}

  // Standard parameter keys that should be mapped to GA4 standard parameters
  // Note: xptdk and ref are handled separately as custom parameters in mapAttributesToGA4Parameters
  const standardKeys = new Set([
    AttributeKey.UTM_SOURCE,
    AttributeKey.UTM_MEDIUM,
    AttributeKey.UTM_CAMPAIGN,
    AttributeKey.UTM_CONTENT,
    AttributeKey.UTM_TERM,
    'short_url',
    'destination_url',
    'redirect_type'
  ])

  // Include all non-standard parameters as custom
  for (const [key, value] of Object.entries(attributes)) {
    if (!standardKeys.has(key) && value !== undefined && value !== null) {
      customParams[key] = value
    }
  }

  return customParams
}

/**
 * Builds a GA4 Measurement Protocol v2 payload from an AnalyticsEvent
 * This is the main transformation function for GA4 integration
 *
 * @param event - Neutral AnalyticsEvent to transform
 * @param measurementId - GA4 Measurement ID (format: G-XXXXXXXXXX)
 * @param debug - Optional debug mode flag (adds debug_mode: 1)
 * @returns GA4 Measurement Protocol v2 compliant payload
 */
export function buildGA4Payload(event: AnalyticsEvent, measurementId: string, debug: boolean = false): GA4Payload {
  try {
    // Validate required parameters
    if (!measurementId) {
      throw new Error('GA4 measurement ID is required')
    }

    if (!event || !event.name) {
      throw new Error('Event name is required')
    }

    // Generate client ID for this event
    const clientId = generateGA4ClientId()

    // Map standard parameters
    const standardParams = mapAttributesToGA4Parameters(event.attributes)

    // Extract custom parameters
    const customParams = extractCustomParameters(event.attributes)

    // Merge standard and custom parameters
    const allEventParameters: Record<string, any> = { ...standardParams, ...customParams }

    // Add debug mode if enabled
    if (debug) {
      allEventParameters['debug_mode'] = 1
    }

    // Create GA4 event
    const ga4Event: GA4Event = {
      name: event.name,
      parameters: Object.keys(allEventParameters).length > 0 ? allEventParameters : undefined
    }

    // Build payload
    const payload: GA4Payload = {
      client_id: clientId,
      events: [ga4Event],
      timestamp_micros: (Date.now() * 1000).toString() // Convert to microseconds
    }

    appLogger.debug('GA4 payload built successfully', {
      eventName: event.name,
      clientId,
      parameterCount: Object.keys(allEventParameters).length
    })

    return payload

  } catch (error) {
    appLogger.error('Failed to build GA4 payload', {
      eventName: event?.name,
      error: error instanceof Error ? error.message : String(error)
    })

    // Re-throw to let caller handle the error
    throw error
  }
}