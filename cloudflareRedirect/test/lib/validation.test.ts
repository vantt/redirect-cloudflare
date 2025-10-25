import { describe, it, expect } from 'vitest'
import { redirectSchema } from '../../src/lib/validation'

describe('Redirect Schema Validation', () => {
  it('should validate valid URL without n parameter', () => {
    const result = redirectSchema.safeParse({
      to: 'https://example.com'
    })
    
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.to).toBe('https://example.com')
      expect(result.data.n).toBeUndefined()
    }
  })

  it('should validate valid URL with n=1', () => {
    const result = redirectSchema.safeParse({
      to: 'https://example.com',
      n: '1'
    })
    
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.to).toBe('https://example.com')
      expect(result.data.n).toBe('1')
    }
  })

  it('should validate valid URL with n=0', () => {
    const result = redirectSchema.safeParse({
      to: 'https://example.com',
      n: '0'
    })
    
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.to).toBe('https://example.com')
      expect(result.data.n).toBe('0')
    }
  })

  it('should reject invalid URL', () => {
    const result = redirectSchema.safeParse({
      to: 'invalid-url'
    })
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('to')
    }
  })

  it('should reject missing to parameter', () => {
    const result = redirectSchema.safeParse({})
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('to')
    }
  })

  it('should reject invalid n parameter value', () => {
    const result = redirectSchema.safeParse({
      to: 'https://example.com',
      n: '2'
    })
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('n')
    }
  })

  it('should reject empty to parameter', () => {
    const result = redirectSchema.safeParse({
      to: ''
    })
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('to')
    }
  })
})