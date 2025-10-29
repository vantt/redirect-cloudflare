import { appLogger } from '../utils/logger';
import { TrackingParams } from '../types/env';

export function extractTrackingParams(destinationUrl: string): TrackingParams {
  try {
    const url = new URL(destinationUrl);
    const params = new URLSearchParams(url.search);
    
    const trackingParams: TrackingParams = {};
    
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium'); 
    const utmCampaign = params.get('utm_campaign');
    const utmContent = params.get('utm_content');
    const utmTerm = params.get('utm_term');
    const xptdk = params.get('xptdk');
    const ref = params.get('ref');
    
    if (utmSource) trackingParams.utm_source = decodeURIComponent(utmSource);
    if (utmMedium) trackingParams.utm_medium = decodeURIComponent(utmMedium);
    if (utmCampaign) trackingParams.utm_campaign = decodeURIComponent(utmCampaign);
    if (utmContent) trackingParams.utm_content = decodeURIComponent(utmContent);
    if (utmTerm) trackingParams.utm_term = decodeURIComponent(utmTerm);
    if (xptdk) trackingParams.xptdk = decodeURIComponent(xptdk);
    if (ref) trackingParams.ref = decodeURIComponent(ref);
    
    return trackingParams;
  } catch (error) {
    appLogger.error('Failed to parse destination URL for tracking extraction', {
      url: destinationUrl,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return {};
  }
}
