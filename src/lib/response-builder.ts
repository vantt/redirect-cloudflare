import { extractTrackingParams } from './tracking'
import { appLogger } from '../utils/logger'

/**
 * Create debug response for development/testing
 * 
 * @param destination - The destination URL to redirect to
 * @returns Response object with JSON debug information
 */
export const createDebugResponse = (destination: string): Response => {
  const trackingParams = extractTrackingParams(destination)

  const debugPayload = {
    destination,
    tracking_params: trackingParams,
    redirect_type: "302",
    note: "Debug mode - redirect suppressed"
  }

  appLogger.info('Debug mode response', {
    destination,
    tracking_params_count: Object.keys(trackingParams).length,
    has_tracking: Object.keys(trackingParams).length > 0
  })

  return new Response(JSON.stringify(debugPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}

/**
 * Create redirect response with proper headers
 * 
 * @param destination - The destination URL to redirect to
 * @param type - Type of redirect: 'permanent' (301) or 'temporary' (302)
 * @returns Response object with redirect headers
 */
export const createRedirectResponse = (destination: string, type: 'permanent' | 'temporary' = 'temporary'): Response => {
  const statusCode = type === 'permanent' ? 301 : 302

  return new Response(null, {
    status: statusCode,
    headers: {
      'Location': destination,
      'Cache-Control': type === 'permanent' ? 'public, max-age=31536000' : 'no-cache'
    }
  })
}