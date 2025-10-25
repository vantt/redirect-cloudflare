export interface Env {
  REDIRECT_KV: KVNamespace
  ALLOWED_DOMAINS?: string
}

export interface RedirectData {
  url: string
  type: 'permanent' | 'temporary'
  created: string // ISO 8601
}
