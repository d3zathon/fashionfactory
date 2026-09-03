import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./config";

let client: SupabaseClient | null = null;

export { isSupabaseConfigured };

// Cookie-backed session (not localStorage) so middleware and server routes can
// see the session too — that's what makes real server-side authorization possible.
// Returns null when this host has no Supabase config yet.
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (client) return client;
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return client;
}
