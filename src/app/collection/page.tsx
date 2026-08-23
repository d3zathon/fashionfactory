"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { Footer } from "@/components/Footer";
import { MobileActionBar } from "@/components/MobileActionBar";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { SearchField } from "@/components/SearchField";
import { useCategories, useProducts, useStoreSettings } from "@/hooks";
import { matchesAllTerms, searchTerms } from "@/lib/productSearch";

const ALL = "all";

function CollectionView() {
  const { data: products, loading: productsLoading, error: productsError } = useProducts();
  const { data: categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { data: store } = useStoreSettings();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Deep-linkable: /collection?c=mens arrives pre-filtered from the homepage
  // category index and from the style quiz result, and ?q= makes a search
  // result shareable. Both are read once for the initial state and then owned
  // by the component.
  const [active, setActive] = useState<string>(params.get("c") ?? ALL);
  const [query, setQuery] = useState<string>(params.get("q") ?? "");

  // Anything in the URL that is not ours — campaign tags, most commonly — is
  // captured once and carried through every rewrite below, so filtering does
  // not quietly strip the attribution a visitor arrived with. Read during the
  // first render, before any effect, so it is never lost to our own writes.
  const [carriedParams] = useState(() => {
    const extras = new URLSearchParams();
    params.forEach((value, key) => {
      if (key !== "c" && key !== "q") extras.append(key, value);
    });
    return extras.toString();
  });

  const urlFor = useCallback(
    (category: string, search: string) => {
      const next = new URLSearchParams(carriedParams);
      if (category !== ALL) next.set("c", category);
      if (search.trim()) next.set("q", search.trim());
      const queryString = next.toString();
      return queryString ? `${pathname}?${queryString}` : pathname;
    },
    [carriedParams, pathname]
  );

  // The last URL this component wrote, so its own writes echoing back through
  // useSearchParams are not mistaken for someone else changing the URL.
  const lastWrittenUrl = useRef<string | null>(null);

  // Mirror the controls back into the URL so the address bar is always a link
  // to what is on screen. replace(), not push(), because typing would otherwise
  // put one history entry behind every keystroke; scroll:false because this is
  // a filter, not a navigation.
  useEffect(() => {
    const url = urlFor(active, query);
    lastWrittenUrl.current = url;
    router.replace(url, { scroll: false });
  }, [active, query, urlFor, router]);

  // ...and adopt the URL when something else changes it. Next keeps this
  // component mounted when only the query string changes, so without this the
  // controls would keep their old values on Back/Forward, or when a link to
  // /collection?q=... is followed from the collection page itself — the screen
  // would then disagree with its own address bar.
  useEffect(() => {
    const incomingCategory = params.get("c") ?? ALL;
    const incomingQuery = params.get("q") ?? "";
    const incomingUrl = urlFor(incomingCategory, incomingQuery);
    if (incomingUrl === lastWrittenUrl.current) return;
    lastWrittenUrl.current = incomingUrl;
    setActive(incomingCategory);
    setQuery(incomingQuery);
  }, [params, urlFor]);

  const loading = productsLoading || categoriesLoading;
  const error = productsError || categoriesError;

  const activeCategory = categories.find((category) => category.slug === active);

  const categoryNameFor = useCallback(
    (categoryId: string) => categories.find((c) => c.id === categoryId)?.name,
    [categories]
  );

  const terms = useMemo(() => searchTerms(query), [query]);
  const searching = terms.length > 0;

  const inCategory = useMemo(
    () => (active === ALL || !activeCategory ? products : products.filter((p) => p.categoryId === activeCategory.id)),
    [products, active, activeCategory]
  );

  // Search runs over the category-filtered set, so the two controls compose:
  // a query narrows what the chips already selected. The category *name* is
  // searchable too, which is what makes "mens" find the right rail even when
  // no product text contains the word.
  const visible = useMemo(
    () =>
      inCategory.filter((product) =>
        matchesAllTerms(
          [product.name, product.description, product.slug],
          terms,
          [categoryNameFor(product.categoryId)]
        )
      ),
    [inCategory, terms, categoryNameFor]
  );

  // Chip counts reflect the current search, so a chip never promises results
  // the query has already excluded.
  const countFor = (slug: string) => {
    const pool =
      slug === ALL
        ? products
        : (() => {
            const category = categories.find((c) => c.slug === slug);
            return category ? products.filter((p) => p.categoryId === category.id) : [];
          })();
    if (!searching) return pool.length;
    return pool.filter((product) =>
      matchesAllTerms(
        [product.name, product.description, product.slug],
        terms,
        [categoryNameFor(product.categoryId)]
      )
    ).length;
  };

  const filtersApplied = searching || active !== ALL;

  function clearAll() {
    setQuery("");
    setActive(ALL);
    searchInputRef.current?.focus();
  }

  // "3 pieces matching "denim" in Men's." — one sentence that always says what
  // was searched and where, so the number is never ambiguous.
  const resultSummary = `${visible.length} ${visible.length === 1 ? "piece" : "pieces"}${
    searching ? ` matching \u201C${query.trim()}\u201D` : ""
  }${activeCategory ? ` in ${activeCategory.name}` : ""}.`;

  return (
    <main id="main" className="collection-page">
      <Navbar tone="light" />

      <header className="collection-hero">
        <div className="container">
          <Link href="/" className="back"><ArrowLeft size={14} /> Home</Link>
          <div className="head-meta" style={{ marginTop: 26 }}>
            <span className="idx">{String(products.length).padStart(2, "0")}</span>
            <p className="eyebrow">The collection</p>
          </div>
          <h1>{activeCategory ? activeCategory.name : "Everything in store."}</h1>
          <p className="collection-intro">
            {activeCategory?.description ??
              "Browse the full catalogue, then message the store to check what's on the rail today."}
          </p>
        </div>
      </header>

      {/* Sticky filter rail — real filtering, replacing the old anchor jumps. */}
      <div className="filter-bar">
        <div className="container">
          <SearchField
            id="collection-search"
            label="Search the collection"
            placeholder="Try a name, colour or category"
            value={query}
            onChange={setQuery}
            inputRef={searchInputRef}
            trailing={
              query ? (
                <button
                  className="collection-search-clear"
                  type="button"
                  onClick={() => { setQuery(""); searchInputRef.current?.focus(); }}
                  aria-label="Clear search"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              ) : null
            }
          />

          <div className="filter-row" role="group" aria-label="Filter by category">
            <button className="filter-chip" type="button" aria-pressed={active === ALL} onClick={() => setActive(ALL)}>
              All <span className="idx">{countFor(ALL)}</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className="filter-chip"
                type="button"
                aria-pressed={active === category.slug}
                onClick={() => setActive(category.slug)}
              >
                {category.name} <span className="idx">{countFor(category.slug)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        {loading ? (
          <>
            <p className="filter-count" role="status">Loading the collection…</p>
            <div className="skeleton-grid" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => <div className="skeleton-card" key={i} />)}
            </div>
          </>
        ) : error ? (
          <div className="state-block state-error" role="alert">
            We couldn&rsquo;t load the collection right now. Please refresh, or message the store on WhatsApp.
          </div>
        ) : (
          <>
            <p className="filter-count" role="status" aria-live="polite">
              {resultSummary}
              {filtersApplied && (
                <>
                  {" "}
                  <button className="link-inline" type="button" onClick={clearAll}>
                    Clear search and filters
                  </button>
                </>
              )}
            </p>

            {visible.length > 0 ? (
              <div className="product-grid">
                {visible.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                    categoryName={categories.find((c) => c.id === product.categoryId)?.name}
                    whatsappNumber={store?.whatsappNumber}
                    priority={i < 4}
                  />
                ))}
              </div>
            ) : (
              <div className="state-block collection-empty">
                <p className="collection-empty-title">
                  {searching ? (
                    <>No pieces match &ldquo;{query.trim()}&rdquo;{activeCategory ? ` in ${activeCategory.name}` : ""}.</>
                  ) : (
                    <>Nothing in {activeCategory ? activeCategory.name : "the collection"} yet.</>
                  )}
                </p>
                <p className="collection-empty-body">
                  {searching
                    ? "Try fewer words, or a different category — and the store can check the rail for you on WhatsApp."
                    : "Message the store on WhatsApp and they'll tell you what's on the rail today."}
                </p>
                <div className="collection-empty-actions">
                  {filtersApplied && (
                    <button className="btn btn-dark" type="button" onClick={clearAll}>
                      Clear search and filters
                    </button>
                  )}
                  {searching && activeCategory && (
                    <button className="btn" type="button" onClick={() => setActive(ALL)}>
                      Search all categories
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
      <MobileActionBar />
    </main>
  );
}

// useSearchParams needs a Suspense boundary during prerender.
export default function CollectionPage() {
  return (
    <Suspense
      fallback={
        <main id="main" className="collection-page">
          <div className="container" style={{ paddingTop: 160 }}>
            <p className="eyebrow" role="status">Loading the collection…</p>
          </div>
        </main>
      }
    >
      <CollectionView />
    </Suspense>
  );
}
