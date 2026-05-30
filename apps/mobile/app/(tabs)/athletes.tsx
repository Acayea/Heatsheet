import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { colors, spacing, typography } from '@fieldday/ui'
import { useState } from 'react'
import type { Database } from '@fieldday/db'

type AthleteRow = Database['public']['Tables']['athletes']['Row']

async function fetchAthletes(search: string): Promise<AthleteRow[]> {
  let query = supabase
    .from('athletes')
    .select('*')
    .eq('pool', 'pro')
    .eq('is_active', true)
    .order('last_name')
    .limit(50)

  if (search.length > 1) {
    query = query.or(`last_name.ilike.%${search}%,first_name.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export default function AthletesScreen() {
  const [search, setSearch] = useState('')
  const { data: athletes, isLoading } = useQuery({
    queryKey: ['athletes', 'pro', search],
    queryFn: () => fetchAthletes(search),
  })

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.header}>Athletes</Text>

        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search athletes…"
          placeholderTextColor={colors.textMuted}
        />

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <FlatList
            data={athletes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <AthleteRow athlete={item} />}
            ListEmptyComponent={<Text style={styles.empty}>No athletes found.</Text>}
            contentContainerStyle={{ gap: spacing.xs, paddingBottom: spacing.xl }}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

function AthleteRow({ athlete }: { athlete: AthleteRow }) {
  return (
    <View style={styles.athleteRow}>
      <View style={styles.athleteInfo}>
        <Text style={styles.athleteName}>
          {athlete.first_name} {athlete.last_name}
        </Text>
        <Text style={styles.athleteMeta}>
          {athlete.country_code} · {athlete.primary_event}
        </Text>
      </View>
      <Text style={styles.salary}>${(athlete.salary / 1000).toFixed(1)}K</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  header: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.black,
    color: colors.textPrimary,
  },
  search: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.md,
  },
  athleteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: spacing.md,
  },
  athleteInfo: { gap: 2 },
  athleteName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
  athleteMeta: { color: colors.textSecondary, fontSize: typography.fontSizes.sm },
  salary: {
    color: colors.primary,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
})
