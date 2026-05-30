import { z } from 'zod'

export const CreateLeagueSchema = z.object({
  name: z
    .string()
    .min(3, 'League name must be at least 3 characters')
    .max(50, 'League name must be at most 50 characters'),
  seasonId: z.string().uuid('Invalid season'),
  type: z.enum(['public', 'private']),
  maxMembers: z.number().int().min(2).max(20).default(10),
})

export const JoinLeagueSchema = z.object({
  inviteCode: z
    .string()
    .length(8, 'Invite code must be 8 characters')
    .regex(/^[A-Z0-9]+$/, 'Invalid invite code format'),
})

export type CreateLeagueInput = z.infer<typeof CreateLeagueSchema>
export type JoinLeagueInput = z.infer<typeof JoinLeagueSchema>
