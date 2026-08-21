"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/admin/RequireAuth";

// Signed in: send the owner straight to the product list. Signed out (or not
// configured), RequireAuth renders the login screen instead and this never runs.
function RedirectToProducts() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/products"); }, [router]);
  return <div className="admin-page"><p className="admin-muted" role="status">Loading…</p></div>;
}

export default function AdminIndexPage() {
  return <RequireAuth>{() => <RedirectToProducts />}</RequireAuth>;
}
