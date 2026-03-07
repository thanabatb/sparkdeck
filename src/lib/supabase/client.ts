import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseAdminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (supabaseAdminClient) {
    return supabaseAdminClient;
  }

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Missing required environment variable: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)."
    );
  }

  if (!key) {
    throw new Error(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)."
    );
  }

  supabaseAdminClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseAdminClient;
}
