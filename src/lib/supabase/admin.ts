import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

/**
 * Admin Supabase Client (Service Role)
 * STRICTLY SERVER-SIDE ONLY!
 *
 * Never export or import this into any client-side components.
 * Bypasses RLS for maintenance, system triggers, automated moderation jobs, and background workers.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL or SUPABASE_SERVICE_ROLE_KEY is missing in server environment.');
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
