export type UserRole = 'user' | 'admin'

export interface UserProfile {
  id: string
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
}
