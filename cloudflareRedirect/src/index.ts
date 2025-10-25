import { Hono } from 'hono'
import redirectApp from './routes/redirect'

const app = new Hono()

app.get('/', (c) => c.text('Hello World'))

// Mount redirect routes
app.route('/r', redirectApp)

export default app

