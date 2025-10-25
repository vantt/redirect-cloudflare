import { Hono } from 'hono'
import { getRedirectQuery, createRedirectResponse, createErrorResponse } from './routes/redirect'

const app = new Hono()

app.get('/', (c) => c.text('Hello World'))

app.get('/r', (c) => {
  const destination = getRedirectQuery(c.req)
  
  if (!destination) {
    return createErrorResponse('Missing required parameter: to', 400)
  }
  
  return createRedirectResponse(destination)
})

export default app

