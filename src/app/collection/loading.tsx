export default function CollectionLoading() {
  return (
    <main className="route-state route-state-loading" aria-live="polite" aria-busy="true">
      <div className="container">
        <span className="eyebrow">Fashion Factory Nepal</span>
        <p className="serif">Loading the collection…</p>
      </div>
    </main>
  );
}
