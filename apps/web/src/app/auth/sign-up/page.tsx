'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SignUpSchema } from '@fieldday/shared'

export default function SignUpPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', username: '', displayName: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = SignUpSchema.safeParse(form)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[String(err.path[0])] = err.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setIsLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
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
    if (authError) {
      setErrors({ _form: authError.message })
    } else {
      router.push('/home')
      router.refresh()
    }
  }

  const fields: Array<{ key: keyof typeof form; label: string; type?: string; placeholder: string }> = [
    { key: 'displayName', label: 'Display Name', placeholder: 'Your full name' },
    { key: 'username', label: 'Username', placeholder: 'e.g. tracknerd42' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'At least 8 characters' },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-3xl font-black text-[#E8FF00]">FIELDDAY</h1>
        <p className="mb-8 text-zinc-400">Create your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {fields.map(({ key, label, type = 'text', placeholder }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-zinc-400">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={set(key)}
                required
                className={`w-full rounded-lg border bg-[#1A1A1A] px-4 py-3 text-white placeholder-zinc-600 focus:outline-none ${
                  errors[key] ? 'border-red-500' : 'border-[#2A2A2A] focus:border-[#E8FF00]'
                }`}
                placeholder={placeholder}
              />
              {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
            </div>
          ))}

          {errors['_form'] && <p className="text-sm text-red-500">{errors['_form']}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 rounded-xl bg-[#E8FF00] py-3 font-bold text-[#0D0D0D] transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/auth/sign-in" className="text-zinc-300 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
