/**
 * Vitest Global Setup
 * Common test setup and global test utilities
 */
import { beforeAll, beforeEach, afterEach, vi } from 'vitest'

// Global test setup
beforeAll(() => {
  console.log('Test suite starting...')
})

beforeEach(() => {
  // Reset mocks between tests
  vi.clearAllMocks()
})

// Reset mocks after tests
afterEach(() => {
  vi.restoreAllMocks()
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