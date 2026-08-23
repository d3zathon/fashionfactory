"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { deleteProduct, listProducts, listCategoryOptions, moveProduct, setVisible, type AdminProduct } from "@/providers/live/supabaseProducts";
import { matchesAllTerms, searchTerms } from "@/lib/productSearch";
import { PublishBar } from "./PublishBar";

export function ProductList() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  // Loaded rather than hardcoded, so a renamed category shows its current name.
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const categoryName = (categoryId: string) =>
    categories.find((option) => option.id === categoryId)?.name ?? categoryId;

  // Filters the rows already returned by listProducts(), which is scoped to
  // this deployment's store and further constrained by RLS. Searching is a
  // view over authorized data — it issues no query of its own, so it cannot
  // widen what this admin can see.
  const terms = useMemo(() => searchTerms(query), [query]);
  const searching = terms.length > 0;
  const shown = useMemo(
    () =>
      products.filter((product) =>
        matchesAllTerms(
          [product.name, product.slug, product.description],
          terms,
          [categoryName(product.categoryId)]
        )
      ),
    // categoryName closes over `categories`, which is why it is a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, terms, categories]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextProducts, nextCategories] = await Promise.all([listProducts(), listCategoryOptions()]);
      setProducts(nextProducts);
      setCategories(nextCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggleVisible(product: AdminProduct) {
    setBusyId(product.id);
    try {
      await setVisible(product.id, !product.isVisible);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update visibility.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(product: AdminProduct, direction: "up" | "down") {
    setBusyId(product.id);
    try {
      await moveProduct(products, product.id, direction);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reorder.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(product: AdminProduct) {
    setBusyId(product.id);
    try {
      await deleteProduct(product);
      setConfirmDeleteId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete product.");
    } finally {
      setBusyId(null);
    }
  }

  const latestUpdatedAt = products.reduce<string | null>((latest, product) => {
    if (!latest || new Date(product.updatedAt) > new Date(latest)) return product.updatedAt;
    return latest;
  }, null);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">Catalogue · {products.length} item{products.length === 1 ? "" : "s"}</p>
          <h1 className="admin-title">Products</h1>
        </div>
        <Link className="admin-btn admin-btn-dark" href="/admin/products/new">Add product</Link>
      </div>

      <PublishBar latestUpdatedAt={latestUpdatedAt} />

      {error && <p className="admin-error" role="alert">{error}</p>}

      {!loading && products.length > 0 && (
        <div className="admin-search">
          <label className="admin-field admin-search-field">
            <span>Find a product</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, slug, description or category"
              autoComplete="off"
            />
          </label>
          <p className="admin-search-count" role="status" aria-live="polite">
            {searching
              ? `${shown.length} of ${products.length} ${products.length === 1 ? "product" : "products"} match \u201C${query.trim()}\u201D`
              : `${products.length} ${products.length === 1 ? "product" : "products"}`}
            {searching && (
              <>
                {" "}
                <button className="admin-link-inline" type="button" onClick={() => setQuery("")}>
                  Clear search
                </button>
              </>
            )}
          </p>
        </div>
      )}

      {loading ? (
        <>
          <p className="admin-progress" role="status">Loading products…</p>
          <div className="admin-skeleton" aria-hidden="true" style={{ marginTop: 14 }}>
            {Array.from({ length: 4 }).map((_, i) => <div className="admin-skeleton-row" key={i} />)}
          </div>
        </>
      ) : products.length === 0 ? (
        <div className="admin-empty-state">
          <h2>No products yet</h2>
          <p>Add your first piece, then publish to push it to the live site.</p>
          <Link className="admin-btn admin-btn-dark" href="/admin/products/new">Add your first product</Link>
        </div>
      ) : shown.length === 0 ? (
        <div className="admin-empty-state">
          <h2>No matches</h2>
          <p>Nothing here matches &ldquo;{query.trim()}&rdquo;. Try fewer words, or clear the search.</p>
          <button className="admin-btn admin-btn-dark" type="button" onClick={() => setQuery("")}>Clear search</button>
        </div>
      ) : (
        <div className="admin-product-list">
          {shown.map((product) => {
            // Reordering is a property of the whole catalogue, so position and
            // the neighbour to swap with always come from the full list — never
            // from the filtered view, where "up" would jump over hidden rows.
            const index = products.findIndex((p) => p.id === product.id);
            return (
            <div className="admin-product-card" key={product.id}>
              {product.imageUrl ? (
                <img className="admin-product-thumb" src={product.imageUrl} alt="" />
              ) : (
                <div className="admin-product-thumb-empty">No photo</div>
              )}
              <div className="admin-product-info">
                <p>
                  {product.name}
                  {!product.isVisible && <span className="admin-badge">Hidden</span>}
                </p>
                <span>{String(index + 1).padStart(2, "0")} · {categoryName(product.categoryId)}</span>
                <label className="admin-toggle" style={{ marginTop: 6 }}>
                  <input type="checkbox" checked={product.isVisible} disabled={busyId === product.id} onChange={() => handleToggleVisible(product)} />
                  Visible on site
                </label>
              </div>
              <div className="admin-product-actions">
                {searching && (
                  <span className="admin-reorder-note">Clear the search to reorder</span>
                )}
                <div className="admin-product-row-actions">
                  <button className="admin-btn admin-btn-light admin-btn-sm admin-btn-icon" type="button" disabled={busyId === product.id || searching || index === 0} onClick={() => handleMove(product, "up")} aria-label={`Move ${product.name} up`}>↑</button>
                  <button className="admin-btn admin-btn-light admin-btn-sm admin-btn-icon" type="button" disabled={busyId === product.id || searching || index === products.length - 1} onClick={() => handleMove(product, "down")} aria-label={`Move ${product.name} down`}>↓</button>
                </div>
                <Link className="admin-btn admin-btn-light admin-btn-sm" href={`/admin/products/${product.id}`}>Edit</Link>
                <button className="admin-btn admin-btn-danger admin-btn-sm" type="button" onClick={() => setConfirmDeleteId(product.id)}>Delete</button>
              </div>
              {confirmDeleteId === product.id && (
                <div className="admin-confirm">
                  <span>Delete &ldquo;{product.name}&rdquo;? This can&rsquo;t be undone.</span>
                  <div className="admin-product-row-actions">
                    <button className="admin-btn admin-btn-danger admin-btn-sm" type="button" disabled={busyId === product.id} onClick={() => handleDelete(product)}>Confirm delete</button>
                    <button className="admin-btn admin-btn-light admin-btn-sm" type="button" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
