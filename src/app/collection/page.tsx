"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { MobileActionBar } from "@/components/MobileActionBar";
import { Navbar } from "@/components/Navbar";
import { useCategories, useProducts, useStoreSettings } from "@/hooks";
import { AnalyticsService } from "@/services";

export default function CollectionPage() {
  const { data: products, loading: productsLoading, error: productsError } = useProducts();
  const { data: categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { data: store } = useStoreSettings();

  const loading = productsLoading || categoriesLoading;
  const error = productsError || categoriesError;
  const whatsappBase = store?.whatsappNumber ?? "9779864831830";

  return (
    <main className="collection-page">
      <Navbar tone="light" />
      <div className="container collection-top">
        <Link href="/" className="back"><ArrowLeft size={16} /> Home</Link>
        <p className="eyebrow">Fashion Factory Nepal</p>
        <h1 className="serif">The Collection.</h1>
        <p className="muted">Browse the current development catalogue. Product inventory and pricing can be connected to the backend later.</p>
      </div>

      {loading ? (
        <div className="container state-block" role="status">Loading the collection…</div>
      ) : error ? (
        <div className="container state-block state-error" role="alert">We couldn't load the collection right now. Please try again.</div>
      ) : (
        <>
          <div className="container filter-row" aria-label="Collection categories">
            {categories.map((category) => <a key={category.id} href={`#${category.slug}`}>{category.name}</a>)}
          </div>

          <div className="container collection-list">
            {categories.map((category) => {
              const categoryProducts = products.filter((product) => product.categoryId === category.id);
              return (
                <section id={category.slug} key={category.id}>
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Collection</p>
                      <h2 className="section-title">{category.name}</h2>
                      {category.description && <p className="muted category-description">{category.description}</p>}
                    </div>
                  </div>

                  {categoryProducts.length ? (
                    <div className="collection-products">
                      {categoryProducts.map((product) => {
                        const message = `Hi Fashion Factory, I would like to ask about ${product.name}. Is it currently available?`;
                        return (
                          <article key={product.id}>
                            <Link href={`/products/${product.slug}`} onClick={() => AnalyticsService.track("product_click", { product: product.id })}>
                              <img src={product.images[0]?.src} alt={product.images[0]?.alt ?? product.name} loading="lazy" />
                            </Link>
                            <div>
                              <p>{product.name}</p>
                              <span>{product.description}</span>
                              <div className="collection-product-actions">
                                <Link href={`/products/${product.slug}`} onClick={() => AnalyticsService.track("product_click", { product: product.id })}>View product <ArrowUpRight size={14} /></Link>
                                <a href={`https://wa.me/${whatsappBase}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" onClick={() => AnalyticsService.track("whatsapp_click", { product: product.id })}>Ask availability <ArrowUpRight size={14} /></a>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="state-block state-compact">No products are available in this category yet.</div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
      <Footer />
      <MobileActionBar />
    </main>
  );
}
