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