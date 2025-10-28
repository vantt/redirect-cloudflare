import { Hono } from 'hono'
import { RedirectError } from '../lib/errors'
import { getRedirect } from '../lib/kv-store'
import { appLogger } from '../utils/logger'
import { redirectSchema, validateDestinationDomain } from '../lib/validation'
import { extractTrackingParams, buildGA4Payload, sendGA4Event } from '../lib/tracking'
import { parseDestinationFromQuery } from '../lib/query-parser'
import { createDebugResponse, createRedirectResponse } from '../lib/response-builder'
import type { Env, RedirectData, TrackingParams } from '../types/env'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  try {
    // Use smart parser to extract destination and debug mode
    // Handles both URL-encoded and non-encoded destination URLs
    const { destination, debugMode } = parseDestinationFromQuery(c.req.url)

    if (debugMode) {
      // Debug mode: return response with tracking info
      return createDebugResponse(destination)
    }

    // Production mode: validate destination URL
    const validated = redirectSchema.parse({ to: destination })

    // Validate destination domain if allowlist is configured
    if (c.env.ALLOWED_DOMAINS && !validateDestinationDomain(validated.to, c.env.ALLOWED_DOMAINS)) {
      throw new RedirectError('Destination domain not allowed', 403, 'DOMAIN_NOT_ALLOWED')
    }

    // Get redirect mapping from KV store
    const redirectData = await getRedirect(validated.to, c.env.REDIRECT_KV)

    if (!redirectData) {
      throw new RedirectError('Redirect not found', 404, 'NOT_FOUND')
    }

    // Extract tracking parameters from destination URL
    const trackingParams = extractTrackingParams(redirectData.url)

    // Build and send GA4 event
    if (trackingParams && Object.keys(trackingParams).length > 0 && c.env.GA4_MEASUREMENT_ID && c.env.GA4_API_SECRET) {
      try {
        const ga4Payload = buildGA4Payload({
          shortUrl: validated.to,
          fullDestination: redirectData.url,
          redirectType: redirectData.type,
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

    // Return redirect response
    return createRedirectResponse(redirectData.url, redirectData.type)

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