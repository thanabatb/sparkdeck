import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseAdminClient: SupabaseClient | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function assertServiceRoleKey(key: string): void {
  if (key.startsWith("sb_secret_")) {
    return;
  }

  const segments = key.split(".");

  if (segments.length < 2 || !key.startsWith("eyJ")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY looks invalid. Use Supabase service role key or secret key."
    );
  }

  try {
    const payloadJson = Buffer.from(segments[1], "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson) as { role?: string };

    if (payload.role !== "service_role") {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY must be a service role key (role=service_role)."
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("SUPABASE_SERVICE_ROLE_KEY could not be parsed.");
  }
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (supabaseAdminClient) {
    return supabaseAdminClient;
  }

  const url = process.env.SUPABASE_URL?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  assertServiceRoleKey(key);

  if (!url) {
    throw new Error("Missing required environment variable: SUPABASE_URL");
  }

  supabaseAdminClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseAdminClient;
}
