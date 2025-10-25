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