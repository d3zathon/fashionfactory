import { Navbar } from "@/components/Navbar";

export default function Loading() {
  return (
    <main id="main" aria-live="polite" aria-busy="true">
      {/* Carrying the real header keeps the page from jumping when content lands. */}
      <Navbar tone="light" />
      <section className="route-state route-state-loading">
        <div className="container">
          <p className="eyebrow">Fashion Factory Nepal</p>
          <p>Loading…</p>
          <div className="route-state-bar" aria-hidden="true"><span /></div>
        </div>
      </section>
    </main>
  );
}
