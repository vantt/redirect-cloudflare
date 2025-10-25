import { describe, it, expect } from 'vitest'
import { validateDestinationDomain } from '../../src/lib/validation'

describe('Domain Allowlist Validation', () => {
  it('should allow exact domain match', () => {
    const result = validateDestinationDomain('https://example.com', 'example.com')
    expect(result).toBe(true)
  })

  it('should allow subdomain of allowed domain', () => {
    const result = validateDestinationDomain('https://sub.example.com', 'example.com')
    expect(result).toBe(true)
  })

  it('should allow multiple subdomain levels', () => {
    const result = validateDestinationDomain('https://sub.sub.example.com', 'example.com')
    expect(result).toBe(true)
  })

  it('should reject different domain', () => {
    const result = validateDestinationDomain('https://evil.com', 'example.com')
    expect(result).toBe(false)
  })

  it('should reject domain with similar prefix', () => {
    const result = validateDestinationDomain('https://example.com.evil.com', 'example.com')
    expect(result).toBe(false)
  })

  it('should reject exact subdomain of different domain', () => {
    const result = validateDestinationDomain('https://sub.evil.com', 'example.com')
    expect(result).toBe(false)
  })

  it('should allow when allowlist is undefined (permissive)', () => {
    const result = validateDestinationDomain('https://anydomain.com', undefined)
    expect(result).toBe(true)
  })

  it('should allow when allowlist is empty (permissive)', () => {
    const result = validateDestinationDomain('https://anydomain.com', '')
    expect(result).toBe(true)
  })

  it('should allow when allowlist is whitespace only (permissive)', () => {
    const result = validateDestinationDomain('https://anydomain.com', '   ')
    expect(result).toBe(true)
  })

  it('should handle multiple domains in allowlist', () => {
    const result1 = validateDestinationDomain('https://example.com', 'example.com,trusted.org')
    const result2 = validateDestinationDomain('https://trusted.org', 'example.com,trusted.org')
    const result3 = validateDestinationDomain('https://evil.com', 'example.com,trusted.org')
    
    expect(result1).toBe(true)
    expect(result2).toBe(true)
    expect(result3).toBe(false)
  })

  it('should handle case-insensitive matching', () => {
    const result1 = validateDestinationDomain('https://Example.Com', 'example.com')
    const result2 = validateDestinationDomain('https://EXAMPLE.COM', 'example.com')
    
    expect(result1).toBe(true)
    expect(result2).toBe(true)
  })

  it('should handle malformed URLs gracefully', () => {
    const result = validateDestinationDomain('not-a-url', 'example.com')
    expect(result).toBe(false)
  })

  it('should handle URL parsing errors defensively', () => {
    const result = validateDestinationDomain('https://[invalid-ipv6]', 'example.com')
    expect(result).toBe(false)
  })

  it('should work with URLs containing paths and queries', () => {
    const result = validateDestinationDomain(
      'https://example.com/path/to/resource?query=value#fragment',
      'example.com'
    )
    expect(result).toBe(true)
  })

  it('should work with subdomains containing paths and queries', () => {
    const result = validateDestinationDomain(
      'https://sub.example.com/api/v1/users?id=123',
      'example.com'
    )
    expect(result).toBe(true)
  })

  it('should handle domains with ports', () => {
    const result1 = validateDestinationDomain('https://example.com:443', 'example.com')
    const result2 = validateDestinationDomain('https://sub.example.com:8080', 'example.com')
    
    expect(result1).toBe(true)
    expect(result2).toBe(true)
  })

  it('should clean whitespace in allowlist', () => {
    const result1 = validateDestinationDomain('https://example.com', ' example.com ')
    const result2 = validateDestinationDomain('https://trusted.org', 'trusted.org , example.com')
    
    expect(result1).toBe(true)
    expect(result2).toBe(true)
  })

  it('should handle empty entries in allowlist', () => {
    const result = validateDestinationDomain('https://example.com', 'trusted.org,,example.com')
    expect(result).toBe(true)
  })
})