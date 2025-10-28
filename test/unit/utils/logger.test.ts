import { describe, it, expect, vi, beforeEach } from 'vitest'
import { appLogger } from '../../../src/utils/logger'

describe('Structured Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should output structured JSON for info logs', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    const testMessage = 'Test info message'
    const testMetadata = { userId: '123', action: 'redirect' }
    
    appLogger.info(testMessage, testMetadata)
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"level":"info"')
    )
    
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0])
    expect(loggedData.level).toBe('info')
    expect(loggedData.message).toBe(testMessage)
    expect(loggedData.userId).toBe('123')
    expect(loggedData.action).toBe('redirect')
    expect(loggedData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    
    consoleSpy.mockRestore()
  })

  it('should output structured JSON for error logs', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const testMessage = 'Test error message'
    const testMetadata = { error: 'Database connection failed' }
    
    appLogger.error(testMessage, testMetadata)
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"level":"error"')
    )
    
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0])
    expect(loggedData.level).toBe('error')
    expect(loggedData.message).toBe(testMessage)
    expect(loggedData.error).toBe('Database connection failed')
    expect(loggedData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    
    consoleSpy.mockRestore()
  })

  it('should work without metadata', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    appLogger.info('Simple message')
    
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0])
    expect(loggedData.level).toBe('info')
    expect(loggedData.message).toBe('Simple message')
    expect(loggedData.timestamp).toBeDefined()
    
    consoleSpy.mockRestore()
  })
})
