import { Hono } from 'hono'
import { RedirectError } from '../lib/errors'
import { appLogger } from '../utils/logger'
import { parseDestinationFromQuery } from '../lib/query-parser'
import { createDebugResponse, createRedirectResponse } from '../lib/response-builder'
import { resolveDestination, validateResolvedUrl, type DebugInfo } from '../lib/destination-resolver'
import { trackRedirect } from '../lib/analytics/tracking-service'
import type { Env } from '../types/env'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  try {
    // Step 1: Parse - Extract destination and debug mode (unchanged)
    const { destination, debugMode } = parseDestinationFromQuery(c.req.url)

    // Step 2: Resolve - Resolve destination with conditional KV loading
    const resolved = await resolveDestination(destination, c.env.REDIRECT_KV)

    // Step 3: Validate - Validate final URL after resolution (BEFORE debug response)
    // This ensures domain validation applies even in debug mode (Story 7.9 fix)
    const validatedUrl = validateResolvedUrl(resolved.url, c.env.ALLOWED_DOMAINS)

    // Step 4: Debug - Show resolved info if debug mode
    if (debugMode) {
      const debugInfo: DebugInfo = {
        original: destination,
        resolved: resolved.url,
        type: resolved.type,
        source: resolved.source,
        shortcode: resolved.shortcode
      }
      return createDebugResponse(debugInfo)
    }

    // Step 5: Track - Abstracted tracking call
    // Step 5: Track - Abstracted tracking call
    const trackingPromise = trackRedirect({
      shortUrl: resolved.shortcode || destination,
      destinationUrl: validatedUrl,
      redirectType: resolved.type,
      userAgent: c.req.header('User-Agent'),
      ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      originalRequestUrl: c.req.url
    }, c.env).catch(error => {
      appLogger.warn('Tracking service call failed', { error: error instanceof Error ? error.message : 'Unknown error' })
    })

    c.executionCtx.waitUntil(trackingPromise)

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