# Developer Guide: Adding Analytics Providers

This guide explains how to add new analytics providers to the system built in Epic 7.

## Prerequisites

Before adding a new provider, ensure you have:
- Understanding of the `AnalyticsProvider` interface from `src/lib/analytics/provider.ts`
- Familiarity with the router system from `src/lib/analytics/router.ts`
- Access to update environment configuration if needed

## Quick Start

```typescript
// 1. Create provider class in src/lib/analytics/providers/[provider-name].ts
import { AnalyticsProvider } from '../provider'
import { AnalyticsEvent } from '../types'

export class YourProvider implements AnalyticsProvider {
  // Constructor for any configuration
  constructor(config?: { apiKey?: string; endpoint?: string }) {
    // Store configuration for later use
  }

  // Implement the required send method
  async send(event: AnalyticsEvent): Promise<void> {
    // Your provider implementation here
    // Extract data from neutral event and send to your analytics service
  }
}
```

## Step-by-Step Implementation

### 1. Create Provider Class

Create a new file at `src/lib/analytics/providers/[provider-name].ts`:

```typescript
import { AnalyticsProvider } from '../provider'
import { AnalyticsEvent } from '../types'

/**
 * [Provider Name] Analytics Provider
 * 
 * Sends analytics events to [Provider Service].
 * Maps neutral AnalyticsEvent to provider-specific payload format.
 */
export class [ProviderName]Provider implements AnalyticsProvider {
  private config: {
    apiKey?: string
    endpoint?: string
  }

  constructor(config?: { apiKey?: string; endpoint?: string }) {
    this.config = config || {}
  }

  async send(event: AnalyticsEvent): Promise<void> {
    try {
      // Extract relevant data from neutral event
      const { name: eventName, attributes } = event
      
      // Map to provider-specific payload
      const payload = this.mapToProviderPayload(eventName, attributes)
      
      // Send to provider API
      await this.sendToProvider(payload)
      
    } catch (error) {
      // Handle errors appropriately
      console.error(`[${this.constructor.name}] Failed to send event:`, error)
      throw error // Re-throw to let router handle the error
    }
  }

  private mapToProviderPayload(eventName: string, attributes: Record<string, string | number | boolean>): any {
    // Implement provider-specific mapping logic here
    const payload = {
      // Provider-specific fields
      // Map neutral attributes to provider format
    }
    
    return payload
  }

  private async sendToProvider(payload: any): Promise<void> {
    // Implement HTTP request to provider API
    // Use fetch() with proper headers and error handling
    const response = await fetch(this.config.endpoint || 'https://api.provider.com/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Provider API error: ${response.status} ${response.statusText}`)
    }

    // Handle success response if needed
    const data = await response.json()
  }
}
```

### 2. Register Provider in Environment

Update your environment configuration to include the new provider:

```bash
# In your wrangler.toml or environment variables:
ANALYTICS_PROVIDERS=ga4,mixpanel,[new-provider]

# Provider-specific configuration:
[NEW_PROVIDER]_API_KEY=your_api_key
[NEW_PROVIDER]_ENDPOINT=https://api.new-provider.com
```

### 3. Add Provider to Factory Registry

Update the provider factory registry in `src/lib/analytics/registry.ts`:

```typescript
// Add to PROVIDER_FACTORIES object:
const PROVIDER_FACTORIES: ProviderFactories = {
  // ... existing providers
  '[new-provider]': (env: Env) => {
    const config = {
      apiKey: env.NEW_PROVIDER_API_KEY || '',
      endpoint: env.NEW_PROVIDER_ENDPOINT || ''
    }
    return new [NewProvider]Provider(config)
  },
  
  // ... rest of providers
}
```

### 4. Test Your Provider

Create comprehensive tests for your provider:

```typescript
// In test/lib/analytics/providers/[provider-name].test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnalyticsEvent, EventName } from '../../../src/lib/analytics/types'
import { create[ProviderName]Provider } from '../provider-mocks'

