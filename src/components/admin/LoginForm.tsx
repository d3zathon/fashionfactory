"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/adminAuth";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const denied = params.get("denied") === "1";
  const next = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    // Full navigation so middleware re-evaluates with the new session cookie.
    router.replace(next && next.startsWith("/admin") ? next : "/admin");
    router.refresh();
  }

  return (
    <div className="admin-auth-screen">
      <form className="admin-card admin-login-form" onSubmit={handleSubmit}>
        <h1 className="admin-title">Fashion Factory Admin</h1>
        <p className="admin-muted">Sign in to manage the collection.</p>

        {denied && (
          <p className="admin-error" role="alert">
            That account isn&rsquo;t an admin for this store. Ask the owner to add it.
          </p>
        )}

        <label className="admin-field">
          <span>Email</span>
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="admin-field">
          <span>Password</span>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <p className="admin-error" role="alert">{error}</p>}

        <button className="admin-btn admin-btn-dark" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
