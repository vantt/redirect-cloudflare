import { describe, it, expect, vi, beforeEach } from 'vitest'
import app from '../../src/index'
import { RedirectData } from '../../src/types/env'
import { getRedirect } from '../../src/lib/kv-store'

// Mock console.warn to test warning logging
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

// Mock KV namespace for testing
const createMockKV = () => {
  const data = new Map<string, RedirectData>()
  
  return {
    data,
    
    async get(key: string): Promise<RedirectData | null> {
      return data.get(key) || null
    },
    
    async put(key: string, value: string): Promise<void> {
      data.set(key, JSON.parse(value))
    },
    
    clear() {
      data.clear()
    }
  } as any
}

describe('Redirect Type Support (301 vs 302)', () => {
  let mockKV: any
  
  beforeEach(() => {
    mockKV = createMockKV()
    vi.clearAllMocks()
    consoleWarnSpy.mockClear()
  })

  it('should handle malformed KV data gracefully', async () => {
    // Test getRedirect with malformed data
    const mockKVWithMalformed = {
      async get(key: string): Promise<RedirectData | null> {
        if (key === 'malformed') {
          throw new Error('Invalid JSON')
        }
        return null
      }
    } as any

    const result = await getRedirect('malformed', mockKVWithMalformed)
    
    expect(result).toBeNull()
  })

  it('should validate redirect data structure', async () => {
    // Valid redirect data
    const validData: RedirectData = {
      url: 'https://example.com',
      type: 'permanent',
      created: '2025-10-25T00:00:00.000Z'
    }
    
    await mockKV.put('valid', JSON.stringify(validData))
    const result = await getRedirect('valid', mockKV)
    
    expect(result).toEqual(validData)
  })
})
