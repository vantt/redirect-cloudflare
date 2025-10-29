import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  isShortcode, 
  isFullUrl, 
  resolveDestination, 
  validateResolvedUrl,
  type ResolvedDestination
} from '../../../src/lib/destination-resolver'
import { RedirectError } from '../../../src/lib/errors'
import { getRedirect } from '../../../src/lib/kv-store'
import type { RedirectData } from '../../../src/types/env'

// Mock kv-store module
vi.mock('../../../src/lib/kv-store')

describe('destination-resolver', () => {
  const mockKVStore = {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isShortcode', () => {
    it('should return true for valid alphanumeric codes', () => {
      expect(isShortcode('abc')).toBe(true)        // 3 chars (min)
      expect(isShortcode('abc12')).toBe(true)      // 5 chars (common)
      expect(isShortcode('ABC')).toBe(true)        // uppercase
      expect(isShortcode('123xyz789')).toBe(true)  // mixed
      expect(isShortcode('a'.repeat(20))).toBe(true) // 20 chars (max)
    })

    it('should return false for too short codes', () => {
      expect(isShortcode('ab')).toBe(false)        // 2 chars (< 3)
      expect(isShortcode('a')).toBe(false)         // 1 char
      expect(isShortcode('')).toBe(false)          // empty
    })

    it('should return false for too long codes', () => {
      expect(isShortcode('a'.repeat(21))).toBe(false) // 21 chars (> 20)
      expect(isShortcode('a'.repeat(25))).toBe(false) // 25 chars
    })

    it('should return false for non-alphanumeric characters', () => {
      expect(isShortcode('abc-123')).toBe(false)   // dash
      expect(isShortcode('abc_123')).toBe(false)   // underscore
      expect(isShortcode('abc.123')).toBe(false)   // period
      expect(isShortcode('abc/123')).toBe(false)   // slash
      expect(isShortcode('abc 123')).toBe(false)   // space
      expect(isShortcode('abc@123')).toBe(false)   // special char
    })

    it('should return false for URLs', () => {
      expect(isShortcode('https://example.com')).toBe(false)
      expect(isShortcode('http://example.com')).toBe(false)
      expect(isShortcode('//example.com')).toBe(false)
    })
  })

  describe('isFullUrl', () => {
    it('should return true for valid http/https URLs', () => {
      expect(isFullUrl('http://example.com')).toBe(true)
      expect(isFullUrl('https://example.com')).toBe(true)
      expect(isFullUrl('https://example.com/path')).toBe(true)
      expect(isFullUrl('https://example.com/path?query=1')).toBe(true)
      expect(isFullUrl('https://example.com/path?query=1#fragment')).toBe(true)
      expect(isFullUrl('http://localhost:3000')).toBe(true)
    })

    it('should return false for shortcodes', () => {
      expect(isFullUrl('abc12')).toBe(false)
      expect(isFullUrl('ABC')).toBe(false)
      expect(isFullUrl('123xyz789')).toBe(false)
    })

    it('should return false for protocol-relative URLs', () => {
      expect(isFullUrl('//example.com')).toBe(false)
      expect(isFullUrl('//example.com/path')).toBe(false)
    })

    it('should return false for other protocols', () => {
      expect(isFullUrl('ftp://example.com')).toBe(false)
      expect(isFullUrl('mailto:test@example.com')).toBe(false)
      expect(isFullUrl('tel:+1234567890')).toBe(false)
    })

    it('should return false for invalid URLs', () => {
      expect(isFullUrl('example.com')).toBe(false)      // missing protocol
      expect(isFullUrl('www.example.com')).toBe(false)  // missing protocol
      expect(isFullUrl('http:/')).toBe(false)           // incomplete
      expect(isFullUrl('https://')).toBe(false)         // incomplete
    })
  })

  describe('resolveDestination', () => {
    const mockRedirectData: RedirectData = {
      url: 'https://example.com/page',
      type: 'temporary'
    }

    it('should resolve shortcode from KV store', async () => {
      vi.mocked(getRedirect).mockResolvedValue(mockRedirectData)

      const result = await resolveDestination('abc12', mockKVStore)

      expect(getRedirect).toHaveBeenCalledWith('abc12', mockKVStore)
      expect(result).toEqual({
        url: 'https://example.com/page',
        type: 'temporary',
        source: 'kv',
        shortcode: 'abc12'
      } satisfies ResolvedDestination)
    })

    it('should throw SHORTCODE_NOT_FOUND for missing shortcode', async () => {
      vi.mocked(getRedirect).mockResolvedValue(null)

      await expect(resolveDestination('missing', mockKVStore)).rejects.toThrow(RedirectError)
      await expect(resolveDestination('missing', mockKVStore)).rejects.toThrow('Shortcode not found: missing')

      try {
        await resolveDestination('missing', mockKVStore)
      } catch (error: any) {
        expect(error).toBeInstanceOf(RedirectError)
        expect(error.statusCode).toBe(404)
        expect(error.code).toBe('SHORTCODE_NOT_FOUND')
      }
    })

    it('should resolve direct URL without KV lookup', async () => {
      const result = await resolveDestination('https://example.com', mockKVStore)

      expect(getRedirect).not.toHaveBeenCalled()
      expect(result).toEqual({
        url: 'https://example.com',
        type: 'temporary',
        source: 'direct'
      } satisfies ResolvedDestination)
    })

    it('should throw INVALID_DESTINATION_FORMAT for invalid format', async () => {
      await expect(resolveDestination('invalid-format', mockKVStore)).rejects.toThrow(RedirectError)
      await expect(resolveDestination('invalid-format', mockKVStore)).rejects.toThrow('Invalid destination format')

      try {
        await resolveDestination('invalid-format', mockKVStore)
      } catch (error: any) {
        expect(error).toBeInstanceOf(RedirectError)
        expect(error.statusCode).toBe(400)
        expect(error.code).toBe('INVALID_DESTINATION_FORMAT')
      }
    })

    it('should default to temporary redirect if type is missing in KV', async () => {
      const mockRedirectData: Partial<RedirectData> = { url: 'https://example.com/page' };
      vi.mocked(getRedirect).mockResolvedValue(mockRedirectData as RedirectData);

      const result = await resolveDestination('abc12', mockKVStore);

      expect(result.type).toBe('temporary');
    });

    it('should handle KV store errors gracefully', async () => {
      vi.mocked(getRedirect).mockRejectedValue(new Error('KV connection failed'))

      await expect(resolveDestination('abc12', mockKVStore)).rejects.toThrow('KV connection failed')
      expect(getRedirect).toHaveBeenCalledWith('abc12', mockKVStore)
    })
  })

  describe('validateResolvedUrl', () => {
    it('should validate valid http/https URLs', () => {
      expect(validateResolvedUrl('http://example.com')).toBe('http://example.com')
      expect(validateResolvedUrl('https://example.com')).toBe('https://example.com')
      expect(validateResolvedUrl('https://example.com/path')).toBe('https://example.com/path')
    })

    it('should throw validation error for invalid URLs', () => {
      expect(() => validateResolvedUrl('ftp://example.com')).toThrow(RedirectError)
      expect(() => validateResolvedUrl('javascript:alert(1)')).toThrow(RedirectError)
      expect(() => validateResolvedUrl('//example.com')).toThrow(RedirectError)
    })

    it('should pass domain allowlist validation', () => {
      const allowedDomains = 'example.com,trusted.org'
      
      expect(validateResolvedUrl('https://example.com/path', allowedDomains)).toBe('https://example.com/path')
      expect(validateResolvedUrl('https://trusted.org/path', allowedDomains)).toBe('https://trusted.org/path')
    })

    it('should throw DOMAIN_NOT_ALLOWED for non-allowed domains', () => {
      const allowedDomains = 'example.com'
      
      expect(() => validateResolvedUrl('https://evil.com/path', allowedDomains)).toThrow(RedirectError)
      expect(() => validateResolvedUrl('https://evil.com/path', allowedDomains)).toThrow('Domain not allowed: evil.com')

      try {
        validateResolvedUrl('https://evil.com/path', allowedDomains)
      } catch (error: any) {
        expect(error).toBeInstanceOf(RedirectError)
        expect(error.statusCode).toBe(403)
        expect(error.code).toBe('DOMAIN_NOT_ALLOWED')
      }
    })

    it('should allow subdomains of allowed domains', () => {
      const allowedDomains = 'example.com'
      
      expect(validateResolvedUrl('https://sub.example.com/path', allowedDomains)).toBe('https://sub.example.com/path')
      expect(validateResolvedUrl('https://api.sub.example.com/path', allowedDomains)).toBe('https://api.sub.example.com/path')
    })

    it('should allow all domains when no allowlist is configured', () => {
      expect(validateResolvedUrl('https://any-domain.com')).toBe('https://any-domain.com')
      expect(validateResolvedUrl('https://evil.com')).toBe('https://evil.com')
    })

    it('should validate complex URLs with query params and fragments', () => {
      const complexUrl = 'https://example.com/path?query=value&another=1#fragment';
      expect(validateResolvedUrl(complexUrl)).toBe(complexUrl);
    });

    it('should throw validation error for data URL based on redirectSchema', () => {
      expect(() => validateResolvedUrl('data:text/plain,hello')).toThrow(RedirectError);
    });

    it('should handle empty allowlist configuration', () => {
      expect(validateResolvedUrl('https://example.com', '')).toBe('https://example.com')
      expect(validateResolvedUrl('https://example.com', '   ')).toBe('https://example.com')
    })
  })
})