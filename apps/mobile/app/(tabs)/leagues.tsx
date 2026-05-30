import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, typography } from '@fieldday/ui'

export default function LeaguesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>My Leagues</Text>
          <Pressable style={styles.newButton}>
            <Text style={styles.newButtonText}>+ New</Text>
          </Pressable>
        </View>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>👥 Your public and private leagues will appear here.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  header: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.black,
    color: colors.textPrimary,
  },
  newButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  newButtonText: {
    color: colors.surface,
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.sm,
  },
  placeholder: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
  },
  placeholderText: { color: colors.textSecondary, fontSize: typography.fontSizes.md, textAlign: 'center' },
})
