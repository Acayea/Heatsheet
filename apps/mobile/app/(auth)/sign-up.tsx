import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, Alert, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { SignUpSchema } from '@fieldday/shared'
import { colors, spacing, typography } from '@fieldday/ui'

export default function SignUpScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSignUp() {
    const parsed = SignUpSchema.safeParse({ email, password, username, displayName })
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[String(e.path[0])] = e.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setIsLoading(true)

    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          username: parsed.data.username,
          display_name: parsed.data.displayName,
        },
      },
    })

    setIsLoading(false)
    if (error) {
      Alert.alert('Sign up failed', error.message)
    } else {
      router.replace('/(tabs)/home')
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Join the first fantasy platform for Track & Field.</Text>

      <View style={styles.form}>
        <Field
          label="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your full name"
          error={errors['displayName']}
        />
        <Field
          label="Username"
          value={username}
          onChangeText={(t) => setUsername(t.toLowerCase())}
          placeholder="e.g. tracknerd42"
          autoCapitalize="none"
          error={errors['username']}
        />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors['email']}
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          error={errors['password']}
        />
      </View>

      <Pressable
        style={[styles.primaryButton, isLoading && styles.disabled]}
        onPress={handleSignUp}
        disabled={isLoading}
      >
        <Text style={styles.primaryButtonText}>
          {isLoading ? 'Creating account…' : 'Create Account'}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push('/(auth)/sign-in')}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </Pressable>
    </ScrollView>
  )
}

interface FieldProps {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  autoCapitalize?: 'none' | 'sentences'
  keyboardType?: 'default' | 'email-address'
  error?: string | undefined
}

function Field({ label, error, ...props }: FieldProps) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : undefined]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  container: {
    padding: spacing.lg,
    paddingTop: spacing['2xl'],
    gap: spacing.md,
    minHeight: '100%',
  },
  back: { marginBottom: spacing.sm },
  backText: { color: colors.textSecondary, fontSize: typography.fontSizes.md },
  title: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.black,
    color: colors.textPrimary,
  },
  subtitle: { color: colors.textSecondary, fontSize: typography.fontSizes.md, marginBottom: spacing.sm },
  form: { gap: spacing.md },
  fieldWrapper: { gap: spacing.xs },
  label: { color: colors.textSecondary, fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.md,
  },
  inputError: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: typography.fontSizes.xs },
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
