"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileActionBar } from "@/components/MobileActionBar";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Storefront error", error);
  }, [error]);

  return (
    <main id="main">
      <Navbar tone="light" />
      <section className="route-state route-state-error">
        <div className="container">
          <p className="eyebrow">Something went wrong</p>
          <h1>We couldn&rsquo;t load this.</h1>
          <p>
            Try again — and if it keeps happening, message the shop on WhatsApp
            and we&rsquo;ll help you find the pair you&rsquo;re looking for.
          </p>
          <div className="route-state-actions">
            <button className="btn btn-dark" type="button" onClick={() => reset()}>
              <RotateCcw size={15} /> Try again
            </button>
            <Link className="btn" href="/collection">Browse the shop <ArrowUpRight size={15} /></Link>
          </div>
        </div>
      </section>
      <Footer />
      <MobileActionBar />
    </main>
  );
}
