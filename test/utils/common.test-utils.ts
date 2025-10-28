// Common test patterns and utilities
import { vi, expect } from 'vitest'

// Common mock data
export const TEST_REDIRECT_DATA = {
  permanent: {
    url: 'https://permanent-example.com',
    type: 'permanent' as const,
    created: '2025-10-25T00:00:00.000Z'
  },
  temporary: {
    url: 'https://temporary-example.com',
    type: 'temporary' as const,
    created: '2025-10-25T00:00:00.000Z'
  }
}

export const TEST_ANALYTICS_EVENT = {
  name: 'redirect_executed',
  params: {
    redirect_id: 'test-redirect-id',
    destination_url: 'https://example.com',
    redirect_type: 'temporary'
  },
  timestamp: '2025-10-25T00:00:00.000Z'
}

// Mock KV namespace factory
export function createMockKV<T = any>() {
  const data = new Map<string, T>()
  
  return {
    data,
    
    async get(key: string): Promise<T | null> {
      return data.get(key) || null
    },
    
    async put(key: string, value: string): Promise<void> {
      try {
        data.set(key, JSON.parse(value))
      } catch {
        data.set(key, value as any)
      }
    },
    
    async delete(key: string): Promise<boolean> {
      return data.delete(key)
    },
    
    clear() {
      data.clear()
    },
    
    async list(): Promise<string[]> {
      return Array.from(data.keys())
    }
  } as any
}

// Common test setup and teardown
export function setupTestEnvironment() {
  vi.clearAllMocks()
  
  // Mock console methods
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
}

export function cleanupTestEnvironment() {
  vi.restoreAllMocks()
}

// Common assertions
export function expectRedirectResponse(response: Response, expectedStatus: number, expectedLocation: string) {
  expect(response.status).toBe(expectedStatus)
  expect(response.headers.get('Location')).toBe(expectedLocation)
  expect(response.body).toBeNull()
}

export function expectErrorResponse(response: Response, expectedStatus: number, expectedError: string) {
  expect(response.status).toBe(expectedStatus)
  expect(response.headers.get('Content-Type')).toBe('application/json')
  
  const body = response.json() as any
  expect(body).toHaveProperty('error')
  expect(body.error).toBe(expectedError)
}

// Common test patterns
export async function testEndpointWithMethod(
  app: any,
  method: string,
  path: string,
  data?: any,
  headers?: Record<string, string>
) {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }
  
  if (data) {
    requestInit.body = JSON.stringify(data)
  }
  
  return await app.request(path, requestInit)
}

export function createMockEnv(kvNamespace?: any) {
  return {
    REDIRECT_KV: kvNamespace || createMockKV(),
    ANALYTICS_KV: kvNamespace || createMockKV()
  }
}