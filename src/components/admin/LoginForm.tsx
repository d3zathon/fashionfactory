"use client";

import { useState } from "react";
import { signIn } from "@/lib/adminAuth";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  return (
    <div className="admin-auth-screen">
      <form className="admin-card admin-login-form" onSubmit={handleSubmit}>
        <h1 className="admin-title">Fashion Factory Admin</h1>
        <p className="admin-muted">Sign in to manage the collection.</p>
        <label className="admin-field">
          <span>Email</span>
          <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="admin-field">
          <span>Password</span>
          <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button className="admin-btn admin-btn-dark" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
