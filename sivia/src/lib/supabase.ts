import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Configuration Supabase manquante. Copiez .env.example en .env et renseignez ' +
      'VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (voir README.md).',
  )
}

/**
 * Client Supabase unique.
 * L'anon key est publique par conception : toute la sécurité repose sur la
 * Row Level Security (chaque famille ne voit que ses propres données).
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
