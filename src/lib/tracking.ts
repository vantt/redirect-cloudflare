import { appLogger } from '../utils/logger'
import { TrackingParams } from '../types/env'

type GA4EventParams = Record<string, string>

interface GA4Event {
  name: string
  params: GA4EventParams
}

interface GA4Payload {
  client_id: string
  events: GA4Event[]
}

interface GA4Error {
  success: boolean
  error: string
  errorName?: string
}

const GA4_EVENT_NAME = 'redirect_click'
const FNV1A_64_OFFSET_BASIS = BigInt('0xcbf29ce484222325')
const FNV1A_64_PRIME = BigInt('0x100000001b3')
const GA4_COLLECT_URL = 'https://www.google-analytics.com/mp/collect'

function sanitizeEventParams(params: TrackingParams): GA4EventParams {
  const sanitized: GA4EventParams = {}
  if (!params) {
    return sanitized
  }

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      sanitized[key] = value
    }
  }

  return sanitized
}

function fnv1a64(input: string): string {
  let hash = FNV1A_64_OFFSET_BASIS

  for (let i = 0; i < input.length; i += 1) {
    hash ^= BigInt(input.charCodeAt(i))
  }
  hash = (hash * FNV1A_64_PRIME) & BigInt('0xffffffffffffffff')
  return hash.toString(16).padStart(16, '0')
}

function generateClientId(): string {
  const timestamp = Date.now()
  const randomBytes = new Uint8Array(16)
  crypto.getRandomValues(randomBytes)
  const randomHex = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  const hash = fnv1a64(`${timestamp}:${randomHex}`)

  return `${hash}.${timestamp}`
}

export function extractTrackingParams(destinationUrl: string): TrackingParams {
  try {
    const url = new URL(destinationUrl)
    const params = new URLSearchParams(url.search)
    
    const trackingParams: TrackingParams = {}
    
    const utmSource = params.get('utm_source')
    const utmMedium = params.get('utm_medium') 
    const utmCampaign = params.get('utm_campaign')
    const utmContent = params.get('utm_content')
    const utmTerm = params.get('utm_term')
    const xptdk = params.get('xptdk')
    const ref = params.get('ref')
    
    if (utmSource) trackingParams.utm_source = decodeURIComponent(utmSource)
    if (utmMedium) trackingParams.utm_medium = decodeURIComponent(utmMedium)
    if (utmCampaign) trackingParams.utm_campaign = decodeURIComponent(utmCampaign)
    if (utmContent) trackingParams.utm_content = decodeURIComponent(utmContent)
    if (utmTerm) trackingParams.utm_term = decodeURIComponent(utmTerm)
    if (xptdk) trackingParams.xptdk = decodeURIComponent(xptdk)
    if (ref) trackingParams.ref = decodeURIComponent(ref)
    
    return trackingParams
  } catch (error) {
    appLogger.error('Failed to parse destination URL for tracking extraction', {
      url: destinationUrl,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return {}
  }
}

/**
 * @deprecated This function will be moved to a dedicated GA4 provider in Epic 8.
 */
export function buildGA4Payload(params: {
  shortUrl: string;
  fullDestination: string;
  redirectType: 'permanent' | 'temporary';
  trackingParams: TrackingParams;
  userAgent?: string;
  ip?: string;
}, measurementId?: string): GA4Payload {
  if (!measurementId || measurementId.trim().length === 0) {
    throw new Error('GA4 measurement ID is required to build payload')
  }

  return {
    client_id: generateClientId(),
    events: [
      {
        name: GA4_EVENT_NAME,
        params: sanitizeEventParams(params.trackingParams),
      },
    ],
  }
}

/**
 * @deprecated This function will be moved to a dedicated GA4 provider in Epic 8.
 */
export async function sendGA4Event(
  payload: object, 
  apiSecret: string, 
  measurementId: string
): Promise<GA4Error> {
  try {
    const collectUrl = new URL(GA4_COLLECT_URL)
    collectUrl.searchParams.set('measurement_id', measurementId)
    collectUrl.searchParams.set('api_secret', apiSecret)
    
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'cloudflareRedirect/1.0.0'
    }
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    
    try {
      const response = await fetch(collectUrl.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`GA4 request failed: ${response.status} ${response.statusText}`)
      }
      
      appLogger.info('GA4 tracking event sent', {
        measurementId,
        payloadType: (payload as any).type || 'unknown',
        status: response.status,
        latencyMs: null
      })
      
      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      
      const errorObj = error as Error
      
      if (errorObj.name === 'AbortError') {
        appLogger.warn('GA4 tracking request timed out', {
          measurementId,
          timeoutMs: 2000,
          error: errorObj.message
        })
      } else {
        appLogger.error('GA4 tracking request failed', {
          measurementId,
          error: errorObj.message,
          errorName: errorObj.name
        })
      }
      
      const errorResponse: GA4Error = { 
        success: false, 
        error: errorObj.message, 
        errorName: errorObj.name
      }
      return Promise.resolve(errorResponse)
    }
  } catch (error) {
    const errorObj = error as Error
    
    appLogger.error('GA4 tracking failed', {
      measurementId,
      error: errorObj.message,
      errorName: errorObj.name
    })
    
    const errorResponse: GA4Error = { 
      success: false, 
      error: errorObj.message, 
      errorName: errorObj.name
    }
    return Promise.resolve(errorResponse)
  }
}