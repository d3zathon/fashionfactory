export default function ProductLoading() {
  return (
    <main id="main" className="route-state route-state-loading" aria-live="polite" aria-busy="true">
      <div className="container">
        <span className="eyebrow">Fashion Factory Nepal</span>
        <p className="serif">Loading product…</p>
      </div>
    </main>
  );
}
