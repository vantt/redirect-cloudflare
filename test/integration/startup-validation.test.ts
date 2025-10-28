import { describe, it, expect } from 'vitest'
import { unstable_dev } from 'wrangler'

describe('Startup Validation Integration Tests', () => {
  describe('Invalid Configuration', () => {
    it('should fail gracefully when GA4_MEASUREMENT_ID is missing with ga4 provider', async () => {
      const worker = await unstable_dev('src/index.ts', {
        experimental: { disableExperimentalWarning: true },
        vars: {
          ANALYTICS_PROVIDERS: 'ga4',
          GA4_API_SECRET: 'test-secret'
          // Missing GA4_MEASUREMENT_ID
        }
      })

      try {
        const resp = await worker.fetch('https://test.example.com/r?to=https://example.com')

        expect(resp.status).toBe(500)

        const body = await resp.json() as { error: string; code: string }
        expect(body.error).toContain('GA4_MEASUREMENT_ID is required')
        expect(body.code).toBe('CONFIG_VALIDATION_ERROR')
      } finally {
        await worker.stop()
      }
    })

    it('should fail gracefully when GA4_API_SECRET is missing with ga4 provider', async () => {
      const worker = await unstable_dev('src/index.ts', {
        experimental: { disableExperimentalWarning: true },
        vars: {
          ANALYTICS_PROVIDERS: 'ga4',
          GA4_MEASUREMENT_ID: 'G-TEST123'
          // Missing GA4_API_SECRET
        }
      })

      try {
        const resp = await worker.fetch('https://test.example.com/r?to=https://example.com')

        expect(resp.status).toBe(500)

        const body = await resp.json() as { error: string; code: string }
        expect(body.error).toContain('GA4_API_SECRET is required')
        expect(body.code).toBe('CONFIG_VALIDATION_ERROR')
      } finally {
        await worker.stop()
      }
    })

    it('should fail gracefully with invalid ALLOWED_DOMAINS format', async () => {
      const worker = await unstable_dev('src/index.ts', {
        experimental: { disableExperimentalWarning: true },
        vars: {
          ALLOWED_DOMAINS: 'example.com,,invalid' // Empty domain in list
        }
      })

      try {
        const resp = await worker.fetch('https://test.example.com/r?to=https://example.com')

        expect(resp.status).toBe(500)

        const body = await resp.json() as { error: string; code: string }
        expect(body.error).toContain('ALLOWED_DOMAINS')
        expect(body.code).toBe('CONFIG_VALIDATION_ERROR')
      } finally {
        await worker.stop()
      }
    })

    it('should fail gracefully with invalid ANALYTICS_TIMEOUT_MS', async () => {
      const worker = await unstable_dev('src/index.ts', {
        experimental: { disableExperimentalWarning: true },
        vars: {
          ANALYTICS_TIMEOUT_MS: 'not-a-number'
        }
      })

      try {
        const resp = await worker.fetch('https://test.example.com/r?to=https://example.com')

        expect(resp.status).toBe(500)

        const body = await resp.json() as { error: string; code: string }
        expect(body.error).toContain('ANALYTICS_TIMEOUT_MS must be a valid number')
        expect(body.code).toBe('CONFIG_VALIDATION_ERROR')
      } finally {
        await worker.stop()
      }
    })

    it('should provide descriptive error messages for configuration failures', async () => {
      const worker = await unstable_dev('src/index.ts', {
        experimental: { disableExperimentalWarning: true },
        vars: {
          ANALYTICS_PROVIDERS: 'ga4'
          // Missing both GA4 credentials
        }
      })

      try {
        const resp = await worker.fetch('https://test.example.com/r?to=https://example.com')

        expect(resp.status).toBe(500)

        const body = await resp.json() as { error: string; code: string }

        // Error message should be descriptive and indicate which variable is missing
        expect(body.error).toBeTruthy()
        expect(body.error.length).toBeGreaterThan(20) // Should have descriptive message
        expect(body.error).toMatch(/GA4_MEASUREMENT_ID|GA4_API_SECRET/)
        expect(body.code).toBe('CONFIG_VALIDATION_ERROR')
      } finally {
        await worker.stop()
      }
    })
  })

  describe('Valid Configuration', () => {
    it('should start successfully with minimal valid configuration', async () => {
      const worker = await unstable_dev('src/index.ts', {
        experimental: { disableExperimentalWarning: true },
        vars: {
          // All env vars are optional by default
        }
      })

      try {
        // App should start and process requests normally
        // Testing with a simple request to verify app is running
        const resp = await worker.fetch('https://test.example.com/')

        // Should not return 500 config error
        expect(resp.status).not.toBe(500)

        // If it's a 404 or other error, it should not be a config error
        if (resp.status >= 400) {
          const body = await resp.json() as { error: string; code: string }
          expect(body.code).not.toBe('CONFIG_VALIDATION_ERROR')
        }
      } finally {
        await worker.stop()
      }
    })

    it('should start successfully with complete GA4 configuration', async () => {
      const worker = await unstable_dev('src/index.ts', {
        experimental: { disableExperimentalWarning: true },
        vars: {
          ANALYTICS_PROVIDERS: 'ga4',
          GA4_MEASUREMENT_ID: 'G-TEST123',
          GA4_API_SECRET: 'test-secret',
          ANALYTICS_TIMEOUT_MS: '3000',
          ALLOWED_DOMAINS: 'example.com,trusted.org',
          ENABLE_TRACKING: 'true'
        }
      })

      try {
        // App should start and process requests normally
        const resp = await worker.fetch('https://test.example.com/')

        // Should not return 500 config error
        expect(resp.status).not.toBe(500)

        if (resp.status >= 400) {
          const body = await resp.json() as { error: string; code: string }
          expect(body.code).not.toBe('CONFIG_VALIDATION_ERROR')
        }
      } finally {
        await worker.stop()
      }
    })

    it('should start successfully with valid numeric ANALYTICS_TIMEOUT_MS', async () => {
      const worker = await unstable_dev('src/index.ts', {
        experimental: { disableExperimentalWarning: true },
        vars: {
          ANALYTICS_TIMEOUT_MS: '5000' // Valid positive number
        }
      })

      try {
        const resp = await worker.fetch('https://test.example.com/')

        expect(resp.status).not.toBe(500)

        if (resp.status >= 400) {
          const body = await resp.json() as { error: string; code: string }
          expect(body.code).not.toBe('CONFIG_VALIDATION_ERROR')
        }
      } finally {
        await worker.stop()
      }
    })
  })
})
