import { Tabs, Redirect } from 'expo-router'
import { Text } from 'react-native'
import { useAuthStore } from '@/stores/auth'
import { colors, typography } from '@fieldday/ui'

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{label}</Text>
  )
}

export default function TabsLayout() {
  const { session, isLoading } = useAuthStore()

  if (isLoading) return null
  if (!session) return <Redirect href="/(auth)/welcome" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: typography.fontSizes.xs,
          fontWeight: typography.fontWeights.medium,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="seasons"
        options={{
          title: 'Seasons',
          tabBarIcon: ({ focused }) => <TabIcon label="🏆" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="leagues"
        options={{
          title: 'My Leagues',
          tabBarIcon: ({ focused }) => <TabIcon label="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="athletes"
        options={{
          title: 'Athletes',
          tabBarIcon: ({ focused }) => <TabIcon label="⚡" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
