/**
 * Vitest Global Setup
 * Common test setup and global test utilities
 */

import { beforeAll, beforeEach, afterAll, vi } from 'vitest'

// Global test setup
beforeAll(() => {
  // Set up global fetch mock
  vi.stubGlobal('fetch', vi.fn())
})

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})

// Cleanup after all tests
afterAll(() => {
  vi.unstubAllGlobals()
})

// Export global utilities for test files
export function setupTestEnvironment() {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
}

export function cleanupTestEnvironment() {
  vi.restoreAllMocks()
}

// Type declarations for global test utilities
declare global {
  var setupTestEnvironment: () => void
  var cleanupTestEnvironment: () => void
}