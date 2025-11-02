/**
 * GA4 Measurement Protocol HTTP Client
 *
 * Handles HTTP requests to Google Analytics 4 Measurement Protocol v2 endpoint
 * with proper timeout, error handling, and structured logging.
 *
 * Part of Epic 8: Google Analytics 4 Integration
 */

import { GA4Payload, GA4Config } from './types'
import { appLogger } from '../../../utils/logger'

/**
 * GA4 HTTP Client for Measurement Protocol v2
 *
 * Provides HTTP integration with proper timeout, error handling,
 * and structured logging for GA4 event delivery.
 */
export class GA4HttpClient {
  private readonly GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect'
  private readonly DEFAULT_TIMEOUT = 2000 // 2 seconds per ADR-003

  constructor(private config: GA4Config) {
    // Validate configuration on initialization
    this.validateConfig()
  }

  /**
   * Sends GA4 payload to Measurement Protocol endpoint
   *
   * @param payload - GA4 Measurement Protocol payload
   * @returns Promise that resolves when request completes (never throws)
   */
  async sendRequest(payload: GA4Payload): Promise<void> {
    const startTime = Date.now()

    try {
      // Validate payload
      if (!payload || !payload.client_id || !payload.events || payload.events.length === 0) {
        throw new Error('Invalid GA4 payload: missing required fields')
      }

      // Build request URL with query parameters
      const url = this.buildRequestUrl()

      // Build request options
      const requestOptions = this.buildRequestOptions(payload)

      // Send HTTP request
      const response = await fetch(url, requestOptions)
      const latency = Date.now() - startTime

      // Check response status
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Log successful delivery
      appLogger.info('GA4 event sent successfully', {
        eventName: payload.events[0]?.name || 'unknown',
        eventCount: payload.events.length,
        clientId: payload.client_id,
        latencyMs: latency,
        payloadSize: JSON.stringify(payload).length,
        measurementId: this.config.measurementId
      })

    } catch (error) {
      const latency = Date.now() - startTime

      // Extract error details for logging
      const errorDetails = this.extractErrorDetails(error)

      // Log structured error without throwing
      appLogger.error('GA4 event delivery failed', {
        eventName: payload.events[0]?.name || 'unknown',
        errorType: errorDetails.type,
        errorMessage: errorDetails.message,
        latencyMs: latency,
        timeoutMs: this.config.timeout || this.DEFAULT_TIMEOUT,
        measurementId: this.config.measurementId,
        // Include additional context for debugging
        ...(errorDetails.type === 'TimeoutError' && { timeout: true }),
        ...(errorDetails.type === 'NetworkError' && { network: true }),
        ...(errorDetails.type === 'HTTPError' && { httpFailure: true }),
        ...(errorDetails.type === 'ValidationError' && { validation: true })
      })

      // Error isolation: never throw to maintain provider isolation
    }
  }

  /**
   * Builds the GA4 Measurement Protocol request URL
   *
   * @returns Complete URL with query parameters
   */
  private buildRequestUrl(): string {
    const { measurementId, apiSecret } = this.config

    if (!measurementId || !apiSecret) {
      throw new Error('Missing required GA4 configuration: measurementId and apiSecret are required')
    }

    const queryParams = new URLSearchParams({
      measurement_id: measurementId,
      api_secret: apiSecret
    })

    return `${this.GA4_ENDPOINT}?${queryParams.toString()}`
  }

  /**
   * Builds HTTP request options for GA4 Measurement Protocol
   *
   * @param payload - GA4 payload to send
   * @returns RequestInit object with headers, body, and timeout
   */
  private buildRequestOptions(payload: GA4Payload): RequestInit {
    const timeout = this.config.timeout || this.DEFAULT_TIMEOUT

    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // GA4 doesn't require additional headers
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeout)
    }
  }

  /**
   * Validates GA4 configuration
   * Throws if critical configuration is missing
   */
  private validateConfig(): void {
    const { measurementId, apiSecret } = this.config

    if (!measurementId) {
      appLogger.error('GA4 HTTP client: measurement ID is required', {
        config: { measurementId: !!measurementId, apiSecret: !!apiSecret }
      })
      throw new Error('GA4 measurement ID is required')
    }

    if (!apiSecret) {
      appLogger.error('GA4 HTTP client: API secret is required', {
        config: { measurementId: !!measurementId, apiSecret: !!apiSecret }
      })
      throw new Error('GA4 API secret is required')
    }

    // Validate measurement ID format (should start with 'G-')
    if (!measurementId.startsWith('G-') || measurementId.length < 3) {
      appLogger.warn('GA4 measurement ID may be invalid', {
        measurementId,
        expectedFormat: 'G-XXXXXXXXXX'
      })
    }

    // Log successful initialization
    appLogger.info('GA4 HTTP client initialized', {
      measurementId,
      timeout: this.config.timeout || this.DEFAULT_TIMEOUT,
      endpoint: this.GA4_ENDPOINT
    })
  }

  /**
   * Extracts structured error details from error objects
   *
   * @param error - Error object from catch block
   * @returns Structured error details
   */
  private extractErrorDetails(error: unknown): {
    type: string
    message: string
    details?: Record<string, any>
  } {
    if (error instanceof Error) {
      // Determine error type based on error name and message
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        return {
          type: 'TimeoutError',
          message: error.message,
          details: { timeoutMs: this.config.timeout || this.DEFAULT_TIMEOUT }
        }
      }

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          type: 'NetworkError',
          message: error.message,
          details: { networkFailure: true }
        }
      }

      if (error.message.includes('HTTP')) {
        return {
          type: 'HTTPError',
          message: error.message,
          details: { httpFailure: true }
        }
      }

      if (error.message.includes('Invalid GA4 payload')) {
        return {
          type: 'ValidationError',
          message: error.message,
          details: { validationFailure: true }
        }
      }

      // Default error handling
      return {
        type: 'UnknownError',
        message: error.message,
        details: { errorName: error.name }
      }
    }

    // Handle non-Error objects
    return {
      type: 'UnknownError',
      message: String(error),
      details: { nonStandardError: true }
    }
  }

  /**
   * Gets current configuration (for debugging)
   *
   * @returns Configuration object with sensitive data masked
   */
  getConfig(): Partial<GA4Config> {
    return {
      measurementId: this.config.measurementId,
      apiSecret: this.config.apiSecret ? '***' : undefined,
      timeout: this.config.timeout || this.DEFAULT_TIMEOUT
    }
  }
}