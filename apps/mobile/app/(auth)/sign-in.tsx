import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { SignInSchema } from '@fieldday/shared'
import { colors, spacing, typography } from '@fieldday/ui'

export default function SignInScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSignIn() {
    const parsed = SignInSchema.safeParse({ email, password })
    if (!parsed.success) {
      Alert.alert('Invalid input', parsed.error.errors[0]?.message ?? 'Please check your details.')
      return
    }
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    setIsLoading(false)
    if (error) {
      Alert.alert('Sign in failed', error.message)
    } else {
      router.replace('/(tabs)/home')
    }
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Welcome back</Text>

      <View style={styles.form}>
        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoComplete="password"
          />
        </View>
      </View>

      <Pressable
        style={[styles.primaryButton, isLoading && styles.disabled]}
        onPress={handleSignIn}
        disabled={isLoading}
      >
        <Text style={styles.primaryButtonText}>{isLoading ? 'Signing in…' : 'Sign In'}</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/(auth)/sign-up')}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    paddingTop: spacing['2xl'],
    gap: spacing.md,
  },
  back: { marginBottom: spacing.sm },
  backText: { color: colors.textSecondary, fontSize: typography.fontSizes.md },
  title: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  form: { gap: spacing.md },
  fieldWrapper: { gap: spacing.xs },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  disabled: { opacity: 0.5 },
  primaryButtonText: {
    color: colors.surface,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  link: { color: colors.textSecondary, textAlign: 'center', fontSize: typography.fontSizes.sm },
})
