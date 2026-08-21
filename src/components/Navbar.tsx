"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import styles from "./Navbar.module.css";

interface NavbarProps {
  tone?: "dark" | "light";
}

export function Navbar({ tone = "dark" }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const className = tone === "light" ? `nav ${styles.light}` : "nav";

  // The mobile menu is a full-screen overlay. Without these three behaviours it
  // trapped users: no way out by keyboard, the page scrolled behind it, and
  // focus stayed on the page underneath.
  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      // Keep Tab inside the overlay while it is open.
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === toggleRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    // Move focus into the panel so a screen reader announces it.
    panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  function close() {
    setMenuOpen(false);
  }

  return (
    <header className={className}>
      <div className="container nav-inner">
        <Link href="/" className="brand" aria-label="Fashion Factory Nepal home" onClick={close}>
          <span>FASHION</span><strong>FACTORY</strong><small>NEPAL</small>
        </Link>
        <nav
          id="primary-navigation"
          ref={panelRef}
          className={menuOpen ? "nav-links open" : "nav-links"}
          aria-label="Primary navigation"
        >
          <Link href="/collection" onClick={close}>Collection</Link>
          <Link href="/#about" onClick={close}>About</Link>
          <Link href="/#instagram" onClick={close}>Instagram</Link>
          <Link href="/#visit-us" onClick={close}>Visit Us</Link>
          <Link href="/#contact" onClick={close}>Contact</Link>
          <Link className="nav-cta" href="/#visit-us" onClick={close}>Visit Store <ArrowUpRight size={16} /></Link>
        </nav>
        <button
          ref={toggleRef}
          className="menu"
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
