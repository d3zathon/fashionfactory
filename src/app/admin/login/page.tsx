"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="admin-auth-screen">
        <div className="admin-card">
          <h1 className="admin-title">Admin not configured</h1>
          <p className="admin-muted">
            This host is missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
            Note these are inlined at build time, so redeploy after setting them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="admin-auth-screen"><p className="admin-muted">Loading…</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
