# Epic 2: Analytics Tracking Infrastructure - Technical Architecture

## Executive Summary

Epic 2 extends the core redirect service with comprehensive analytics tracking capabilities using Google Analytics 4 Measurement Protocol. This architecture ensures non-blocking redirect performance while providing detailed tracking insights.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Request   │───▶│   Redirect Logic   │───▶│   Analytics      │
│                 │    │                 │    │   Tracking      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                      │
        ▼                        ▼                      ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  HTTP 301/302  │    │  Fire & Forget   │    │  GA4 MP Events  │
│    Redirect      │    │   Analytics      │    │   to Google     │
│                 │    │   Processing    │    │   Analytics     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Core Components

### 1. Analytics Event System
- **Location**: `src/lib/analytics.ts`
- **Purpose**: Centralized analytics event creation and queuing
- **Key Features**:
  - Event validation and enrichment
  - User ID extraction and management
  - Fire-and-forget async processing
  - Error isolation and retry logic

### 2. GA4 Measurement Protocol Client
- **Location**: `src/lib/ga4-client.ts`
- **Purpose**: HTTP client for GA4 Measurement Protocol v2
- **Key Features**:
  - HTTP POST with proper headers
  - Request validation and retry logic
  - Response parsing and error handling
  - Batch event support for efficiency

### 3. Tracking Data Store
- **Location**: `src/lib/tracking-store.ts`
- **Purpose**: Cloudflare KV storage for tracking data
- **Key Features**:
  - Event persistence and retry queue
  - User session management
  - Tracking metadata storage
  - Privacy-compliant data handling

### 4. Redirect Integration Points
- **Location**: Updates to `src/routes/redirect.ts`
- **Purpose**: Analytics hooks in redirect flow
- **Key Features**:
  - Pre-redirect tracking data capture
  - Post-redirect analytics queuing
  - Non-blocking event processing
  - Error isolation (analytics failures don't break redirects)

## Data Flow

```
1. User Request → Redirect Endpoint
   ↓
2. Extract Tracking Data (user_id, referrer, user_agent, etc.)
   ↓
3. Execute Redirect (301/302) + Fire Analytics Event Async
   ↓
4. Analytics Event → GA4 MP → Google Analytics
   ↓
5. Tracking Data → ANALYTICS_KV (for retries/debugging)
```

## Privacy and Compliance

### Data Minimization
- **User IDs**: Optional, hashed when provided
- **PII**: No personal information collected
- **Retention**: Event data retained for retry purposes only
- **Consent**: Framework ready for consent management

### GDPR/CCPA Considerations
- **Data Processing**: Edge processing minimizes data transfer
- **Storage**: Cloudflare KV with defined retention policies
- **User Rights**: Delete functionality for user data
- **Transparency**: Clear documentation of data collection

## Performance Considerations

### Non-Blocking Architecture
- **Analytics Fire-and-Forget**: Never delays redirect response
- **Event Queuing**: Background processing with KV fallback
- **Error Isolation**: Analytics failures don't impact redirects
- **Timeout Protection**: 2-second limit on analytics requests

### Edge Optimization
- **Minimal Dependencies**: Lightweight HTTP client only
- **Local Caching**: Event batching when possible
- **Sub-5ms Target**: Analytics processing under 2ms
- **Memory Efficiency**: Stream processing for large events

## Technical Specifications

### Event Schema
```typescript
interface AnalyticsEvent {
  name: string           // Event type (page_view, redirect, etc.)
  params: Record<string, string | number | boolean>
  user_id?: string      // Optional, privacy-respecting
  timestamp: string     // ISO 8601
  client_id: string     // GA4 Measurement ID
}
```

### Error Handling
```typescript
interface AnalyticsError {
  code: string          // ANALYTICS_TIMEOUT, NETWORK_ERROR, etc.
  message: string       // Human-readable error
  timestamp: string     // ISO 8601
  retry_count: number   // Retry attempt counter
}
```

## Integration Points

### 1. Redirect Endpoint Enhancement
```typescript
// In src/routes/redirect.ts
app.get('/', async (c) => {
  // ... existing redirect logic ...
  
  // Fire analytics async (non-blocking)
  fireAnalyticsEvent({
    name: 'redirect_executed',
    params: {
      redirect_id: extractRedirectId(c),
      destination_url: finalDestination,
      redirect_type: redirectData?.type || 'temporary'
    }
  }).catch(err => {
    console.warn('Analytics failed:', err)
  })
  
  // Return redirect immediately
  return createRedirectResponse(finalDestination, redirectType)
})
```

### 2. Global Error Handler Integration
```typescript
// In src/index.ts - enhanced app.onError
app.onError((err, c) => {
  // ... existing error logic ...
  
  // Track error events
  fireAnalyticsEvent({
    name: 'error_occurred',
    params: {
      error_type: err.name,
      status_code: statusCode,
      endpoint: c.req.path
    }
  })
})
```

## Testing Strategy

### Unit Testing
- Analytics event creation and validation
- GA4 client HTTP requests/responses
- Tracking data storage and retrieval
- Error handling and retry logic

### Integration Testing
- End-to-end redirect with analytics
- Analytics KV storage verification
- GA4 Measurement Protocol mocking
- Performance impact on redirect latency

### Mock Strategy
- GA4 Measurement Protocol mock server
- Cloudflare KV emulation
- Network failure simulation
- Edge environment testing with Miniflare

## Deployment Considerations

### Environment Variables
```bash
# New variables for Epic 2
GA4_MEASUREMENT_ID=your-ga4-measurement-id
GA4_API_SECRET=your-ga4-api-secret
ANALYTICS_ENABLED=true
```

### KV Namespace Setup
```bash
# Production
wrangler kv:namespace create "ANALYTICS_KV"

# Development
wrangler kv:namespace create "ANALYTICS_KV" --preview
```

## Risk Mitigation

### Analytics Service Reliability
- **Retry Logic**: Exponential backoff with max attempts
- **Fallback Mode**: Continue operation without analytics
- **Circuit Breaker**: Temporarily disable failing analytics
- **Monitoring**: Analytics success/failure rate tracking

### Performance Impact
- **Async Processing**: Never block redirect response
- **Batch Events**: Reduce HTTP request frequency
- **Local Queuing**: KV fallback for high load
- **Timeout Protection**: 2-second limit per analytics request

## Success Metrics

### Technical KPIs
- Redirect latency < 5ms (with analytics)
- Analytics success rate > 95%
- Event processing time < 100ms
- Error rate < 1%

### Business KPIs
- Redirect tracking coverage
- User journey analytics
- Conversion tracking accuracy
- Performance impact measurement

## Next Steps

1. Implement analytics event system
2. Create GA4 Measurement Protocol client
3. Integrate tracking into redirect flow
4. Add comprehensive error tracking
5. Implement testing framework
6. Deploy with monitoring

This architecture ensures Epic 2 builds on Epic 1's solid foundation while maintaining the core principle: **redirects must never be slowed down by analytics**.