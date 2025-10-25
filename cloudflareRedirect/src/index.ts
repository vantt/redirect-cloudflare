import { Hono } from 'hono'
import redirectApp from './routes/redirect'
import bootstrapApp from './routes/bootstrap'
import { RedirectError } from './lib/errors'
import { appLogger } from './utils/logger'

const app = new Hono()

// Custom logger middleware since @hono/logger doesn't exist in Workers environment
// Note: Using custom implementation instead of Hono's logger due to Workers constraints
app.use('*', async (c, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(`${c.req.method} ${c.req.url} ${c.res.status} ${ms}ms`)
})

// Mount bootstrap routes (handles legacy fragment URLs)
app.route('/', bootstrapApp)

// Mount redirect routes
app.route('/r', redirectApp)

// Global error handler
app.onError((err, c) => {
  // Log error details for debugging using structured logger
  appLogger.error('Request error', {
    error: err.message,
    statusCode: err instanceof RedirectError ? err.statusCode : 500,
    code: err instanceof RedirectError ? err.code : 'INTERNAL_ERROR',
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

