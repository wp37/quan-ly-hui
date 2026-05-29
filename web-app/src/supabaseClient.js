import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are real (not placeholder or missing)
const isValidUrl = supabaseUrl && supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('your-project');
const isValidKey = supabaseAnonKey && supabaseAnonKey.startsWith('ey') && supabaseAnonKey.length > 30;

export const isSupabaseConfigured = isValidUrl && isValidKey;

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase chưa được cấu hình! Vui lòng thiết lập VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.'
  );
}

// Create client with safe fallback to prevent crash
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder');
