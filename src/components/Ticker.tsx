"use client";

/**
 * Editorial marquee strip. The track holds the item list twice and translates
 * exactly -50%, so the loop is seamless. Pauses on hover, and the CSS
 * reduced-motion block stops the animation outright — the text stays readable
 * either way because it is duplicated, not scrolled out of existence.
 */
export function Ticker({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  const group = (
    <div className="ticker-group" aria-hidden="true">
      {items.map((item, i) => (
        <span className="ticker-item" key={`${item}-${i}`}>{item}</span>
      ))}
    </div>
  );

  return (
    <div className="ticker">
      {/* The visible track is decorative; one readable copy is exposed to AT. */}
      <p className="sr-only">{items.join(". ")}</p>
      <div className="ticker-track">
        {group}
        {group}
      </div>
    </div>
  );
}
