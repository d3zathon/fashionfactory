"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listCategoryOptions,
  createProduct,
  deleteProductImages,
  getProduct,
  updateProduct,
  uploadProductImage,
  MAX_PRODUCT_IMAGES,
  type AdminProduct,
} from "@/providers/live/supabaseProducts";
import { getStoreProfile } from "@/providers/static";

// This deployment serves one store, so its currency is a build-time constant —
// the same reason the storefront reads the profile synchronously.
const CURRENCY = getStoreProfile().currency ?? "NPR";

/**
 * "M, L , , m, XL" -> ["M", "L", "XL"]
 *
 * Blank entries are dropped so a trailing comma is harmless, and repeats are
 * dropped case-insensitively because "M, m" would otherwise render as two
 * identical chips on the product page. The first spelling wins, so the owner's
 * capitalisation is what ships.
 */
function parseList(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => {
      if (!entry) return false;
      const key = entry.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

const formatList = (values: string[]) => values.join(", ");

/**
 * Price text -> what the database stores.
 *
 * Empty is not zero: it means the shop publishes no price for this item, which
 * is a normal state and the one every product starts in. Anything else has to
 * be a real non-negative number, so a typo is rejected at the form rather than
 * reaching the storefront as a price of NaN.
 */
function parsePrice(value: string): { price: number | null } | { error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { price: null };
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return { error: "Price must be a number, or left empty." };
  if (parsed < 0) return { error: "Price cannot be negative." };
  return { price: Math.round(parsed * 100) / 100 };
}

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
  // The ordered gallery. First entry is the one that shows on cards and in
  // search results, which is why the form lets it be reordered rather than
  // just added to.
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  // Held as the raw text the owner typed, not as arrays/numbers, so a
  // half-finished "S, M," or "24" never loses characters mid-keystroke.
  const [sizesText, setSizesText] = useState("");
  const [colorsText, setColorsText] = useState("");
  const [priceText, setPriceText] = useState("");
  const [featured, setFeatured] = useState(false);
  const [isVisible, setIsVisibleState] = useState(true);
  const existingProductRef = useRef<AdminProduct | null>(null);

  const savedImages = () => existingProductRef.current?.imageUrls ?? [];
  /** Uploaded during this session and not (yet) part of a saved product. */
  const isUnsaved = (url: string) => !savedImages().includes(url);

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
        setImageUrls(product.imageUrls);
        setSizesText(formatList(product.sizes));
        setColorsText(formatList(product.colors));
        setPriceText(product.price === null ? "" : String(product.price));
        setFeatured(product.featured);
        setIsVisibleState(product.isVisible);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : "Unable to load product."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [productId]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const room = MAX_PRODUCT_IMAGES - imageUrls.length;
    if (room <= 0) {
      setError(`A product can have up to ${MAX_PRODUCT_IMAGES} photos. Remove one before adding another.`);
      return;
    }

    setUploading(true);
    setError(null);
    // One at a time rather than in parallel: these are phone photos over a
    // Nepali mobile connection, and a serial queue keeps any single failure
    // from taking the whole batch down with it.
    try {
      for (const file of files.slice(0, room)) {
        const url = await uploadProductImage(file);
        setImageUrls((current) => [...current, url]);
      }
      if (files.length > room) {
        setError(`Only the first ${room} photo${room === 1 ? "" : "s"} were added — the limit is ${MAX_PRODUCT_IMAGES} per product.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  // Removing a photo that only exists because of this unsaved session deletes
  // the file immediately — nothing references it and nothing will. A photo the
  // saved product still points at is only removed from the list here; the file
  // goes after the row has been written, so cancelling leaves it intact.
  async function removeImage(url: string) {
    setImageUrls((current) => current.filter((entry) => entry !== url));
    if (isUnsaved(url)) {
      try {
        await deleteProductImages([url]);
      } catch {
        // Best effort — a stray file matters less than the form staying usable.
      }
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    setImageUrls((current) => {
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const price = parsePrice(priceText);
    if ("error" in price) {
      setError(price.error);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const input = {
        name,
        categoryId,
        description: description || null,
        imageUrls,
        price: price.price,
        sizes: parseList(sizesText),
        colors: parseList(colorsText),
        featured,
        isVisible,
      };
      const previousImages = savedImages();
      if (productId) await updateProduct(productId, input);
      else await createProduct(input);
      // Only now that the row points at the new gallery is it safe to remove
      // the files that dropped out of it.
      const orphaned = previousImages.filter((url) => !imageUrls.includes(url));
      if (orphaned.length > 0) await deleteProductImages(orphaned);
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  // Leaving without saving: discard anything uploaded during this session so it
  // doesn't sit in storage unreferenced. Saved photos are untouched.
  async function handleCancel() {
    const stranded = imageUrls.filter(isUnsaved);
    if (stranded.length > 0) {
      try {
        await deleteProductImages(stranded);
      } catch {
        // Best effort — navigating away matters more than a stray file.
      }
    }
    router.push("/admin/products");
  }

  if (loading) return <div className="admin-page"><p className="admin-muted" role="status">Loading…</p></div>;

  const full = imageUrls.length >= MAX_PRODUCT_IMAGES;

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

        <label className="admin-field">
          <span>Price in {CURRENCY} (optional)</span>
          <input
            value={priceText}
            onChange={(event) => setPriceText(event.target.value)}
            inputMode="decimal"
            placeholder="2500"
            autoComplete="off"
          />
        </label>
        <p className="admin-muted admin-field-hint">
          Leave empty and the product page shows no price, and customers ask on WhatsApp.
          Fill it in and the price appears on the card, on the product page and in the
          search-engine listing.
        </p>

        <label className="admin-field">
          <span>Sizes (optional, comma separated)</span>
          <input
            value={sizesText}
            onChange={(event) => setSizesText(event.target.value)}
            placeholder="EU 40, EU 41, EU 42 — or S, M, L"
            autoComplete="off"
          />
        </label>

        <label className="admin-field">
          <span>Colours (optional, comma separated)</span>
          <input
            value={colorsText}
            onChange={(event) => setColorsText(event.target.value)}
            placeholder="Black, Stone, Navy"
            autoComplete="off"
          />
        </label>

        <div className="admin-field">
          <span>Photos</span>
          {imageUrls.length > 0 && (
            <ul className="admin-gallery">
              {imageUrls.map((url, index) => (
                <li className="admin-gallery-item" key={url}>
                  <img className="admin-image-preview" src={url} alt={`Photo ${index + 1}`} />
                  <span className="admin-gallery-tag">{index === 0 ? "Main" : index + 1}</span>
                  <div className="admin-gallery-actions">
                    <button
                      className="admin-btn admin-btn-light"
                      type="button"
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0 || saving || uploading}
                      aria-label={`Move photo ${index + 1} earlier`}
                    >
                      ←
                    </button>
                    <button
                      className="admin-btn admin-btn-light"
                      type="button"
                      onClick={() => moveImage(index, 1)}
                      disabled={index === imageUrls.length - 1 || saving || uploading}
                      aria-label={`Move photo ${index + 1} later`}
                    >
                      →
                    </button>
                    <button
                      className="admin-btn admin-btn-light"
                      type="button"
                      onClick={() => removeImage(url)}
                      disabled={saving || uploading}
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleFileChange}
            disabled={uploading || full}
          />
          {uploading && <p className="admin-progress" role="status">Compressing and uploading…</p>}
        </div>
        <p className="admin-muted admin-field-hint">
          {full
            ? `That's the limit of ${MAX_PRODUCT_IMAGES} photos. Remove one to add another.`
            : `Up to ${MAX_PRODUCT_IMAGES}. The first is the main photo — it is what shows on cards, in search results and when the page is shared.`}
        </p>

        <label className="admin-toggle">
          <input type="checkbox" checked={isVisible} onChange={(event) => setIsVisibleState(event.target.checked)} />
          Visible on site
        </label>

        <label className="admin-toggle">
          <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
          Feature on the homepage
        </label>
        <p className="admin-muted admin-field-hint">
          Featured products fill the homepage&rsquo;s &ldquo;In the shop&rdquo; section. A hidden
          product never appears there, whether or not it is featured.
        </p>

        {error && <p className="admin-error" role="alert">{error}</p>}

        <div className="admin-form-actions">
          <button className="admin-btn admin-btn-dark" type="submit" disabled={saving || uploading}>{saving ? "Saving…" : "Save"}</button>
          <button className="admin-btn admin-btn-light" type="button" disabled={saving || uploading} onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
