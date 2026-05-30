import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, typography } from '@fieldday/ui'

export default function SeasonsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.header}>Seasons</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🏆 All six seasons (pro + college) will be listed here.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.lg },
  header: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.black,
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
