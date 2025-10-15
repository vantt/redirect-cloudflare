# Product Context

## User Needs
1. Efficient URL redirection with tracking parameters
2. Reliable tracking before redirection to destination URLs
3. Fast processing times (<5ms)
4. Support for UTM and platform-specific parameters
5. Ability to control redirection behavior

## Requirements

### Functional Requirements
- Process URLs up to 2048 characters
- Handle URL encoding/decoding
- Process UTM parameters (campaign, medium, source, content, term)
- Support platform-specific parameters (Shopee: xptdk, Facebook: ref)
- Support no-redirect parameter for controlling redirection
- Complete tracking operations before redirection
- Graceful error handling

### Non-Functional Requirements
- Performance: <5ms processing time
- Reliability: 100% uptime
- Security: Protection against URL manipulation
- Analytics: Zero tracking failures
- Error Rate: <0.1%
- Scalability: Edge computing optimization

## URL Structure
```
https://redirect.example.com#[destination-url]?isNoRedirect=[0|1]
```

## Constraints
- Must use Cloudflare Workers with edge computing
- Must integrate with GTM/GA4 tracking
- Must validate and sanitize all URL parameters
- Must implement rate limiting
- Must follow web security best practices

Last Updated: 2025-04-21 20:40
