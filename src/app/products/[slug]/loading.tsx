import { Navbar } from "@/components/Navbar";

export default function ProductLoading() {
  return (
    <main id="main" aria-live="polite" aria-busy="true">
      <Navbar tone="light" />
      <section className="route-state route-state-loading">
        <div className="container">
          <p className="eyebrow">Fashion Factory Nepal</p>
          <p>Loading the piece…</p>
          <div className="route-state-bar" aria-hidden="true"><span /></div>
        </div>
      </section>
    </main>
  );
}
