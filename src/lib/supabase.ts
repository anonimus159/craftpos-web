import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
try {
  new URL(supabaseUrl);
} catch (e) {
  supabaseUrl = 'https://mock.supabase.co';
}
// Usamos la Service Role Key para tener permisos de escritura (bypass RLS).
// ADVERTENCIA: Este cliente supabaseAdmin SOLO debe usarse en el servidor (API routes de Next.js), NUNCA en componentes cliente.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock_key';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
