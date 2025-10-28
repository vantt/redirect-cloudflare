import { RedirectError } from './errors'
import { appLogger } from '../utils/logger'

/**
 * Parse debug parameter value with truthy/falsy logic
 *
 * Truthy values: 1, true, yes, on, enabled
 * Falsy values: 0, false, no, off, disabled
 * Invalid values: log warning and default to false
 *
 * @param value - Debug parameter value from query string
 * @returns boolean indicating if debug mode should be enabled
 */
export function isDebugMode(value: string | undefined | null): boolean {
  if (!value || value.trim() === '') return false

  const truthy = ['1', 'true', 'yes', 'on', 'enabled']
  const falsy = ['0', 'false', 'no', 'off', 'disabled']

  const normalized = value.toLowerCase().trim()

  if (truthy.includes(normalized)) return true
  if (falsy.includes(normalized)) return false

  // Invalid value → log warning and default to false (conservative)
  appLogger.warn('Invalid debug parameter value', {
    value,
    expected: 'one of: 1, true, yes, on, enabled, 0, false, no, off, disabled',
    defaulting_to: false
  })
  
  return false
}

/**
 * Parse destination and debug mode from query string
 * Handles both URL-encoded and raw (non-encoded) destination URLs
 *
 * AC#2-3: Smart extraction logic for encoded/non-encoded URLs
 *
 * @param url - Full URL string with query parameters (e.g., '/r?to=https://example.com&debug=1')
 * @returns Object with destination URL and debug mode flag
 */
