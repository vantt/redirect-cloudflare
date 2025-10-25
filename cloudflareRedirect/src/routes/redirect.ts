import { Hono } from 'hono'
import { HonoRequest } from 'hono'

export const getRedirectQuery = (req: HonoRequest): string | null => {
  const toParam = req.query('to')
  
  if (!toParam) {
    return null
  }
  
  try {
    // Decode URL parameter to handle URL-encoded characters
    return decodeURIComponent(toParam)
  } catch (error) {
    // If decoding fails, return null to trigger error response
    return null
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

export const createErrorResponse = (message: string, status: number = 400): Response => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// Create Hono app for redirect routes
const app = new Hono()

app.get('/', (c) => {
  const destination = getRedirectQuery(c.req)
  
  if (!destination) {
    return createErrorResponse('Missing required parameter: to', 400)
  }
  
  return createRedirectResponse(destination)
})

export default app