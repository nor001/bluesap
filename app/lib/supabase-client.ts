import { createClient } from '@supabase/supabase-js';
import { CONFIG_KEYS } from './types/config-keys';

// Frontend client - uses public environment variables
const supabaseUrl = process.env[CONFIG_KEYS.NEXT_PUBLIC_SUPABASE_URL];
const supabaseAnonKey = process.env[CONFIG_KEYS.NEXT_PUBLIC_SUPABASE_ANON_KEY];

// Check if Supabase is configured for frontend
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Create Supabase client for frontend (public access)
export const supabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'sap-gestion-auth',
        autoRefreshToken: true,
      },
    })
  : null;

// Export a function to check if Supabase is configured
export const isSupabaseAvailable = () => !!supabaseClient;
