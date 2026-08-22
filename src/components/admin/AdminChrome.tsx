"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { signOut } from "@/lib/adminAuth";
import { getStoreProfile } from "@/providers/static";

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
        <span className="admin-brand">
          <span>{getStoreProfile().name}</span>
          <strong>ADMIN</strong>
        </span>
        <div className="admin-topbar-right">
          {/* Quick way back to the live site — previously there was no exit. */}
          <Link className="admin-view-site" href="/" target="_blank" rel="noreferrer">
            View site <ArrowUpRight size={12} />
          </Link>
          <span className="admin-email">{email}</span>
          <button className="admin-btn admin-btn-light admin-btn-sm" type="button" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>
      <nav className="admin-nav" aria-label="Admin sections">
        {NAV.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "admin-nav-link admin-nav-active" : "admin-nav-link"}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
