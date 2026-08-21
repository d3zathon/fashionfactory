"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORY_OPTIONS, deleteProduct, listProducts, moveProduct, setVisible, type AdminProduct } from "@/providers/live/supabaseProducts";
import { PublishBar } from "./PublishBar";

function categoryName(categoryId: string): string {
  return CATEGORY_OPTIONS.find((option) => option.id === categoryId)?.name ?? categoryId;
}

export function ProductList() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await listProducts());
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
        <h1 className="admin-title">Products</h1>
        <Link className="admin-btn admin-btn-dark" href="/admin/products/new">Add product</Link>
      </div>

      <PublishBar latestUpdatedAt={latestUpdatedAt} />

      {error && <p className="admin-error" role="alert">{error}</p>}

      {loading ? (
        <p className="admin-muted" role="status">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="admin-empty">No products yet. Add your first one.</p>
      ) : (
        <div className="admin-product-list">
          {products.map((product, index) => (
            <div className="admin-product-card" key={product.id}>
              {product.imageUrl ? (
                <img className="admin-product-thumb" src={product.imageUrl} alt="" />
              ) : (
                <div className="admin-product-thumb-empty">No photo</div>
              )}
              <div className="admin-product-info">
                <p>{product.name}</p>
                <span>{categoryName(product.categoryId)}</span>
                <label className="admin-toggle">
                  <input type="checkbox" checked={product.isVisible} disabled={busyId === product.id} onChange={() => handleToggleVisible(product)} />
                  Visible on site
                </label>
              </div>
              <div className="admin-product-actions">
                <div className="admin-product-row-actions">
                  <button className="admin-btn admin-btn-light admin-btn-sm" type="button" disabled={busyId === product.id || index === 0} onClick={() => handleMove(product, "up")} aria-label="Move up">↑</button>
                  <button className="admin-btn admin-btn-light admin-btn-sm" type="button" disabled={busyId === product.id || index === products.length - 1} onClick={() => handleMove(product, "down")} aria-label="Move down">↓</button>
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
          ))}
        </div>
      )}
    </div>
  );
}
