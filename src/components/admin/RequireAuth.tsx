"use client";

import type { ReactNode } from "react";
import { useAdminSession, signOut } from "@/lib/adminAuth";
import { LoginForm } from "./LoginForm";

export function RequireAuth({ children }: { children: (email: string | undefined) => ReactNode }) {
  const { configured, loading, session } = useAdminSession();

  if (!configured) {
    return (
      <div className="admin-auth-screen">
        <div className="admin-card">
          <h1 className="admin-title">Admin not configured</h1>
          <p className="admin-muted">
            This host is missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
            Set them, then reload this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-auth-screen">
        <p className="admin-muted" role="status">Loading…</p>
      </div>
    );
  }

  if (!session) return <LoginForm />;

  return (
    <>
      <div className="admin-topbar">
        <span className="admin-muted">{session.user.email}</span>
        <button className="admin-btn admin-btn-light" type="button" onClick={() => signOut()}>Sign out</button>
      </div>
      {children(session.user.email)}
    </>
  );
}
