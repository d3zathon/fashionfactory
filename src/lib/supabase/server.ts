import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ACTIVE_STORE_SLUG } from "@/lib/activeStore";

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    }
  );
}

export interface AdminIdentity {
  user: User;
  isAdmin: boolean;
}

// The single server-side authorization check. Always uses getUser() (which
// revalidates the token with Supabase) rather than getSession(), whose cookie
// payload is not trustworthy on its own. Admin status comes from the
// admin_users table under RLS — never from anything the client can set.
export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) return null;

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  return { user: userData.user, isAdmin: Boolean(adminRow) };
}

export async function requireAdmin(): Promise<AdminIdentity | null> {
  const identity = await getAdminIdentity();
  return identity?.isAdmin ? identity : null;
}

/** Why a store-scoped authorization check failed, so callers can say something useful. */
export type StoreAdminDenial = "unconfigured" | "unauthenticated" | "not-store-admin" | "check-unavailable";

export type StoreAdminResult =
  | { ok: true; user: User }
  | { ok: false; reason: StoreAdminDenial; detail?: string };

/**
 * Authorization for actions that belong to one specific store.
 *
 * requireAdmin() only answers "is this person an admin of *something*", which is
 * not enough for anything that acts on a named store: an admin of store B would
 * otherwise be able to trigger store A's publish. The decision is delegated to
 * public.admin_manages_store() so the rule has exactly one definition — the
 * same private.can_manage_store_slug() the RLS policies call — instead of a
 * second copy here that can drift.
 *
 * Fails closed. If the function is missing (migrations not applied yet) the
 * answer is "no", with a distinguishable reason so the UI can say why.
 */
export async function requireStoreAdmin(storeSlug: string = ACTIVE_STORE_SLUG): Promise<StoreAdminResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, reason: "unconfigured" };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { ok: false, reason: "unauthenticated" };

  const { data, error } = await supabase.rpc("admin_manages_store", { store_slug: storeSlug });
  if (error) {
    return { ok: false, reason: "check-unavailable", detail: error.message };
  }
  if (data !== true) return { ok: false, reason: "not-store-admin" };

  return { ok: true, user: userData.user };
}
