import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
try {
  new URL(supabaseUrl);
} catch (e) {
  supabaseUrl = 'https://mock.supabase.co';
}
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
