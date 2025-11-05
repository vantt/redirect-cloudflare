

import type { KVNamespace } from '@cloudflare/workers-types'

export interface Env {
  REDIRECT_KV: KVNamespace
  // Note: ANALYTICS_KV removed - retry queue deferred to Epic 9
  // Current analytics is fire-and-forget without persistence
  ALLOWED_DOMAINS?: string
  ENABLE_TRACKING?: string // Feature flag to enable/disable tracking (default: "false")
  DEFAULT_REDIRECT_URL?: string // Default URL for root endpoint when no hash provided
  ANALYTICS_PROVIDERS?: string // Comma-separated list of provider tokens (e.g., "ga4,mixpanel")
  GA4_MEASUREMENT_ID?: string // Google Analytics 4 Measurement ID
  GA4_API_SECRET?: string // Google Analytics 4 API Secret
  GA4_DEBUG?: string // GA4 debug mode flag (default: "false")
  MIXPANEL_TOKEN?: string // Mixpanel API Token
  ANALYTICS_TIMEOUT_MS?: string // Per-provider timeout in milliseconds (default: "2000")
}

export interface RedirectData {
  url: string
  type: 'permanent' | 'temporary'
  created?: string // ISO 8601 (optional)
}

// AnalyticsEvent moved to src/lib/analytics/types.ts as part of Epic 7
// Use: import { AnalyticsEvent } from '../lib/analytics/types'

export interface TrackingParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  xptdk?: string
  ref?: string
}

export interface TrackingData {
  redirect_id: string
  destination_url: string
  redirect_type: 'permanent' | 'temporary'
  user_agent?: string
  ip_address?: string
  referrer?: string
  timestamp: string
}
