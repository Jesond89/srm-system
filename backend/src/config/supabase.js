import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

// Cliente público (anon key) — para operaciones normales
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey)

// Cliente admin (service key) — para operaciones privilegiadas (bypass RLS)
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
