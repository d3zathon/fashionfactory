"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listCategoryOptions,
  createProduct,
  deleteProductImage,
  getProduct,
  updateProduct,
  uploadProductImage,
  type AdminProduct,
} from "@/providers/live/supabaseProducts";

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(productId);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<{ id: string; name: string }[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isVisible, setIsVisibleState] = useState(true);
  const existingProductRef = useRef<AdminProduct | null>(null);

  // Categories are a table, not a constant, so the choices load with the form.
  // A new product defaults to the first category once they arrive.
  useEffect(() => {
    let active = true;
    listCategoryOptions()
      .then((options) => {
        if (!active) return;
        setCategoryOptions(options);
        setCategoryId((current) => current || options[0]?.id || "");
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : "Unable to load categories."));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!productId) return;
    let active = true;
    getProduct(productId)
      .then((product) => {
        if (!active || !product) return;
        existingProductRef.current = product;
        setName(product.name);
        setCategoryId(product.categoryId);
        setDescription(product.description ?? "");
        setImageUrl(product.imageUrl);
        setIsVisibleState(product.isVisible);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : "Unable to load product."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [productId]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadProductImage(file);
      // If this replaces an image uploaded earlier in this same unsaved session,
      // that one was never referenced by a saved row — drop it now rather than
      // leaving it orphaned in storage.
      const superseded = imageUrl;
      setImageUrl(url);
      if (superseded && superseded !== existingProductRef.current?.imageUrl) {
        await deleteProductImage(superseded);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const input = { name, categoryId, description: description || null, imageUrl, isVisible };
      const previousImageUrl = existingProductRef.current?.imageUrl ?? null;
      if (productId) await updateProduct(productId, input);
      else await createProduct(input);
      // Only now that the row points at the new file is it safe to remove the old one.
      if (previousImageUrl && previousImageUrl !== imageUrl) {
        await deleteProductImage(previousImageUrl);
      }
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  // Leaving without saving: discard an image uploaded during this session so it
  // doesn't sit in storage unreferenced. The previously saved image is untouched.
  async function handleCancel() {
    const saved = existingProductRef.current?.imageUrl ?? null;
    if (imageUrl && imageUrl !== saved) {
      try {
        await deleteProductImage(imageUrl);
      } catch {
        // Best effort — navigating away matters more than a stray file.
      }
    }
    router.push("/admin/products");
  }

  if (loading) return <div className="admin-page"><p className="admin-muted" role="status">Loading…</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1 className="admin-title">{isEdit ? "Edit product" : "Add product"}</h1>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <label className="admin-field">
          <span>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
        </label>

        <label className="admin-field">
          <span>Category</span>
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            {categoryOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
        </label>

        <label className="admin-field">
          <span>Description (optional)</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>

        <div className="admin-upload-row">
          {imageUrl && <img className="admin-image-preview" src={imageUrl} alt="Product preview" />}
          <label className="admin-field">
            <span>Photo</span>
            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} disabled={uploading} />
          </label>
          {uploading && <p className="admin-progress" role="status">Compressing and uploading…</p>}
        </div>

        <label className="admin-toggle">
          <input type="checkbox" checked={isVisible} onChange={(event) => setIsVisibleState(event.target.checked)} />
          Visible on site
        </label>

        {error && <p className="admin-error" role="alert">{error}</p>}

        <div className="admin-form-actions">
          <button className="admin-btn admin-btn-dark" type="submit" disabled={saving || uploading}>{saving ? "Saving…" : "Save"}</button>
          <button className="admin-btn admin-btn-light" type="button" disabled={saving || uploading} onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
