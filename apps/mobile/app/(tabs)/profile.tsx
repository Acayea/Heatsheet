import { View, Text, StyleSheet, Pressable, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { colors, spacing, typography } from '@fieldday/ui'

export default function ProfileScreen() {
  const { user } = useAuthStore()

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      router.replace('/(auth)/welcome')
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.header}>Profile</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'Leagues', value: '—' },
            { label: 'Season Wins', value: '—' },
            { label: 'Badges', value: '—' },
          ].map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  header: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.black,
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.black,
  },
  email: { color: colors.textSecondary, fontSize: typography.fontSizes.md },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: spacing.lg,
  },
  stat: { alignItems: 'center', gap: spacing.xs },
  statValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.black,
    color: colors.textPrimary,
  },
  statLabel: { fontSize: typography.fontSizes.xs, color: colors.textSecondary },
  signOutButton: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: 'auto',
  },
  signOutText: { color: colors.error, fontSize: typography.fontSizes.md, fontWeight: typography.fontWeights.semibold },
})
