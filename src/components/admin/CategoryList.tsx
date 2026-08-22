"use client";

import { useCallback, useEffect, useState } from "react";
import {
  countProductsByCategory,
  listCategories,
  moveCategory,
  updateCategory,
  type AdminCategory,
} from "@/providers/live/supabaseStore";

export function CategoryList() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, productCounts] = await Promise.all([listCategories(), countProductsByCategory()]);
      setCategories(list);
      setCounts(productCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function run(id: string, action: () => Promise<void>) {
    setBusyId(id);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="admin-page"><p className="admin-muted" role="status">Loading categories…</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-head"><h1 className="admin-title">Categories</h1></div>
      <p className="admin-muted">
        The five fixed categories the storefront is built around. You can rename them,
        edit descriptions, reorder them, and hide ones you aren&rsquo;t using.
        Ids and slugs are locked because products reference them and they appear in live URLs.
      </p>

      {error && <p className="admin-error" role="alert">{error}</p>}

      <div className="admin-product-list">
        {categories.map((category, index) => {
          const count = counts[category.id] ?? 0;
          const isEditing = editing === category.id;
          return (
            <div className="admin-product-card admin-category-card" key={category.id}>
              <div className="admin-product-info">
                {isEditing ? (
                  <CategoryEditor
                    category={category}
                    busy={busyId === category.id}
                    onCancel={() => setEditing(null)}
                    onSave={(input) => run(category.id, async () => {
                      await updateCategory(category.id, input);
                      setEditing(null);
                    })}
                  />
                ) : (
                  <>
                    <p>{category.name} {!category.active && <span className="admin-badge">Hidden</span>}</p>
                    <span>{category.description || "No description"}</span>
                    <span className="admin-muted">
                      /collection#{category.slug} · {count} product{count === 1 ? "" : "s"}
                    </span>
                  </>
                )}
              </div>
              {!isEditing && (
                <div className="admin-product-actions">
                  <div className="admin-product-row-actions">
                    <button className="admin-btn admin-btn-light admin-btn-sm" type="button" aria-label={`Move ${category.name} up`}
                      disabled={busyId === category.id || index === 0}
                      onClick={() => run(category.id, () => moveCategory(categories, category.id, "up"))}>↑</button>
                    <button className="admin-btn admin-btn-light admin-btn-sm" type="button" aria-label={`Move ${category.name} down`}
                      disabled={busyId === category.id || index === categories.length - 1}
                      onClick={() => run(category.id, () => moveCategory(categories, category.id, "down"))}>↓</button>
                  </div>
                  <button className="admin-btn admin-btn-light admin-btn-sm" type="button" onClick={() => setEditing(category.id)}>Edit</button>
                </div>
              )}
              {!isEditing && category.active && count > 0 && (
                <p className="admin-muted admin-category-note">
                  Hiding this category also hides its {count} product{count === 1 ? "" : "s"} from the collection page.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryEditor({
  category, busy, onSave, onCancel,
}: {
  category: AdminCategory;
  busy: boolean;
  onSave: (input: { name: string; description: string | null; active: boolean }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [active, setActive] = useState(category.active);

  return (
    <div className="admin-inline-form">
      <label className="admin-field"><span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </label>
      <label className="admin-field"><span>Description</span>
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="admin-toggle">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Show on the site
      </label>
      <div className="admin-product-row-actions">
        <button className="admin-btn admin-btn-dark admin-btn-sm" type="button" disabled={busy || name.trim().length < 2}
          onClick={() => onSave({ name: name.trim(), description: description.trim() || null, active })}>
          {busy ? "Saving…" : "Save"}
        </button>
        <button className="admin-btn admin-btn-light admin-btn-sm" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
