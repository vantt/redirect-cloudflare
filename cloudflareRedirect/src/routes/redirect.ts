import { Hono } from 'hono'
import { HonoRequest } from 'hono'
import { RedirectError } from '../lib/errors'
import { getRedirect } from '../lib/kv-store'
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

app.get('/', async (c) => {
  try {
    const destination = getRedirectQuery(c.req)
    
    // Check if destination exists in KV store
    const redirectData = await getRedirect(destination, c.env.REDIRECT_KV)
    
    if (redirectData && redirectData.type && (redirectData.type === 'permanent' || redirectData.type === 'temporary')) {
      // Use KV data for redirect (AC #2)
      return createRedirectResponse(redirectData.url, redirectData.type)
    } else if (redirectData) {
      // Malformed KV data - fallback to 302 with warning (AC #7)
      console.warn(`Malformed redirect data for "${destination}":`, redirectData)
      return createRedirectResponse(destination, 'temporary')
    } else {
      // URL not found in KV - fallback to 302 for direct redirect (AC #3)
      return createRedirectResponse(destination, 'temporary')
    }
  } catch (error) {
    // Let the global error handler handle RedirectError instances
    throw error
  }
})

export default app