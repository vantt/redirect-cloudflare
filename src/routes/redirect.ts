import { Hono } from 'hono'
import { RedirectError } from '../lib/errors'
import { appLogger } from '../utils/logger'
import { extractTrackingParams, buildGA4Payload, sendGA4Event } from '../lib/tracking'
import { parseDestinationFromQuery } from '../lib/query-parser'
import { createDebugResponse, createRedirectResponse } from '../lib/response-builder'
import { resolveDestination, validateResolvedUrl, type DebugInfo } from '../lib/destination-resolver'
import type { Env, TrackingParams } from '../types/env'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  try {
    // Step 1: Parse - Extract destination and debug mode (unchanged)
    const { destination, debugMode } = parseDestinationFromQuery(c.req.url)

    // Step 2: Resolve - Resolve destination with conditional KV loading
    const resolved = await resolveDestination(destination, c.env.REDIRECT_KV)

    // Step 3: Debug - Show resolved info if debug mode
    if (debugMode) {
      const debugInfo: DebugInfo = {
        original: destination,
        resolved: resolved.url,
        type: resolved.type,
        source: resolved.source,
        shortcode: resolved.shortcode
      }
      return createDebugResponse(destination, debugInfo)
    }

    // Step 4: Validate - Validate final URL after resolution
    const validatedUrl = validateResolvedUrl(resolved.url, c.env.ALLOWED_DOMAINS)

    // Step 5: Track - Extract tracking and send analytics
    const trackingParams = extractTrackingParams(validatedUrl)

    if (trackingParams && Object.keys(trackingParams).length > 0 && c.env.GA4_MEASUREMENT_ID && c.env.GA4_API_SECRET) {
      try {
        const ga4Payload = buildGA4Payload({
          shortUrl: resolved.shortcode || destination, // Use shortcode if available, else original
          fullDestination: validatedUrl,
          redirectType: resolved.type,
          trackingParams: trackingParams,
          userAgent: c.req.header('User-Agent'),
          ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
        }, c.env.GA4_MEASUREMENT_ID)

        // Fire-and-forget GA4 event (non-blocking)
        sendGA4Event(ga4Payload, c.env.GA4_API_SECRET, c.env.GA4_MEASUREMENT_ID).catch(error => {
          appLogger.warn('GA4 event failed', { error: error instanceof Error ? error.message : 'Unknown error' })
        })
      } catch (trackingError) {
        // Tracking failure should not block redirect
        appLogger.warn('Tracking preparation failed', {
          error: trackingError instanceof Error ? trackingError.message : 'Unknown error',
          destination: destination
        })
      }
    }

    // Step 6: Redirect - Return redirect response
    return createRedirectResponse(validatedUrl, resolved.type)

  } catch (error) {
    // Handle validation errors
    if (error instanceof RedirectError) {
      appLogger.warn('Redirect request failed', {
        error: error.message,
        code: error.code,
        status: error.statusCode,
        url: c.req.url
      })

      return c.json({
        error: error.message,
        code: error.code,
        status: error.statusCode
      }, { status: error.statusCode as any })
    }

    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      appLogger.warn('Validation failed', {
        error: error.message,
        url: c.req.url
      })

      return c.json({
        error: 'Invalid destination URL',
        code: 'VALIDATION_ERROR',
        status: 400
      }, { status: 400 })
    }

    // Handle unexpected errors
    appLogger.error('Unexpected error in redirect', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: c.req.url
    })

    return c.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      status: 500
    }, { status: 500 })
  }
})

// Health check endpoint for monitoring
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'cloudflareRedirect'
  })
})

export default app