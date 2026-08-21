"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/adminAuth";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminChrome({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="admin-chrome">
      <div className="admin-topbar">
        <span className="admin-brand">Fashion Factory</span>
        <div className="admin-topbar-right">
          <span className="admin-muted admin-email">{email}</span>
          <button className="admin-btn admin-btn-light admin-btn-sm" type="button" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>
      <nav className="admin-nav" aria-label="Admin sections">
        {NAV.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={active ? "admin-nav-link admin-nav-active" : "admin-nav-link"} aria-current={active ? "page" : undefined}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
