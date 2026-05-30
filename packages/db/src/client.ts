import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Creates a typed Supabase client.
 * Pass SUPABASE_URL and SUPABASE_ANON_KEY from the consuming app's environment.
 */
export function createClient(supabaseUrl: string, supabaseAnonKey: string) {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}
