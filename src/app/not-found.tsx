import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileActionBar } from "@/components/MobileActionBar";

export default function NotFound() {
  return (
    <main id="main">
      {/* A 404 previously had no header or footer at all, leaving visitors with
          nowhere to go but the two buttons. */}
      <Navbar tone="light" />
      <section className="route-state route-state-error">
        <div className="container">
          <p className="eyebrow">Error 404</p>
          <h1>Page not found.</h1>
          <p>
            That page doesn&rsquo;t exist or is no longer available. The collection is
            still here, and the store is a message away.
          </p>
          <div className="route-state-actions">
            <Link className="btn btn-dark" href="/collection">Browse the collection <ArrowUpRight size={15} /></Link>
            <Link className="btn" href="/"><ArrowLeft size={15} /> Back home</Link>
          </div>
        </div>
      </section>
      <Footer />
      <MobileActionBar />
    </main>
  );
}
