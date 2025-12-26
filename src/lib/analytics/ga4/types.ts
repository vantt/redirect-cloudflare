/**
 * GA4 Measurement Protocol Types
 *
 * Type definitions for Google Analytics 4 Measurement Protocol v2 payloads.
 * Follows GA4 specification for event structure and parameter naming.
 *
 * Part of Epic 8: Google Analytics 4 Integration
 */

/**
 * GA4 Measurement Protocol v2 payload structure
 */
export interface GA4Payload {
  /** Client identifier for the user session */
  client_id: string

  /** User-level properties (optional) */
  user_properties?: Record<string, GA4UserProperty>

  /** Array of events to send */
  events: GA4Event[]

  /** Timestamp when the payload was generated (UNIX milliseconds) */
  timestamp_micros?: string
}

/**
 * GA4 event structure
 */
export interface GA4Event {
  /** Event name (e.g., 'redirect_click') */
  name: string

  /** Event-specific parameters */
  parameters?: Record<string, any>
}

/**
 * GA4 user property structure
 */
export interface GA4UserProperty {
  /** Property value */
  value: any
}

/**
 * GA4 Measurement Protocol parameter names
 * Following GA4 specification for standard parameters
 */
export interface GA4StandardParameters {
  /** Campaign source (original: utm_source) */
  campaign_source?: string

  /** Campaign medium (original: utm_medium) */
  campaign_medium?: string

  /** Campaign name (original: utm_campaign) */
  campaign_name?: string

  /** Campaign content (original: utm_content) */
  campaign_content?: string

  /** Campaign keyword (original: utm_term) */
  campaign_keyword?: string

  /** Engagement identifier (original: short_url) */
  engagement_id?: string

  /** Link URL (original: destination_url) */
  link_url?: string

  /** Link domain (original: redirect_type) */
  link_domain?: string

  /** Debug mode flag (GA4 specific) */
  debug_mode?: number | boolean
}

/**
 * GA4 Measurement Protocol v2 configuration
 */
export interface GA4Config {
  /** GA4 Measurement ID (format: G-XXXXXXXXXX) */
  measurementId: string

  /** GA4 API Secret for Measurement Protocol */
  apiSecret: string

  /** Optional custom parameters to include with all events */
  defaultParameters?: Record<string, any>

  /** Debug mode flag */
  debug?: boolean

  /** Request timeout in milliseconds (default: 2000) */
  timeout?: number

  /** HTTP client initialization status (for debugging) */
  httpClientStatus?: 'initialized' | 'not_initialized'
}