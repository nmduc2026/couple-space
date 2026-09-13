import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Thieu VITE_SUPABASE_URL hoac VITE_SUPABASE_PUBLISHABLE_KEY. Hay tao app/.env.local (xem .env.example).',
  )
}

/** Client Supabase dung chung — chi khoi tao mot lan. */
export const supabase = createClient(supabaseUrl, supabaseKey)
