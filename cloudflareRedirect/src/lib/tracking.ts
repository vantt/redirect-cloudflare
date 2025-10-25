/**
 * Tracking Placeholder Functions
 * 
 * This file contains no-op tracking functions that will be replaced
 * by actual GA4 implementation in Epic 7. The interfaces are
 * kept stable to allow future implementation without refactoring.
 * 
 * TODO: Replace these implementations in Epic 7 stories:
 * - 7.1: Tracking Parameter Extraction from Destination URLs
 * - 7.2: GA4 Measurement Protocol Payload Builder  
 * - 7.3: GA4 Measurement Protocol HTTP Integration
 * - 7.4: Integrated Tracking in Redirect Flow
 */

/**
 * Extract tracking parameters from destination URL
 * TODO: Implement actual UTM and platform-specific parameter extraction in Epic 7.1
 * @param destinationUrl - The URL to extract tracking parameters from
 * @returns Empty object for now, will contain tracking parameters in Epic 7
 */
export function extractTrackingParams(destinationUrl: string): Record<string, string> {
  // TODO: Epic 7.1 - Extract UTM parameters: utm_source, utm_medium, utm_campaign, utm_content, utm_term
  // TODO: Epic 7.1 - Extract platform-specific params: xptdk (Shopee), ref (Facebook)
  // TODO: Epic 7.1 - Handle URL parsing errors gracefully
  
  // Placeholder implementation - returns empty object
  return {}
}

/**
 * Build GA4 Measurement Protocol payload from tracking parameters
 * TODO: Implement actual GA4 payload construction in Epic 7.2
 * @param params - Tracking parameters extracted from destination URL
 * @param measurementId - GA4 Measurement ID
 * @returns Placeholder object with no-op type
 */
export function buildGA4Payload(params: Record<string, string>, measurementId: string): any {
  // TODO: Epic 7.2 - Generate client_id using hash of timestamp + random value
  // TODO: Epic 7.2 - Construct GA4 Measurement Protocol v2 payload structure
  // TODO: Epic 7.2 - Include events array with 'redirect_click' event
  // TODO: Epic 7.2 - Map UTM params to GA4 event parameters
  // TODO: Epic 7.2 - Handle missing/undefined parameters gracefully
  
  // Placeholder implementation - returns no-op marker
  return {
    type: 'noop',
    message: 'GA4 payload building not implemented - see Epic 7.2'
  }
}

/**
 * Send GA4 tracking event via HTTP POST
 * TODO: Implement actual HTTP request to GA4 Measurement Protocol in Epic 7.3
 * @param payload - GA4 payload to send
 * @param apiSecret - GA4 API secret for authentication
 * @param measurementId - GA4 Measurement ID
 * @returns Promise that resolves immediately (placeholder)
 */
export async function sendGA4Event(
  payload: any, 
  apiSecret: string, 
  measurementId: string
): Promise<void> {
  // TODO: Epic 7.3 - Send POST request to https://www.google-analytics.com/mp/collect
  // TODO: Epic 7.3 - Include query params: measurement_id and api_secret
  // TODO: Epic 7.3 - Set Content-Type: application/json header
  // TODO: Epic 7.3 - Implement 2-second timeout using AbortSignal.timeout(2000)
  // TODO: Epic 7.3 - Catch timeout and fetch errors, log without throwing
  
  // Placeholder implementation - resolves immediately
  return Promise.resolve()
}