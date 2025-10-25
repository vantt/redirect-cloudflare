import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HonoRequest } from 'hono'
import { RedirectError } from '../lib/errors'
import { getRedirect } from '../lib/kv-store'
import { appLogger } from '../utils/logger'
import { redirectSchema } from '../lib/validation'
import { extractTrackingParams } from '../lib/tracking'
import type { RedirectData, Env } from '../types/env'

export const getRedirectQuery = (req: HonoRequest): string => {
  const toParam = req.query('to')
  
  if (!toParam) {
    throw new RedirectError('Missing required parameter: to', 400, 'MISSING_PARAM')
  }
  
  try {
    // Decode URL parameter to handle URL-encoded characters
    return decodeURIComponent(toParam)
  } catch (error) {
    // If decoding fails, throw RedirectError to trigger error response
    throw new RedirectError('Invalid URL encoding', 400, 'INVALID_ENCODING')
  }
}

export const createDebugResponse = (destination: string): Response => {
  // Extract tracking parameters for debug mode
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

export const createRedirectResponse = (destination: string, type: 'permanent' | 'temporary' = 'temporary'): Response => {
  // Map redirect type to HTTP status code
  const statusCode = type === 'permanent' ? 301 : 302
  
  return new Response(null, {
    status: statusCode,
    headers: {
      'Location': destination,
      'Cache-Control': type === 'permanent' ? 'public, max-age=31536000' : 'no-cache'
    }
  })
}

// Create Hono app for redirect routes
const app = new Hono<{ Bindings: Env }>()

// Update the handler to use zValidator
app.get('/', zValidator('query', redirectSchema), async (c) => {
  try {
    // Get validated query parameters
    const query = c.req.valid('query')
    const destination = query.to
    const debugMode = query.n === '1'
    
    // Debug mode: return JSON instead of redirect
    if (debugMode) {
      return createDebugResponse(destination)
    }
    // Normal redirect flow (n=0 or n not provided)
    const redirectData = await getRedirect(destination, c.env.REDIRECT_KV)
    
    if (redirectData && redirectData.type && (redirectData.type === 'permanent' || redirectData.type === 'temporary')) {
      // Use KV data for redirect (AC #2)
      appLogger.info('Redirect processed', {
        path: c.req.path,
        destination: redirectData.url,
        type: redirectData.type,
        tracking: false
      })
      return createRedirectResponse(redirectData.url, redirectData.type)
    } else if (redirectData) {
      // Malformed KV data - fallback to 302 with warning (AC #7)
      appLogger.info('Redirect processed with malformed KV data', {
        path: c.req.path,
        destination,
        type: 'temporary',
        tracking: false,
        warning: 'Malformed KV data'
      })
      console.warn(`Malformed redirect data for "${destination}":`, redirectData)
      return createRedirectResponse(destination, 'temporary')
    } else {
      // URL not found in KV - fallback to 302 for direct redirect (AC #3)
      appLogger.info('Redirect processed', {
        path: c.req.path,
        destination,
        type: 'temporary',
        tracking: false
      })
      return createRedirectResponse(destination, 'temporary')
    }
  } catch (error) {
    // Let the global error handler handle RedirectError instances
    throw error
  }
})

export default app