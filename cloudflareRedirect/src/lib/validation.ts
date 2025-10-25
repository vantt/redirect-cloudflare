import { z } from 'zod'

export const redirectSchema = z.object({
  to: z.string().url(),
  n: z.enum(['0', '1']).optional()
})

export type RedirectQuery = z.infer<typeof redirectSchema>