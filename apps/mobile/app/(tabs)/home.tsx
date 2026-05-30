import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, typography } from '@fieldday/ui'
import { useAuthStore } from '@/stores/auth'

export default function HomeScreen() {
  const { user } = useAuthStore()

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.wordmark}>FIELDDAY</Text>
        <Text style={styles.greeting}>Good to see you{user?.email ? '.' : '.'}</Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🚧 Active seasons and leagues will appear here.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.lg },
  wordmark: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.black,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  greeting: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
  },
  placeholderText: { color: colors.textSecondary, fontSize: typography.fontSizes.md, textAlign: 'center' },
})
