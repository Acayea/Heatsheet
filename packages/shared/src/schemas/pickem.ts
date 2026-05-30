import { z } from 'zod'

export const PickemPickSchema = z.object({
  meetId: z.string().uuid(),
  event: z.string().min(1),
  athleteId: z.string().uuid(),
})

export const SubmitPickemSchema = z.object({
  meetId: z.string().uuid(),
  picks: z
    .array(PickemPickSchema)
    .min(1, 'Must make at least one pick')
    .max(50, 'Too many picks'),
})

export type PickemPick = z.infer<typeof PickemPickSchema>
export type SubmitPickemInput = z.infer<typeof SubmitPickemSchema>
