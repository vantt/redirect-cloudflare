/**
 * Analytics Testing Framework
 * Mock GA4 Measurement Protocol for testing
 */

import { vi, expect } from 'vitest'

export interface MockGA4Event {
  name: string
  params: Record<string, string | number | boolean>
  user_id?: string
  timestamp: string
}

export interface MockAnalyticsKV {
  events: MockGA4Event[]
  tracking_data: Record<string, any>
}

export class MockAnalyticsAPI {
  private events: MockGA4Event[] = []
  private errors: Error[] = []

  async sendEvent(event: MockGA4Event): Promise<boolean> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 10))
    
    // Simulate success/failure based on event size
    if (JSON.stringify(event).length > 5000) {
      this.errors.push(new Error('Event too large'))
      return false
    }
    
    this.events.push(event)
    return true
  }

  getEvents(): MockGA4Event[] {
    return [...this.events]
  }

  getErrors(): Error[] {
    return [...this.errors]
  }

  clear(): void {
    this.events = []
    this.errors = []
  }

  // Mock specific GA4 measurement scenarios
  mockSuccessfulRedirect(): MockGA4Event {
    return {
      name: 'redirect_executed',
      params: {
        redirect_id: 'test-redirect',
        destination_url: 'https://example.com',
        redirect_type: 'temporary',
        success: true
      },
      timestamp: new Date().toISOString()
    }
  }

  mockFailedRedirect(): MockGA4Event {
    return {
      name: 'redirect_failed',
      params: {
        redirect_id: 'test-redirect',
        error_message: 'Analytics service unavailable',
        success: false
      },
      timestamp: new Date().toISOString()
    }
  }
}

// Global mock instance
export const mockAnalytics = new MockAnalyticsAPI()

// Vitest setup for analytics testing
export function setupAnalyticsMocks() {
  const mockFetch = vi.fn().mockImplementation(async (url: string) => {
    if (url.includes('google-analytics.com')) {
      return new Response(JSON.stringify({ hits: 1 }), { status: 200 })
    }
    return new Response('Not found', { status: 404 })
  })
  
  vi.stubGlobal('fetch', mockFetch)
}

export function cleanupAnalyticsMocks() {
  vi.restoreAllMocks()
}