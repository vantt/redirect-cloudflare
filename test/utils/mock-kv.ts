/**
 * Mock KV Namespace for Testing
 *
 * Provides an in-memory implementation of Cloudflare Workers KVNamespace interface
 * for use in unit and integration tests.
 *
 * Part of Story 7.9: Test Infrastructure Fixes
 */

import type { KVNamespace } from '@cloudflare/workers-types'

/**
 * Creates a mock KVNamespace with in-memory storage
 *
 * @param initialData - Optional initial key-value pairs to populate the store
 * @returns Mock KVNamespace implementation
 *
 * @example
 * ```typescript
 * const mockKV = createMockKV({
 *   'shortcode123': 'https://example.com'
 * })
 *
 * await mockKV.get('shortcode123') // Returns 'https://example.com'
 * ```
 */
export function createMockKV(initialData: Record<string, string> = {}): KVNamespace {
  // In-memory storage for the mock KV
  const store: Map<string, string> = new Map(Object.entries(initialData))

  return {
    /**
     * Get a value from the KV store
     * @param key - The key to retrieve
     * @param options - Optional type specification (text, json, arrayBuffer, stream)
     * @returns Promise resolving to the value, or null if not found
     */
    async get(
      key: string,
      options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }
    ): Promise<any> {
      const value = store.get(key)

      if (value === undefined) {
        return null
      }

      // Handle different return types
      const type = options?.type || 'text'

      switch (type) {
        case 'json':
          try {
            return JSON.parse(value)
          } catch {
            return null
          }
        case 'text':
          return value
        case 'arrayBuffer':
          // Convert string to ArrayBuffer for testing
          const encoder = new TextEncoder()
          return encoder.encode(value).buffer
        case 'stream':
          // Return a mock ReadableStream for testing
          return new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(value))
              controller.close()
            }
          })
        default:
          return value
      }
    },

    /**
     * Put a value into the KV store
     * @param key - The key to set
     * @param value - The value to store (string, ReadableStream, or ArrayBuffer)
     * @returns Promise that resolves when complete
     */
    async put(key: string, value: string | ReadableStream | ArrayBuffer): Promise<void> {
      let stringValue: string

      if (typeof value === 'string') {
        stringValue = value
      } else if (value instanceof ArrayBuffer) {
        // Convert ArrayBuffer to string
        stringValue = new TextDecoder().decode(value)
      } else if (value instanceof ReadableStream) {
        // Read stream to string
        const reader = value.getReader()
        const chunks: Uint8Array[] = []
        let result = await reader.read()

        while (!result.done) {
          chunks.push(result.value)
          result = await reader.read()
        }

        // Combine chunks
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        const combined = new Uint8Array(totalLength)
        let offset = 0
        for (const chunk of chunks) {
          combined.set(chunk, offset)
          offset += chunk.length
        }

        stringValue = new TextDecoder().decode(combined)
      } else {
        throw new Error('Invalid value type for KV put')
      }

      store.set(key, stringValue)
    },

    /**
     * Delete a key from the KV store
     * @param key - The key to delete
     * @returns Promise that resolves when complete
     */
    async delete(key: string): Promise<void> {
      store.delete(key)
    },

    /**
     * List keys in the KV store
     * @param options - Optional filtering options (prefix, limit, cursor)
     * @returns Promise resolving to list result with keys and metadata
     */
    async list(options?: {
      prefix?: string
      limit?: number
      cursor?: string
    }): Promise<{
      keys: Array<{ name: string }>
      list_complete: boolean
      cursor?: string
    }> {
      const prefix = options?.prefix || ''
      const limit = options?.limit || 1000

      // Filter keys by prefix
      let keys = Array.from(store.keys())
        .filter(key => key.startsWith(prefix))
        .map(name => ({ name }))

      // Apply limit
      const list_complete = keys.length <= limit
      keys = keys.slice(0, limit)

      return {
        keys,
        list_complete,
        cursor: list_complete ? undefined : 'mock-cursor'
      }
    }
  } as KVNamespace
}

/**
 * Creates a mock KV with common redirect data for testing
 * @returns Mock KVNamespace pre-populated with test redirects
 */
export function createMockKVWithRedirects(): KVNamespace {
  return createMockKV({
    // Common test redirects
    'gh': JSON.stringify({
      url: 'https://github.com',
      type: 'permanent',
      created: '2025-01-01T00:00:00Z'
    }),
    'google': JSON.stringify({
      url: 'https://google.com',
      type: 'temporary',
      created: '2025-01-01T00:00:00Z'
    }),
    'example': JSON.stringify({
      url: 'https://example.com/page',
      type: 'permanent',
      created: '2025-01-01T00:00:00Z'
    })
  })
}
