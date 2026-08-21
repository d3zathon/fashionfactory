import type { Metadata } from "next";
import { getAdminIdentity } from "@/lib/supabase/server";
import { AdminChrome } from "@/components/admin/AdminChrome";
import "./admin.css";

export const metadata: Metadata = {
  title: "Fashion Factory Admin",
  robots: { index: false, follow: false },
};

// Never statically cache admin pages — they render per-session data.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Middleware already gates this subtree; this read is for chrome only.
  const identity = await getAdminIdentity().catch(() => null);

  return (
    <div className="admin-shell">
      {identity?.isAdmin && <AdminChrome email={identity.user.email ?? ""} />}
      {children}
    </div>
  );
}
