"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Fashion Factory frontend error", error);
  }, [error]);

  return (
    <main className="route-state route-state-error">
      <div className="container">
        <span className="eyebrow">Fashion Factory Nepal</span>
        <h1 className="serif">Something went wrong.</h1>
        <p>We couldn't load this page right now. Please try again.</p>
        <button className="btn btn-dark" type="button" onClick={() => reset()}>Try again</button>
      </div>
    </main>
  );
}