describe('[Provider Name] Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should implement AnalyticsProvider interface', () => {
    const provider = create[ProviderName]Provider()
    expect(typeof provider.send).toBe('function')
  })

  it('should send events correctly', async () => {
    const provider = create[ProviderName]Provider({ apiKey: 'test-key' })
    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    })

    const event: AnalyticsEvent = {
      name: EventName.REDIRECT_CLICK,
      attributes: { utm_source: 'test' }
    }

    await provider.send(event)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key'
        })
      })
    )
  })

  it('should handle API errors', async () => {
    const provider = create[ProviderName]Provider({ apiKey: 'invalid-key' })
    const mockFetch = vi.spyOn(global, 'fetch').mockRejectedValue(
      new Error('API request failed')
    )

    const event: AnalyticsEvent = {
      name: EventName.REDIRECT_CLICK,
      attributes: { utm_source: 'test' }
    }

    await expect(provider.send(event)).rejects.toThrow('Provider API error')
  })
})
```

## Environment Configuration Options

### Option A: Environment Variables (Recommended)
```bash
# Add to wrangler.toml:
[vars]
NEW_PROVIDER_API_KEY = "your_api_key_here"
NEW_PROVIDER_ENDPOINT = "https://api.new-provider.com"

# Or set in Cloudflare dashboard:
ANALYTICS_PROVIDERS = "ga4,mixpanel,new-provider"
```

### Option B: Secrets Management
```bash
# Using Cloudflare secrets (more secure):
wrangler secret put NEW_PROVIDER_API_KEY "your_api_key_here"
wrangler secret put NEW_PROVIDER_ENDPOINT "https://api.new-provider.com"

# Reference in code:
const config = {
  apiKey: env.NEW_PROVIDER_API_KEY,
  endpoint: env.NEW_PROVIDER_ENDPOINT
}
```

## Provider Implementation Patterns

### Pattern A: HTTP API Provider
```typescript
export class HttpApiProvider implements AnalyticsProvider {
  private async sendRequest(endpoint: string, payload: any): Promise<void> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }
}
```

### Pattern B: SDK-Based Provider
```typescript
export class SdkProvider implements AnalyticsProvider {
  private client: any // Provider SDK client

  constructor(config: { credentials: any }) {
    this.client = new ProviderClient(config.credentials)
  }

  async send(event: AnalyticsEvent): Promise<void> {
    try {
      // Map to SDK format
      const sdkEvent = this.mapToSdkEvent(event)
      
      // Send via SDK
      await this.client.track(sdkEvent)
      
    } catch (error) {
      console.error(`[${this.constructor.name}] SDK error:`, error)
      throw error
    }
  }
}
```

### Pattern C: Batch Provider
```typescript
export class BatchProvider implements AnalyticsProvider {
  private buffer: AnalyticsEvent[] = []
  private flushInterval: number
  private config: { batchSize: number; flushMs: number }

  constructor(config: { batchSize: number = 10; flushMs: number = 5000 }) {
    this.config = config
  }

  async send(event: AnalyticsEvent): Promise<void> {
    this.buffer.push(event)
    
    if (this.buffer.length >= this.config.batchSize) {
      await this.flush()
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return
    
    await this.sendBatch(this.buffer)
    this.buffer = []
  }
}
```

## Error Handling Best Practices

```typescript
async send(event: AnalyticsEvent): Promise<void> {
  try {
    // Attempt to send event
    await this.sendEvent(event)
    
  } catch (error) {
    // Log error for debugging
    console.error(`[${this.constructor.name}] Send failed:`, {
      eventName: event.name,
      error: error.message,
      timestamp: new Date().toISOString()
    })
    
    // Re-throw to let router handle
    throw error
  }
}
```

## Testing Your Provider

### Mock HTTP Requests
```typescript
// In your test file:
import { vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

// Mock specific responses
global.fetch.mockResolvedValueOnce({
  ok: true,
  json: () => ({ success: true })
})
```

### Test Data Scenarios
```typescript
const testCases = [
  {
    name: 'success with all attributes',
    event: {
      name: EventName.REDIRECT_CLICK,
      attributes: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'test',
        custom_field: 'value'
      }
    }
  },
  {
    name: 'partial attributes',
    event: {
      name: EventName.REDIRECT_CLICK,
      attributes: { utm_source: 'facebook' }
    }
  },
  {
    name: 'empty attributes',
    event: {
      name: EventName.REDIRECT_CLICK,
      attributes: {}
    }
  }
]
```

## Performance Considerations

### Request Batching
```typescript
// For high-volume providers
class OptimizedProvider implements AnalyticsProvider {
  private batchQueue: Promise<void>[] = []
  
