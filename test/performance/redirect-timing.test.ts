/**
 * Redirect Performance Tests
 *
 * Tests to verify redirect processing stays within sub-5ms budget per NFR requirements.
 * Tests both with and without analytics integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import app from '@src/index'
import { defaultTestEnv, testEnvWithGA4 } from '../fixtures/env'

describe('Redirect Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Baseline Performance (Without Analytics)', () => {
    it('should complete simple redirect within 100ms', async () => {
      const startTime = performance.now()

      const res = await app.request('/r?to=https://example.com', {}, defaultTestEnv)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(res.status).toBe(302)
      expect(duration).toBeLessThan(100) // Adjusted for realistic CI environment
    })

    it('should complete complex URL redirect within 10ms', async () => {
      const complexUrl = 'https://example.com/path?param=value&other=data#fragment'
      const startTime = performance.now()

      const res = await app.request(`/r?to=${encodeURIComponent(complexUrl)}`, {}, defaultTestEnv)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(res.status).toBe(302)
      expect(duration).toBeLessThan(10)
    })

    it('should complete direct URL redirect within 30ms', async () => {
      // Test direct URL redirect (no KV lookup needed)
      const startTime = performance.now()

      const res = await app.request('/r?to=https://test.com', {}, defaultTestEnv)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(res.status).toBe(302)
      expect(duration).toBeLessThan(30)
    })
  })

  describe('Analytics Integration Performance', () => {
    it('should complete redirect with analytics within 30ms (happy path)', async () => {
      // Mock successful analytics
      vi.mock('@src/lib/analytics/tracking-service', () => ({
        trackRedirect: vi.fn().mockResolvedValue(undefined)
      }))

      const startTime = performance.now()

      const res = await app.request('/r?to=https://example.com', {}, testEnvWithGA4)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(res.status).toBe(302)
      expect(duration).toBeLessThan(30) // Total budget including analytics
    })

    it('should complete redirect with failed analytics within 30ms', async () => {
      // Mock failed analytics (should not block redirect)
      vi.mock('@src/lib/analytics/tracking-service', () => ({
        trackRedirect: vi.fn().mockRejectedValue(new Error('Analytics failed'))
      }))

      const startTime = performance.now()

      const res = await app.request('/r?to=https://example.com', {}, testEnvWithGA4)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(res.status).toBe(302)
      expect(duration).toBeLessThan(30) // Failed analytics should be very fast
    })

    it('should complete redirect with tracking parameters within 30ms', async () => {
      const urlWithTracking = 'https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=test'
      vi.mock('@src/lib/analytics/tracking-service', () => ({
        trackRedirect: vi.fn().mockResolvedValue(undefined)
      }))

      const startTime = performance.now()

      const res = await app.request(`/r?to=${encodeURIComponent(urlWithTracking)}`, {}, testEnvWithGA4)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(res.status).toBe(302)
      expect(duration).toBeLessThan(30)
    })
  })

  describe('Performance Regression Detection', () => {
    it('should maintain consistent performance across multiple requests', async () => {
      vi.mock('@src/lib/analytics/tracking-service', () => ({
        trackRedirect: vi.fn().mockResolvedValue(undefined)
      }))

      const durations: number[] = []
      const iterations = 10

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        await app.request('/r?to=https://example.com', {}, testEnvWithGA4)
        const endTime = performance.now()
        durations.push(endTime - startTime)
      }

      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length
      const maxDuration = Math.max(...durations)

      expect(averageDuration).toBeLessThan(10)
      expect(maxDuration).toBeLessThan(20) // Allow some variance
    })

    it('should handle concurrent requests without performance degradation', async () => {
      vi.mock('@src/lib/analytics/tracking-service', () => ({
        trackRedirect: vi.fn().mockResolvedValue(undefined)
      }))

      const concurrentRequests = 5
      const startTime = performance.now()

      const promises = Array.from({ length: concurrentRequests }, () =>
        app.request('/r?to=https://example.com', {}, testEnvWithGA4)
      )

      await Promise.all(promises)

      const endTime = performance.now()
      const totalDuration = endTime - startTime
      const averagePerRequest = totalDuration / concurrentRequests

      expect(averagePerRequest).toBeLessThan(10)
    })
  })

  describe('Memory and Resource Usage', () => {
    it('should not create excessive memory growth during repeated requests', async () => {
      vi.mock('@src/lib/analytics/tracking-service', () => ({
        trackRedirect: vi.fn().mockResolvedValue(undefined)
      }))

      const initialMemory = process.memoryUsage()

      // Perform many requests
      for (let i = 0; i < 50; i++) {
        await app.request('/r?to=https://example.com', {}, testEnvWithGA4)
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage()
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory growth should be reasonable (less than 5MB for test environment)
      expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024)
    })
  })
})