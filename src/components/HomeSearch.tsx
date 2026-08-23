"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SearchField } from "@/components/SearchField";
import { AnalyticsService } from "@/services";

/**
 * Homepage search. Hands the query to /collection rather than filtering here.
 *
 * The collection page already owns product search — the URL is the handoff, so
 * there is exactly one implementation of matching and one set of results copy.
 * That also makes what the visitor typed a shareable link from the first
 * keystroke they submit.
 *
 * push(), not replace(): arriving at the collection is a navigation the visitor
 * should be able to reverse with Back.
 */
export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();

    // Built with URLSearchParams so the query is encoded properly, and so any
    // future parameter can be added here without hand-splicing strings.
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    const search = params.toString();

    AnalyticsService.track("home_search_submit", { query: trimmed });
    // An empty submit is not an error — it is "show me everything", which is
    // exactly what /collection with no parameters is.
    router.push(search ? `/collection?${search}` : "/collection");
  }

  return (
    <form className="home-search" onSubmit={handleSubmit} role="search">
      <SearchField
        id="home-search"
        label="Search the collection"
        placeholder="Try a name, colour or category"
        value={query}
        onChange={setQuery}
        trailing={
          <button className="home-search-submit" type="submit" aria-label="Search">
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        }
      />
    </form>
  );
}
