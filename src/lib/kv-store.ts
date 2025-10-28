import type { RedirectData } from '../types/env'

/**
 * Retrieves redirect data from KV store
 * @param path - The short URL path key
 * @param kv - KV namespace binding
 * @returns RedirectData object if found, null otherwise
 */
export async function getRedirect(
  path: string,
  kv: KVNamespace
): Promise<RedirectData | null> {
  try {
    return await kv.get(path, 'json') as RedirectData | null
  } catch (error) {
    // Handle malformed JSON gracefully - return null (AC #7)
    console.error(`Failed to parse redirect data for path "${path}":`, error)
    return null
  }
}

/**
 * Stores redirect data in KV store
 * @param path - The short URL path key
 * @param data - Redirect data to store
 * @param kv - KV namespace binding
 */
export async function putRedirect(
  path: string,
  data: RedirectData,
  kv: KVNamespace
): Promise<void> {
  await kv.put(path, JSON.stringify(data))
}
