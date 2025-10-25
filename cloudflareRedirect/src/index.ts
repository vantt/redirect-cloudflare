import { Hono } from 'hono'
import redirectApp from './routes/redirect'
import bootstrapApp from './routes/bootstrap'
import { RedirectError } from './lib/errors'

const app = new Hono()

// Mount bootstrap routes (handles legacy fragment URLs)
app.route('/', bootstrapApp)

// Mount redirect routes
app.route('/r', redirectApp)

// Global error handler
app.onError((err, c) => {
  // Log error details for debugging
  console.error('Error occurred:', {
    message: err.message,
    name: err.name,
    statusCode: err instanceof RedirectError ? err.statusCode : 500,
    code: err instanceof RedirectError ? err.code : 'INTERNAL_ERROR',
    stack: err.stack,
    url: c.req.url,
    method: c.req.method
  })

  // Handle RedirectError instances
  if (err instanceof RedirectError) {
    return c.json({
      error: err.message,
      code: err.code
    }, err.statusCode as 400 | 404 | 500)
  }

  // Handle unknown errors
  return c.json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  }, 500)
})

export default app

