export interface Env {
  REDIRECT_KV: KVNamespace
  ANALYTICS_KV: KVNamespace
  ALLOWED_DOMAINS?: string
}

export interface RedirectData {
  url: string
  type: 'permanent' | 'temporary'
  created: string // ISO 8601
}

export interface AnalyticsEvent {
  name: string
  params: Record<string, string | number | boolean>
  user_id?: string
  timestamp: string
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
