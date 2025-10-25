import { Hono } from 'hono'
import { HonoRequest } from 'hono'
import { RedirectError } from '../lib/errors'

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

export const createRedirectResponse = (destination: string): Response => {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': destination,
      'Cache-Control': 'no-cache'
    }
  })
}

// Create Hono app for redirect routes
const app = new Hono()

app.get('/', (c) => {
  try {
    const destination = getRedirectQuery(c.req)
    return createRedirectResponse(destination)
  } catch (error) {
    // Let the global error handler handle RedirectError instances
    throw error
  }
})

export default app