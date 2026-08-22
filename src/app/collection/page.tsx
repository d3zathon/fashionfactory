"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";
import { MobileActionBar } from "@/components/MobileActionBar";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { useCategories, useProducts, useStoreSettings } from "@/hooks";

const ALL = "all";

function CollectionView() {
  const { data: products, loading: productsLoading, error: productsError } = useProducts();
  const { data: categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { data: store } = useStoreSettings();
  const params = useSearchParams();

  // Deep-linkable: /collection?c=mens arrives pre-filtered from the homepage
  // category index and from the style quiz result.
  const [active, setActive] = useState<string>(params.get("c") ?? ALL);

  const loading = productsLoading || categoriesLoading;
  const error = productsError || categoriesError;

  const activeCategory = categories.find((category) => category.slug === active);
  const visible = useMemo(
    () => (active === ALL || !activeCategory ? products : products.filter((p) => p.categoryId === activeCategory.id)),
    [products, active, activeCategory]
  );

  const countFor = (slug: string) => {
    if (slug === ALL) return products.length;
    const category = categories.find((c) => c.slug === slug);
    return category ? products.filter((p) => p.categoryId === category.id).length : 0;
  };

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
              {visible.length} {visible.length === 1 ? "piece" : "pieces"}
              {activeCategory ? ` in ${activeCategory.name}` : ""}
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
              <div className="state-block">
                Nothing in this category yet.{" "}
                <button className="link-inline" type="button" onClick={() => setActive(ALL)}>
                  View everything instead
                </button>.
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
