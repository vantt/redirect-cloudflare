import { describe, it, expect } from 'vitest'
import { RedirectError } from '../../src/lib/errors'

describe('RedirectError', () => {
  it('should create error with default values', () => {
    const error = new RedirectError('Test message')
    
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(RedirectError)
    expect(error.name).toBe('RedirectError')
    expect(error.message).toBe('Test message')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('REDIRECT_ERROR')
  })

  it('should create error with custom status code', () => {
    const error = new RedirectError('Not found', 404, 'NOT_FOUND')
    
    expect(error.message).toBe('Not found')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
  })

  it('should create error with custom status code and default error code', () => {
    const error = new RedirectError('Server error', 500)
    
    expect(error.message).toBe('Server error')
    expect(error.statusCode).toBe(500)
    expect(error.code).toBe('REDIRECT_ERROR')
  })

  it('should create error with 404 status code', () => {
    const error = new RedirectError('Resource not found', 404, 'NOT_FOUND')
    
    expect(error.message).toBe('Resource not found')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
  })

  it('should have proper stack trace', () => {
    const error = new RedirectError('Test message')
    
    expect(error.stack).toBeDefined()
    expect(typeof error.stack).toBe('string')
  })
})