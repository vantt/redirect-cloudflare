

import type { KVNamespace } from '@cloudflare/workers-types'

export interface Env {
  REDIRECT_KV: KVNamespace
  ANALYTICS_KV: KVNamespace
  ALLOWED_DOMAINS?: string
  ENABLE_TRACKING?: string // Feature flag to enable/disable tracking (default: "false")
  DEFAULT_REDIRECT_URL?: string // Default URL for root endpoint when no hash provided
  ANALYTICS_PROVIDERS?: string // Comma-separated list of provider tokens (e.g., "ga4,mixpanel")
  GA4_MEASUREMENT_ID?: string // Google Analytics 4 Measurement ID
  GA4_API_SECRET?: string // Google Analytics 4 API Secret
  MIXPANEL_TOKEN?: string // Mixpanel API Token
  ANALYTICS_TIMEOUT_MS?: string // Per-provider timeout in milliseconds (default: "2000")
}

export interface RedirectData {
  url: string
  type: 'permanent' | 'temporary'
  created?: string // ISO 8601 (optional)
}

export interface AnalyticsEvent {
  name: string
  params: Record<string, string | number | boolean>
  user_id?: string
  timestamp: string
}

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
