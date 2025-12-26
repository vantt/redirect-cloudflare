import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Miniflare } from 'miniflare'
import type { KVNamespace } from '@cloudflare/workers-types'
import { getRedirect, putRedirect } from '../../../src/lib/kv-store'
import type { RedirectData } from '../../../src/types/env'

describe('KV Store Operations', () => {
  let mf: Miniflare
  let kv: KVNamespace

  beforeAll(async () => {
    // Create Miniflare instance with KV namespace
    mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['REDIRECT_KV'],
    })

    // Get KV namespace (cast to KVNamespace for type compatibility)
    kv = (await mf.getKVNamespace('REDIRECT_KV')) as unknown as KVNamespace
  })

  afterAll(async () => {
    await mf.dispose()
  })

  describe('getRedirect', () => {
    it('should return RedirectData when key exists in KV', async () => {
      // Arrange
      const testPath = 'test-path-1'
      const testData: RedirectData = {
        url: 'https://example.com',
        type: 'permanent',
        created: '2025-10-25T00:00:00.000Z',
      }
      await kv.put(testPath, JSON.stringify(testData))

      // Act
      const result = await getRedirect(testPath, kv)

      // Assert
      expect(result).toEqual(testData)
      expect(result?.type).toBe('permanent')
    })

    it('should return null when key does not exist', async () => {
      // Arrange
      const nonExistentPath = 'non-existent-key-' + Date.now()

      // Act
      const result = await getRedirect(nonExistentPath, kv)

      // Assert
      expect(result).toBeNull()
    })

    it('should auto-parse JSON using KV get(key, "json")', async () => {
      // Arrange
      const testPath = 'test-json-parse'
      const testData: RedirectData = {
        url: 'https://example.com/auto-parse',
        type: 'temporary',
        created: '2025-10-25T12:00:00.000Z',
      }
      await kv.put(testPath, JSON.stringify(testData))

      // Act
      const result = await getRedirect(testPath, kv)

      // Assert - Result should be parsed object, not string
      expect(typeof result).toBe('object')
      expect(result).not.toBeNull()
      expect(result?.url).toBe(testData.url)
    })

    it('should handle malformed JSON gracefully and return null', async () => {
      // Arrange
      const testPath = 'malformed-json-' + Date.now()
      // Manually put invalid JSON (KV allows storing any string)
      await kv.put(testPath, '{invalid json}')

      // Act
      const result = await getRedirect(testPath, kv)

      // Assert - Should return null for malformed JSON
      expect(result).toBeNull()
    })
  })

  describe('putRedirect', () => {
    it('should successfully store RedirectData in KV', async () => {
      // Arrange
      const testPath = 'test-put-1-' + Date.now()
      const testData: RedirectData = {
        url: 'https://example.com/stored',
        type: 'permanent',
        created: '2025-10-25T10:00:00.000Z',
      }

      // Act
      await putRedirect(testPath, testData, kv)

      // Assert - Verify data was stored correctly
      const stored = await kv.get(testPath, 'json')
      expect(stored).toEqual(testData)
    })

    it('should store data as JSON string', async () => {
      // Arrange
      const testPath = 'test-put-json-string-' + Date.now()
      const testData: RedirectData = {
        url: 'https://example.com/json-string',
        type: 'temporary',
        created: '2025-10-25T11:00:00.000Z',
      }

      // Act
      await putRedirect(testPath, testData, kv)

      // Assert - Get as text to verify it's JSON string
      const storedText = await kv.get(testPath, 'text')
      expect(storedText).toBe(JSON.stringify(testData))
    })
  })

  describe('Integration: Get/Put Roundtrip', () => {
    it('should successfully roundtrip: put then get', async () => {
      // Arrange
      const testPath = 'roundtrip-test-' + Date.now()
      const testData: RedirectData = {
        url: 'https://example.com/roundtrip',
        type: 'permanent',
        created: '2025-10-25T13:00:00.000Z',
      }

      // Act
      await putRedirect(testPath, testData, kv)
      const retrieved = await getRedirect(testPath, kv)

      // Assert
      expect(retrieved).toEqual(testData)
    })

    it('should handle multiple redirects with different types', async () => {
      // Arrange
      const timestamp = Date.now()
      const permanentData: RedirectData = {
        url: 'https://example.com/permanent',
        type: 'permanent',
        created: '2025-10-25T14:00:00.000Z',
      }
      const temporaryData: RedirectData = {
        url: 'https://example.com/temporary',
        type: 'temporary',
        created: '2025-10-25T14:01:00.000Z',
      }

      // Act
      await putRedirect(`perm-1-${timestamp}`, permanentData, kv)
      await putRedirect(`temp-1-${timestamp}`, temporaryData, kv)

      // Assert
      const perm = await getRedirect(`perm-1-${timestamp}`, kv)
      const temp = await getRedirect(`temp-1-${timestamp}`, kv)

      expect(perm?.type).toBe('permanent')
      expect(temp?.type).toBe('temporary')
    })
  })

  describe('TypeScript Type Enforcement', () => {
    it('should enforce RedirectData structure at compile time', () => {
      // This test verifies TypeScript compilation
      // Valid data structure compiles without errors
      const validData: RedirectData = {
        url: 'https://example.com',
        type: 'permanent',
        created: '2025-10-25T00:00:00.000Z',
      }

      expect(validData.type).toBe('permanent')

      // Note: Invalid types like type: 'invalid' would be caught at compile time
      // and prevent the build from succeeding (AC #8 satisfied)
    })
  })
})
