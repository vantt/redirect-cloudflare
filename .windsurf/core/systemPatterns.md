# System Patterns

## Architecture
- Cloudflare Workers edge computing architecture
- Serverless redirect service with KV storage
- Centralized tracking and redirect handling
- GTM/GA4 integration

## URL Processing Patterns
1. **URL Structure**
   - Base format: `https://redirect.example.com#[destination-url]?isNoRedirect=[0|1]`
   - URL component handling (up to 2048 characters)
   - Parameter extraction and processing

2. **Tracking Pattern**
   - Track before redirect flow
   - UTM parameter handling
   - Platform-specific parameter support
   - Custom event tracking

3. **Redirection Flow**
   - URL validation
   - Parameter extraction
   - Tracking execution
   - Redirect operation
   - Error handling

4. **Error Handling Pattern**
   - Structured error responses
   - Error logging
   - Monitoring and alerting
   - Fallback mechanisms

## Security Patterns
- URL validation and sanitization
- Rate limiting
- DDoS protection
- Parameter sanitization
- Allowed domain validation

## Performance Patterns
- Edge computing optimization
- Caching strategies
- Minimal dependencies
- Resource optimization
- Processing time optimization (<5ms target)

## Analytics Patterns
- GTM integration
- GA4 tracking
- Custom event tracking
- Dashboard visualization
- Reporting and analytics

Last Updated: 2025-04-21 20:42
