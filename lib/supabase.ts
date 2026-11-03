import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";

let client: SupabaseClient<Database> | null = null;

/** Server-only Supabase client using the secret key. Never import from client code. */
export function supabaseAdmin(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(env.supabaseUrl, env.supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}
