import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export default function NotFound() {
  return (
    <main id="main" className="route-state route-state-error">
      <div className="container">
        <span className="eyebrow">Fashion Factory Nepal</span>
        <h1 className="serif">Page not found.</h1>
        <p>That page doesn&rsquo;t exist or is no longer available.</p>
        <div className="route-state-actions">
          <Link className="btn btn-dark" href="/">Back home <ArrowLeft size={16} /></Link>
          <Link className="btn btn-light" href="/collection">Browse collection <ArrowUpRight size={16} /></Link>
        </div>
      </div>
    </main>
  );
}
