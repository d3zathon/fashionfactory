"use client";

import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useStoreSettings } from "@/hooks";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  useStoreSettings();

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand" aria-label="Fashion Factory Nepal home" onClick={() => setMenuOpen(false)}>
          <span>FASHION</span><strong>FACTORY</strong><small>NEPAL</small>
        </Link>
        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Primary navigation">
          <Link href="/collection" onClick={() => setMenuOpen(false)}>Collection</Link>
          <Link href="/#about" onClick={() => setMenuOpen(false)}>About</Link>
          <Link href="/#instagram" onClick={() => setMenuOpen(false)}>Instagram</Link>
          <Link href="/#visit-us" onClick={() => setMenuOpen(false)}>Visit Us</Link>
          <Link href="/#contact" onClick={() => setMenuOpen(false)}>Contact</Link>
          <Link className="nav-cta" href="/#visit-us" onClick={() => setMenuOpen(false)}>Visit Store <ArrowUpRight size={16} /></Link>
        </nav>
        <button className="menu" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