export function parseDestinationFromQuery(url: string): { destination: string; debugMode: boolean, usedLegacyParam: boolean } {
  // Extract query string from URL
  const queryStartIndex = url.indexOf('?')
  if (queryStartIndex === -1) {
    throw new RedirectError('Missing required parameter: to', 400, 'MISSING_PARAM')
  }

  const queryString = url.substring(queryStartIndex + 1)

  // Find all occurrences of 'to=' parameter (we'll use the last one)
  const toParamMatches: { index: number; value: string }[] = []
  let searchIndex = 0

  while (true) {
    const toIndex = queryString.indexOf('to=', searchIndex)
    if (toIndex === -1) break

    // Check if this is a real parameter boundary (start of string or preceded by &)
    if (toIndex === 0 || queryString[toIndex - 1] === '&') {
      toParamMatches.push({ index: toIndex, value: '' })
    }
    searchIndex = toIndex + 1
  }

  if (toParamMatches.length === 0) {
    throw new RedirectError('Missing required parameter: to', 400, 'MISSING_PARAM')
  }

  // Use LAST 'to=' parameter
  const lastToMatch = toParamMatches[toParamMatches.length - 1]
  const toStartIndex = lastToMatch.index + 3 // Skip 'to='

  // Extract destination - everything after 'to=' until we can determine the end
  let destinationRaw: string

  // Check if value appears to be URL-encoded (contains % encoding)
  const remainingQuery = queryString.substring(toStartIndex)
  const isEncoded = remainingQuery.includes('%')

  if (isEncoded) {
    // URL-encoded: extract until next '&' or end of string
    const nextAmpIndex = remainingQuery.indexOf('&')
    destinationRaw = nextAmpIndex === -1
      ? remainingQuery
      : remainingQuery.substring(0, nextAmpIndex)
  } else {
    // Raw (non-encoded): 'to' is the LAST parameter, extract everything after 'to='
    // BUT: strip outer query params like &debug= or &n= that appear AFTER the destination
    // This handles cases like: /r?to=https://example.com&debug=1
    // We need to be careful to preserve destination query params like: /r?to=https://example.com?var1=abc&var2=def&debug=1

    // Strategy: Look for &debug= or &n= patterns that appear at the END of the string
    // ONLY strip if there's NO '?' in the destination (meaning no query params in destination)
    // If there's a '?' in the destination, then &debug= is part of destination's query params
    const hasDestinationQuery = remainingQuery.includes('?')
    const outerParamMatch = remainingQuery.match(/&(debug|n)=(0|1|true|false|yes|no|on|off|enabled|disabled)$/i)

    if (outerParamMatch && !hasDestinationQuery) {
      // Strip outer param from destination (only if destination has no query params)
      destinationRaw = remainingQuery.substring(0, remainingQuery.length - outerParamMatch[0].length)
    } else {
      destinationRaw = remainingQuery
    }
  }

    
  // Decode if encoded, handle invalid encoding
  let destination: string

  try {
    destination = isEncoded ? decodeURIComponent(destinationRaw) : destinationRaw
  } catch (error) {
    // Invalid URL encoding
    if (error instanceof URIError) {
      throw new RedirectError('Invalid URL encoding', 400, 'INVALID_ENCODING')
    }
    throw error
  }

  // Extract debug mode from various locations
  let debugMode = false
  let cleanDestination = destination
  let usedLegacyParam = false

  // Check for 'debug=' or legacy 'n=' in outer query (before 'to=' parameter)
  const outerQuery = queryString.substring(0, lastToMatch.index)
  const debugMatch = outerQuery.match(/(?:^|&)debug=([^&]*)/)
  const legacyMatch = outerQuery.match(/(?:^|&)n=([^&]*)/)

  if (debugMatch) {
    const debugValue = debugMatch[1]
    debugMode = isDebugMode(debugValue)
  } else if (legacyMatch) {
    const debugValue = legacyMatch[1]
    debugMode = isDebugMode(debugValue)
    usedLegacyParam = true
  }

  // Also check for 'debug=' or 'n=' AFTER 'to=' in the outer query
  if (!debugMode) {
    if (isEncoded) {
      // Encoded case: check for debug/n after to parameter
      const afterToQuery = queryString.substring(toStartIndex + destinationRaw.length)
      const debugMatchAfter = afterToQuery.match(/&debug=([^&]*)/)
      const legacyMatchAfter = afterToQuery.match(/&n=([^&]*)/)

      if (debugMatchAfter) {
        const debugValue = debugMatchAfter[1]
        debugMode = isDebugMode(debugValue)
        // destination already correct - debug was in outer query, not in destination
      } else if (legacyMatchAfter) {
        const debugValue = legacyMatchAfter[1]
        debugMode = isDebugMode(debugValue)
        usedLegacyParam = true
        // destination already correct - debug was in outer query, not in destination
      }
    } else {
      // Non-encoded case: check if we stripped a debug/n param earlier
      const afterToQuery = queryString.substring(toStartIndex)
      const debugMatchAfter = afterToQuery.match(/&debug=([^&]*)$/)
      const legacyMatchAfter = afterToQuery.match(/&n=([^&]*)$/)

      if (debugMatchAfter) {
        const debugValue = debugMatchAfter[1]
        debugMode = isDebugMode(debugValue)
        // destination already stripped in lines 72-75, no need to clean
      } else if (legacyMatchAfter) {
        const debugValue = legacyMatchAfter[1]
        debugMode = isDebugMode(debugValue)
        usedLegacyParam = true
        // destination already stripped in lines 72-75, no need to clean
      }
    }
  }

  // Check for 'debug=' or 'n=' INSIDE the destination URL itself
  if (!debugMode) {
    const debugInDestMatch = destination.match(/[?&]debug=([^&]*)/)
    const legacyInDestMatch = destination.match(/[?&]n=([^&]*)/)

    if (debugInDestMatch) {
      const debugValue = debugInDestMatch[1]
      debugMode = isDebugMode(debugValue)
    } else if (legacyInDestMatch) {
      const debugValue = legacyInDestMatch[1]
      debugMode = isDebugMode(debugValue)
      usedLegacyParam = true
    }
  }

  return { destination: cleanDestination, debugMode, usedLegacyParam }
}