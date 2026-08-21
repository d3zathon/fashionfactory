import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";

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
