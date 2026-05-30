import { Redirect } from 'expo-router'
import { useAuthStore } from '@/stores/auth'

/** Root redirect: send authenticated users to tabs, others to auth */
export default function Index() {
  const { session, isLoading } = useAuthStore()

  if (isLoading) return null // splash is still showing

  return session ? <Redirect href="/(tabs)/home" /> : <Redirect href="/(auth)/welcome" />
}
