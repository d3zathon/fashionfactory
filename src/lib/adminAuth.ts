"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase/client";

export interface AdminSessionState {
  configured: boolean;
  loading: boolean;
  session: Session | null;
}

export function useAdminSession(): AdminSessionState {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;
    const client = getSupabaseClient();
    if (!client) return;

    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: subscription } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [configured]);

  return { configured, loading, session };
}

export async function signIn(email: string, password: string): Promise<{ error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { error: "Supabase is not configured on this host yet." };
  const { error } = await client.auth.signInWithPassword({ email, password });
  return error ? { error: error.message } : {};
}

export async function signOut(): Promise<void> {
  const client = getSupabaseClient();
  if (client) await client.auth.signOut();
}
