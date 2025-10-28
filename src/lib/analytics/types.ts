/**
 * Analytics Neutral Types
 * 
 * Vendor-neutral event model for decoupling business events 
 * from specific analytics provider implementations.
 * 
 * Part of Epic 7: Analytics Abstraction (Multi-Service)
 */

/**
 * Analytics event attribute values can be strings, numbers, or booleans
 * Provides flexibility for different types of analytics data
 */
export type AnalyticsAttributes = Record<string, string | number | boolean>

/**
 * Neutral analytics event model
 * Represents a business event with name and structured attributes
 */
export interface AnalyticsEvent {
  /** Event name identifier (e.g., 'redirect_click') */
  name: string
  
  /** Event attributes as key-value pairs */
  attributes: AnalyticsAttributes
}

/**
 * Supported neutral event names
 * Enum ensures consistent naming across the system
 */
export enum EventName {
  /** User clicked a redirect link */
  REDIRECT_CLICK = 'redirect_click'
  
  // Future event types can be added here as needed
  // PAGE_VIEW = 'page_view'
  // FORM_SUBMIT = 'form_submit'
  // ERROR_OCCURRED = 'error_occurred'
}

/**
 * Standard attribute keys for tracking parameters
 * Ensures consistent naming across all analytics providers
 */
export enum AttributeKey {
  /** UTM campaign source */
  UTM_SOURCE = 'utm_source',
  
  /** UTM campaign medium */
  UTM_MEDIUM = 'utm_medium',
  
  /** UTM campaign name */
  UTM_CAMPAIGN = 'utm_campaign',
  
  /** UTM campaign content */
  UTM_CONTENT = 'utm_content',
  
  /** UTM campaign term */
  UTM_TERM = 'utm_term',
  
  /** Shopee platform tracking parameter */
  XPTDK = 'xptdk',
  
  /** Facebook platform tracking parameter */
  REF = 'ref'
}