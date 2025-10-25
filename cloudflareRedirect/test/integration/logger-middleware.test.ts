import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { appLogger } from '../../src/utils/logger'

describe('Logger Middleware Integration', () => {
  let app: Hono
  let consoleSpy: any

  beforeEach(() => {
    app = new Hono()
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should log requests and responses', async () => {
    // Custom logger middleware (replicating the implementation in index.ts)
    app.use('*', async (c, next) => {
      const start = Date.now()
      await next()
      const ms = Date.now() - start
      console.log(`${c.req.method} ${c.req.url} ${c.res.status} ${ms}ms`)
    })
    app.get('/test', (c) => c.text('Hello World'))

    await app.request('/test')

    // Custom logger should log request/response
    expect(consoleSpy).toHaveBeenCalled()
    const logMessage = consoleSpy.mock.calls[0][0]
    expect(logMessage).toContain('GET')
    expect(logMessage).toContain('/test')
    expect(logMessage).toContain('200')
    expect(logMessage).toContain('ms')
  })

  it('should work with different HTTP methods', async () => {
    app.use('*', async (c, next) => {
      const start = Date.now()
      await next()
      const ms = Date.now() - start
      console.log(`${c.req.method} ${c.req.url} ${c.res.status} ${ms}ms`)
    })
    app.get('/test', (c) => c.text('GET'))
    app.post('/test', (c) => c.text('POST'))

    await app.request('/test')
    await app.request('/test', { method: 'POST' })

    expect(consoleSpy).toHaveBeenCalledTimes(2)
    
    const getLog = consoleSpy.mock.calls[0][0]
    const postLog = consoleSpy.mock.calls[1][0]
    expect(getLog).toContain('GET')
    expect(postLog).toContain('POST')
  })

  it('should maintain structured logger functionality', async () => {
    const structuredSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    appLogger.info('Test message', { key: 'value' })
    
    expect(structuredSpy).toHaveBeenCalledWith(
      expect.stringContaining('"level":"info"')
    )
    
    const loggedData = JSON.parse(structuredSpy.mock.calls[0][0])
    expect(loggedData.level).toBe('info')
    expect(loggedData.message).toBe('Test message')
    expect(loggedData.key).toBe('value')
    
    structuredSpy.mockRestore()
  })
})