import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://zerqvtduallempbtjjak.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_uQ7mKJdPb8NiXbNEyknttg_tOb87DyK';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string)?.trim();
const rawKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string)?.trim() ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string)?.trim();

export const supabaseUrl = rawUrl && rawUrl.startsWith('http') ? rawUrl : DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = rawKey && rawKey.length > 5 ? rawKey : DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
