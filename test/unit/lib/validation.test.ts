import { describe, it, expect } from 'vitest'
import { redirectSchema } from '../../../src/lib/validation'

describe('Redirect Schema Protocol Validation', () => {
  it('should validate valid http URLs', () => {
    const result = redirectSchema.safeParse({
      to: 'http://example.com',
      debug: '1'
    })
    
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.to).toBe('http://example.com')
      expect(result.data.debug).toBe('1')
    }
  })

  it('should validate valid https URLs', () => {
    const result = redirectSchema.safeParse({
      to: 'https://example.com/path?query=value',
      debug: '0'
    })
    
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.to).toBe('https://example.com/path?query=value')
      expect(result.data.debug).toBe('0')
    }
  })

  it('should reject javascript: URLs', () => {
    const result = redirectSchema.safeParse({
      to: 'javascript:alert(1)'
    })
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Only HTTP/HTTPS URLs allowed')
    }
  })

  it('should reject data: URLs', () => {
    const result = redirectSchema.safeParse({
      to: 'data:text/html,<script>alert(1)</script>'
    })
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Only HTTP/HTTPS URLs allowed')
    }
  })

  it('should reject file: URLs', () => {
    const result = redirectSchema.safeParse({
      to: 'file:///path/to/file.html'
    })
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Only HTTP/HTTPS URLs allowed')
    }
  })

  it('should reject ftp: URLs', () => {
    const result = redirectSchema.safeParse({
      to: 'ftp://example.com/file.txt'
    })
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Only HTTP/HTTPS URLs allowed')
    }
  })

  it('should reject protocol-relative URLs', () => {
    const result = redirectSchema.safeParse({
      to: '//example.com/path'
    })
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Only HTTP/HTTPS URLs allowed')
    }
  })

  it('should reject empty strings', () => {
    const result = redirectSchema.safeParse({
      to: ''
    })
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Only HTTP/HTTPS URLs allowed')
    }
  })

  it('should reject whitespace-only strings', () => {
    const result = redirectSchema.safeParse({
      to: '   '
    })
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Only HTTP/HTTPS URLs allowed')
    }
  })

  it('should accept URLs without n parameter', () => {
    const result = redirectSchema.safeParse({
      to: 'https://example.com'
    })
    
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.to).toBe('https://example.com')
      expect(result.data.n).toBeUndefined()
    }
  })

  it('should reject malformed URLs', () => {
    const result = redirectSchema.safeParse({
      to: 'not-a-url'
    })
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Only HTTP/HTTPS URLs allowed')
    }
  })

  it('should work with complex https URLs', () => {
    const result = redirectSchema.safeParse({
      to: 'https://subdomain.example.com:8080/path/to/resource?param1=value1&param2=value2#fragment'
    })
    
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.to).toBe('https://subdomain.example.com:8080/path/to/resource?param1=value1&param2=value2#fragment')
    }
  })
})