  async send(event: AnalyticsEvent): Promise<void> {
    // Add to batch queue
    const requestPromise = this.addToBatch(event)
    this.batchQueue.push(requestPromise)
    
    // Don't await individual requests
  }
  
  private async flushBatch(): Promise<void> {
    const requests = this.batchQueue.splice(0)
    await Promise.allSettled(requests)
  }
}
```

### Connection Reuse
```typescript
class ConnectionPoolProvider implements AnalyticsProvider {
  private connections: any[] = []
  private maxConnections: number = 5

  async send(event: AnalyticsEvent): Promise<void> {
    const connection = await this.getConnection()
    // Use connection for request
    await this.sendWithConnection(connection, event)
    this.releaseConnection(connection)
  }
}
```

## Deployment Considerations

### Environment-Specific Configuration
```typescript
// Different configs per environment
const config = {
  development: {
    endpoint: 'https://dev-api.provider.com',
    timeout: 10000
  },
  production: {
    endpoint: 'https://api.provider.com',
    timeout: 2000
  }
}

const providerConfig = config[env.NODE_ENV || 'development']
```

### Feature Flags
```typescript
// Enable/disable provider based on environment
const PROVIDER_ENABLED = process.env.PROVIDER_ENABLED === 'true'

export class ConditionalProvider implements AnalyticsProvider {
  async send(event: AnalyticsEvent): Promise<void> {
    if (!PROVIDER_ENABLED) {
      return // Skip silently
    }
    
    await this.actuallySend(event)
  }
}
```

## Common Pitfalls to Avoid

❌ **Don't block the event loop**
```typescript
// Bad - This blocks the router
async send(event: AnalyticsEvent): Promise<void> {
  const result = await this.http.post(event) // Blocks!
}

// Good - Non-blocking
async send(event: AnalyticsEvent): Promise<void> {
  // Don't await individual requests if possible
  const promise = this.http.post(event)
  this.pendingPromises.push(promise)
}
```

✅ **Always handle errors appropriately**
```typescript
// Bad - Swallows errors
async send(event: AnalyticsEvent): Promise<void> {
  try {
    await this.http.post(event)
  } catch (error) {
    // Error swallowed - router won't know about failures
    console.log('Failed but continuing')
  }
}

// Good - Re-throw for router to handle
async send(event: AnalyticsEvent): Promise<void> {
  try {
    await this.http.post(event)
  } catch (error) {
    console.error('Provider error:', error)
    throw error // Router will handle isolation
  }
}
```

✅ **Don't expose sensitive data**
```typescript
// Bad - Logs raw attributes
console.log('Sending event:', event.attributes) // PII exposure!

// Good - Use metadata only
console.log('Sending event:', {
  eventName: event.name,
  attributeCount: Object.keys(event.attributes).length,
  // No attribute values logged
})
```

## Quick Reference

### Provider Structure Template
```typescript
// File: src/lib/analytics/providers/[provider].ts
import { AnalyticsProvider } from '../provider'
import { AnalyticsEvent } from '../types'

export class [Provider]Provider implements AnalyticsProvider {
  constructor(config?: ProviderConfig) {
    this.config = config || {}
  }

  async send(event: AnalyticsEvent): Promise<void> {
    // 1. Validate input
    if (!event.name) {
      throw new Error('Event name is required')
    }

    // 2. Transform to provider format
    const payload = this.transform(event)

    // 3. Send to provider
    await this.sendToProvider(payload)
  }

  private transform(event: AnalyticsEvent): ProviderPayload {
    // Implementation specific to provider
  }

  private async sendToProvider(payload: ProviderPayload): Promise<void> {
    // Implementation of provider communication
  }
}

interface ProviderConfig {
  apiKey?: string
  endpoint?: string
  // Provider-specific config
}
```

## Getting Help

- **Review existing providers**: Look at `src/lib/analytics/providers/` for patterns
- **Ask questions**: Use the project's communication channels
- **Test thoroughly**: Use the test harness from Story 7.7
- **Document your changes**: Update relevant documentation

Your provider will be automatically discovered and included in the analytics router when properly configured in the environment!