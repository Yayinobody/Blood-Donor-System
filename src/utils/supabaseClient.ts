import { createClient } from '@supabase/supabase-js';

// Vite exposes environment variables via import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables in .env');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');