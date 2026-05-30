import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { colors, spacing, typography } from '@fieldday/ui'

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.wordmark}>FIELDDAY</Text>
        <Text style={styles.tagline}>Fantasy sports for Track & Field.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/sign-up')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: spacing['3xl'],
    paddingTop: spacing['3xl'],
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  wordmark: {
    fontSize: typography.fontSizes['4xl'],
    fontWeight: typography.fontWeights.black,
    color: colors.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: typography.fontSizes.lg,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
})
