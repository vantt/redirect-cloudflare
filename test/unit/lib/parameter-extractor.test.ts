import { describe, it, expect } from 'vitest';
import { extractTrackingParams } from '../../../src/lib/parameter-extractor';

describe('extractTrackingParams', () => {
  it('should extract all UTM parameters', () => {
    const url = 'https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=summer_sale&utm_content=banner_ad&utm_term=running_shoes';
    const params = extractTrackingParams(url);
    expect(params).toEqual({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'summer_sale',
      utm_content: 'banner_ad',
      utm_term: 'running_shoes',
    });
  });

  it('should extract platform-specific parameters', () => {
    const url = 'https://example.com?xptdk=12345&ref=facebook';
    const params = extractTrackingParams(url);
    expect(params).toEqual({
      xptdk: '12345',
      ref: 'facebook',
    });
  });

  it('should handle a mix of parameters', () => {
    const url = 'https://example.com?utm_source=google&xptdk=12345';
    const params = extractTrackingParams(url);
    expect(params).toEqual({
      utm_source: 'google',
      xptdk: '12345',
    });
  });

  it('should return an empty object for URLs with no tracking parameters', () => {
    const url = 'https://example.com?foo=bar';
    const params = extractTrackingParams(url);
    expect(params).toEqual({});
  });

  it('should handle malformed URLs gracefully', () => {
    const url = 'not a url';
    const params = extractTrackingParams(url);
    expect(params).toEqual({});
  });
});