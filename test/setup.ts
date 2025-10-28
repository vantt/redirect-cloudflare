/**
 * Vitest Global Setup
 * Common test setup and global test utilities
 */
import { beforeAll, beforeEach, afterEach, vi } from 'vitest'

// Global test setup
beforeAll(function() {
  console.log('Test suite starting...')
})

beforeEach(function() {
  // Reset mocks between tests
  vi.clearAllMocks()
})

// Reset mocks after tests
afterEach(function() {
  vi.restoreAllMocks()
})

// Export global utilities for test files
export function setupTestEnvironment() {
  vi.spyOn(console, 'warn').mockImplementation(function() {})
  vi.spyOn(console, 'error').mockImplementation(function() {})
  vi.spyOn(console, 'log').mockImplementation(function() {})
}

export function cleanupTestEnvironment() {
  vi.restoreAllMocks()
}

// Type declarations for global test utilities
declare global {
  var setupTestEnvironment: () => void
  var cleanupTestEnvironment: () => void
}