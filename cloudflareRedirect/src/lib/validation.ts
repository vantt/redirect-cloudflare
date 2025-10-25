import { z } from 'zod'

// Custom URL validation that only allows http:// and https:// schemes
const httpHttpsUrl = z.string().refine((url) => {
  if (!url || url.trim() === '') {
    return false
  }
  
  // Reject protocol-relative URLs (starting with //)
  if (url.startsWith('//')) {
    return false
  }
  
  try {
    const parsed = new URL(url)
    // Only allow http and https schemes
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}, {
  message: 'Only HTTP/HTTPS URLs allowed'
})

export const redirectSchema = z.object({
  to: httpHttpsUrl,
  n: z.enum(['0', '1']).optional()
})

export type RedirectQuery = z.infer<typeof redirectSchema>

// Domain allowlist validation function
export function validateDestinationDomain(
  destination: string, 
  allowedDomains?: string
): boolean {
  // If no allowlist is configured, allow all domains
  if (!allowedDomains || allowedDomains.trim() === '') {
    return true
  }

  try {
    const parsed = new URL(destination)
    const hostname = parsed.hostname.toLowerCase()
    
    // Parse allowed domains and clean them
    const allowedList = allowedDomains
      .split(',')
      .map(domain => domain.trim().toLowerCase())
      .filter(domain => domain.length > 0)
    
    // Check if hostname matches any allowed domain exactly
    if (allowedList.includes(hostname)) {
      return true
    }
    
    // Check if hostname is a subdomain of any allowed domain
    for (const allowedDomain of allowedList) {
      if (hostname === allowedDomain || hostname.endsWith('.' + allowedDomain)) {
        return true
      }
    }
    
    return false
  } catch {
    // If URL parsing fails, reject (defensive security)
    return false
  }
}