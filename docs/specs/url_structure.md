# URL Structure Specification

## Overview

This document specifies the URL structure used for the URL redirection system. The system acts as a centralized tracking hub that handles all tracking (GTM/GA4) before performing redirections to destination URLs.

## Base URL Structure

```
https://redirect.example.com#[destination-url]
```

### Components

1. **Base Domain**: `https://redirect.example.com`
2. **Hash Separator**: `#`
3. **Destination URL**: The complete URL to redirect to

## URL Length Considerations

1. **Maximum Length**:
   - Total URL length should not exceed 2048 characters (browser limitation)
   - Destination URL should ideally be under 1000 characters for optimal performance
   - Consider URL shortening for very long destination URLs

2. **Parameter Optimization**:
   - Remove unnecessary parameters to keep URLs shorter
   - Consider using URL shorteners for complex destination URLs
   - Prioritize essential tracking parameters

## Optional Parameters

### No-Redirect Parameter

The system supports an optional parameter to control redirection behavior:

```
https://redirect.example.com#[destination-url]?isNoRedirect=[0|1]
```

- `isNoRedirect=1`: Prevents redirection
- `isNoRedirect=0`: Allows redirection (default behavior)
- If not specified: Redirection is enabled by default

## Tracking Parameters

The system automatically captures and processes tracking parameters from the destination URL. This means:

1. The tracking parameters (UTM and platform-specific) are part of the destination URL
2. The redirect system automatically extracts and uses these parameters for its own tracking
3. This approach simplifies URL structure and tracking operations

### UTM Parameters

Standard UTM parameters that the system will capture from the destination URL:

- `utm_campaign`: Campaign identifier
- `utm_medium`: Marketing medium
- `utm_source`: Traffic source
- `utm_content`: Content identifier (optional)
- `utm_term`: Search term (optional)

### Platform-Specific Parameters

The system will also capture platform-specific parameters from the destination URL:

- Shopee: `xptdk` (Product tracking ID)
- Facebook: `ref` (Reference ID)
- Other platform-specific parameters as needed

## Analytics Considerations

1. **Parameter Standardization**:
   - Use consistent parameter naming across all campaigns
   - Follow UTM parameter naming conventions strictly
   - Document any custom parameters used

2. **Data Quality**:
   - Ensure all required tracking parameters are present
   - Validate parameter values before processing
   - Handle missing or invalid parameters gracefully

3. **Campaign Tracking**:
   - Maintain consistent campaign naming conventions
   - Include campaign identifiers in all URLs
   - Document campaign-specific parameter requirements

## Examples

### Basic Redirect
```
https://redirect.example.com#https://example.com
```

### With UTM Parameters
```
https://redirect.example.com#https://example.com?utm_campaign=summer_sale&utm_medium=email&utm_source=newsletter
```

### With No-Redirect Parameter
```
https://redirect.example.com#https://example.com?isNoRedirect=1
```

### Real-World Examples

1. **Messenger Link**:
```
https://redirect.example.com#https://m.me/example?ref=pi.VCSC19002L001&utm_campaign=-&utm_medium=&utm_source=
```

2. **Shopee Product**:
```
https://redirect.example.com#https://shopee.vn/product-name?xptdk=tracking-id&utm_campaign=sale&utm_medium=cpc&utm_source=facebook
```

3. **Website Page**:
```
https://redirect.example.com#https://example.com/product-page?utm_campaign=campaign&utm_medium=medium&utm_source=source&utm_content=content
```

## URL Encoding

- All special characters in the destination URL must be properly URL-encoded
- Vietnamese characters and other non-ASCII characters should be encoded using UTF-8
- Example: `nước` → `n%C6%B0%E1%BB%9Bc`

## Implementation Notes

1. The system performs tracking (GTM/GA4) before redirection
2. Redirection only happens if:
   - `isNoRedirect` is not set to 1
   - The destination URL is not empty
3. The system should handle both encoded and unencoded URLs appropriately
4. The system automatically extracts and processes tracking parameters from the destination URL
5. Implement proper error handling for malformed URLs
6. Log failed redirects for monitoring and debugging

## Error Handling

1. **Invalid URLs**:
   - Handle malformed destination URLs gracefully
   - Provide appropriate error messages
   - Log invalid URL attempts for monitoring

2. **Missing Parameters**:
   - Handle missing required parameters
   - Use default values when appropriate
   - Log missing parameter cases

3. **Encoding Issues**:
   - Handle URL encoding/decoding errors
   - Provide fallback behavior for invalid encodings
   - Log encoding-related issues

## Security Considerations

1. URLs should be validated before processing
2. Special characters should be properly escaped
3. The system should prevent potential security vulnerabilities through URL manipulation
4. Implement rate limiting to prevent abuse
5. Validate destination URLs against allowed domains
6. Sanitize all URL parameters

## Best Practices

1. Include tracking parameters in the destination URL - the system will automatically capture them
2. Use URL encoding for special characters
3. Keep URLs as short as possible while maintaining necessary tracking information
4. Test URLs with various parameter combinations before deployment
5. Monitor URL performance and analytics data
6. Regularly review and optimize URL structure
7. Document any custom parameters or special cases
8. Implement proper error handling and logging
9. Follow best practices for URL length and parameter optimization
10. Implement proper error handling and logging for URL structure issues 