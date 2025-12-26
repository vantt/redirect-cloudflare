import type { KVNamespace } from '@cloudflare/workers-types'
import { RedirectError } from './errors'
import { redirectSchema, validateDestinationDomain } from './validation'
import { getRedirect } from './kv-store'
import type { RedirectData } from '../types/env'

/**
 * Interface for resolved destination information
 */
export interface ResolvedDestination {
  /** Final resolved URL */
  url: string
  /** Redirect type - permanent (301) or temporary (302) */
  type: 'permanent' | 'temporary'
  /** Source of resolution - 'kv' for shortcode lookup, 'direct' for full URL */
  source: 'kv' | 'direct'
  /** Original shortcode if source is 'kv' */
  shortcode?: string
}

/**
 * Interface for debug information
 */
export interface DebugInfo {
  /** Original destination parameter */
  original: string
  /** Final resolved URL */
  resolved: string
  /** Redirect type */
  type: 'permanent' | 'temporary'
  /** Source of resolution */
  source: 'kv' | 'direct'
  /** Original shortcode if applicable */
  shortcode?: string
}

/**
 * Detects if a value is a valid shortcode (alphanumeric, 3-20 chars)
 * @param value - String to check
 * @returns true if value matches shortcode pattern
 */
export function isShortcode(value: string): boolean {
  const shortcodePattern = /^[a-zA-Z0-9]{3,20}$/
  return shortcodePattern.test(value)
}

/**
 * Detects if a value is a valid full URL (http:// or https://)
 * @param value - String to check
 * @returns true if value matches URL pattern
 */
export function isFullUrl(value: string): boolean {
  const urlPattern = /^https?:\/\/.+/
  return urlPattern.test(value)
}

/**
 * Resolves destination parameter to full URL
 * @param destination - Raw destination parameter from query
 * @param kvStore - KV namespace for shortcode lookups
 * @returns Promise<ResolvedDestination> with resolved URL and metadata
 * @throws RedirectError for invalid format or missing shortcodes
 */
export async function resolveDestination(
  destination: string,
  kvStore?: KVNamespace
): Promise<ResolvedDestination> {

  // Case 1: Direct URL
  if (isFullUrl(destination)) {
    return {
      url: destination,
      type: 'temporary', // Default for direct URLs
      source: 'direct'
    }
  }

  // Case 2: Shortcode resolution
  if (isShortcode(destination)) {
    if (!kvStore) {
      throw new RedirectError(
        'KV store not configured',
        500,
        'INTERNAL_ERROR'
      );
    }
    const redirectData = await getRedirect(destination, kvStore)
    
    if (!redirectData) {
      throw new RedirectError(
        `Shortcode not found: ${destination}`,
        404,
        'SHORTCODE_NOT_FOUND'
      )
    }

    return {
      url: redirectData.url,
      type: redirectData.type || 'temporary',
      source: 'kv',
      shortcode: destination
    }
  }
  
  // Case 3: Invalid format
  throw new RedirectError(
    'Invalid destination format: must be shortcode (alphanumeric) or full URL (http:// or https://)',
    400,
    'INVALID_DESTINATION_FORMAT'
  )
}

/**
 * Validates resolved URL using existing validation functions
 * @param url - URL to validate
 * @param allowedDomains - Optional comma-separated allowlist
 * @returns Validated URL string
 * @throws RedirectError for validation failures
 */
export function validateResolvedUrl(
  url: string,
  allowedDomains?: string
): string {
  try {
    // Use existing redirect schema for basic validation
    const validated = redirectSchema.parse({ to: url })
    
    // Use existing domain validation if allowlist is configured
    if (!validateDestinationDomain(validated.to, allowedDomains)) {
      throw new RedirectError(
        `Domain not allowed: ${new URL(validated.to).hostname}`,
        403,
        'DOMAIN_NOT_ALLOWED'
      )
    }
    
    return validated.to
  } catch (error) {
    if (error instanceof RedirectError) {
      throw error
    }
    
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      throw new RedirectError(
        `Invalid URL: ${error.message}`,
        400,
        'INVALID_URL'
      )
    }
    
    throw new RedirectError(
      'Unknown validation error',
      500,
      'INTERNAL_ERROR'
    )
  }
}