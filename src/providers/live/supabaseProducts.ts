import { getSupabaseClient } from "@/lib/supabase/client";
import { compressImageToWebp } from "@/lib/imageCompression";
import { ACTIVE_STORE_SLUG, getActiveStoreId, listCategories } from "./supabaseStore";

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string | null;
  /** The first entry of `imageUrls`, mirrored for readers that predate the gallery. */
  imageUrl: string | null;
  /** The ordered gallery. Empty means the product has no photos yet. */
  imageUrls: string[];
  /** NULL in the database — the shop publishes no price for this item. */
  price: number | null;
  /** Empty array means the column is NULL — the owner never specified any. */
  sizes: string[];
  colors: string[];
  featured: boolean;
  sortOrder: number;
  isVisible: boolean;
  updatedAt: string;
}

/** Beyond this a product page stops being a gallery and starts being a scroll. */
export const MAX_PRODUCT_IMAGES = 6;

/**
 * Category choices for the product form, read from the categories table.
 *
 * This used to be a hardcoded list of five, which drifted the moment an owner
 * renamed a category in /admin/categories — and hid any category added since.
 */
export async function listCategoryOptions(): Promise<{ id: string; name: string }[]> {
  const categories = await listCategories();
  return categories.filter((category) => category.active).map(({ id, name }) => ({ id, name }));
}

const STORAGE_BUCKET = "product-images";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
}

function fromRow(row: Record<string, unknown>): AdminProduct {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    categoryId: row.category_id as string,
    description: (row.description as string) ?? null,
    imageUrl: (row.image_url as string) ?? null,
    // Falls back to the single legacy URL so a row written before 0008 — or by
    // anything that only knows about image_url — still reads as a gallery of one.
    imageUrls: (row.image_urls as string[]) ?? ((row.image_url as string) ? [row.image_url as string] : []),
    // numeric arrives as a string over the wire; Number() here keeps the rest
    // of the app dealing in numbers. NULL stays null rather than becoming 0,
    // which would publish a price of nothing.
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    // NULL and [] both surface as an empty array here; the difference only
    // matters to the database, and toColumn() below restores it on write.
    sizes: (row.sizes as string[]) ?? [],
    colors: (row.colors as string[]) ?? [],
    featured: (row.featured as boolean) ?? false,
    sortOrder: row.sort_order as number,
    isVisible: row.is_visible as boolean,
    updatedAt: row.updated_at as string,
  };
}

/**
 * An empty list is stored as NULL, not as an empty array.
 *
 * "Never specified" and "specified as nothing" are the same thing for a shop,
 * and collapsing them keeps one representation in the column rather than two
 * that render identically.
 */
function toColumn(values: string[] | undefined): string[] | null {
  return values && values.length > 0 ? values : null;
}

/**
 * PostgREST answers PGRST204 — "Could not find the 'x' column of 'products' in
 * the schema cache" — when a write names a column the database does not have.
 * That is never a mistake in what the owner typed: it means a migration is
 * committed but has not been applied to this project. The raw message names the
 * column and stops there, which sends them hunting through the form; name the
 * migration instead, the way the publish route names 0003 when
 * admin_manages_store() is missing.
 *
 * Used only by the two writes that carry the columns later migrations add:
 * sizes/colours/featured (0004), price (0007) and the gallery (0008). The
 * failing column name is in the message, so the hint names all three files
 * rather than guessing which one is missing. Everywhere else the raw message is
 * already the whole story.
 */
function writeError(error: { code?: string; message: string }): Error {
  if (error.code !== "PGRST204") return new Error(error.message);
  return new Error(
    `${error.message} This database is missing a migration — apply supabase/migrations/ in order (0004_product_variants.sql, 0007_product_prices.sql and 0008_product_gallery.sql all add product columns), then try again.`
  );
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured on this host yet.");
  return client;
}

export async function listProducts(): Promise<AdminProduct[]> {
  const client = requireClient();
  const storeId = await getActiveStoreId();
  const { data, error } = await client
    .from("products").select("*").eq("store_id", storeId).order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  const client = requireClient();
  const storeId = await getActiveStoreId();
  const { data, error } = await client.from("products").select("*").eq("id", id).eq("store_id", storeId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
}

async function uniqueSlug(client: ReturnType<typeof requireClient>, storeId: string, name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let attempt = 1;
  for (;;) {
    let query = client.from("products").select("id").eq("slug", candidate).eq("store_id", storeId);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return candidate;
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

export interface ProductInput {
  name: string;
  categoryId: string;
  description?: string | null;
  /** The ordered gallery. `image_url` is derived from its first entry on write. */
  imageUrls?: string[];
  price?: number | null;
  sizes?: string[];
  colors?: string[];
  featured: boolean;
  isVisible: boolean;
}

/**
 * The gallery, and the primary image derived from it.
 *
 * 0008 keeps `image_url` as a mirror of the first gallery entry so the publish
 * generator and any other reader that predates the gallery keep working. That
 * invariant is owned here, in the one place both columns are written, rather
 * than left to each call site to remember.
 */
function imageColumns(imageUrls: string[] | undefined) {
  const gallery = (imageUrls ?? []).filter(Boolean).slice(0, MAX_PRODUCT_IMAGES);
  return { image_urls: gallery.length > 0 ? gallery : null, image_url: gallery[0] ?? null };
}

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  const client = requireClient();
  const storeId = await getActiveStoreId();
  const slug = await uniqueSlug(client, storeId, input.name);
  const { data: existing, error: countError } = await client
    .from("products").select("sort_order").eq("store_id", storeId)
    .order("sort_order", { ascending: false }).limit(1);
  if (countError) throw new Error(countError.message);
  const nextSortOrder = existing && existing.length > 0 ? (existing[0].sort_order as number) + 1 : 1;

  const { data, error } = await client
    .from("products")
    .insert({
      store_id: storeId,
      name: input.name,
      slug,
      category_id: input.categoryId,
      description: input.description ?? null,
      ...imageColumns(input.imageUrls),
      price: input.price ?? null,
      sizes: toColumn(input.sizes),
      colors: toColumn(input.colors),
      featured: input.featured,
      is_visible: input.isVisible,
      sort_order: nextSortOrder,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw writeError(error);
  return fromRow(data);
}

export async function updateProduct(id: string, input: ProductInput): Promise<AdminProduct> {
  const client = requireClient();
  const storeId = await getActiveStoreId();
  const slug = await uniqueSlug(client, storeId, input.name, id);
  const { data, error } = await client
    .from("products")
    .update({
      name: input.name,
      slug,
      category_id: input.categoryId,
      description: input.description ?? null,
      ...imageColumns(input.imageUrls),
      price: input.price ?? null,
      sizes: toColumn(input.sizes),
      colors: toColumn(input.colors),
      featured: input.featured,
      is_visible: input.isVisible,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("store_id", storeId)
    .select("*")
    .single();
  if (error) throw writeError(error);
  return fromRow(data);
}

function storagePathFromUrl(url: string): string | null {
  const marker = `/object/public/${STORAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

// Deletes a file from the image bucket, ignoring anything that isn't one of
// our storage URLs. Safe to call with a null/foreign URL.
export async function deleteProductImage(url: string | null | undefined): Promise<void> {
  return deleteProductImages([url]);
}

/**
 * Deletes several at once — one storage call rather than one per file.
 *
 * Anything that is not one of our storage URLs is skipped rather than being an
 * error, so this is safe to hand a mixed or partly-empty list.
 */
export async function deleteProductImages(urls: (string | null | undefined)[]): Promise<void> {
  const paths = urls.flatMap((url) => {
    if (!url) return [];
    const path = storagePathFromUrl(url);
    return path ? [path] : [];
  });
  if (paths.length === 0) return;
  await requireClient().storage.from(STORAGE_BUCKET).remove(paths);
}

export async function deleteProduct(product: AdminProduct): Promise<void> {
  const client = requireClient();
  const storeId = await getActiveStoreId();
  // Delete the row first: if this fails the image is still intact, whereas the
  // reverse order would leave a surviving row pointing at a deleted file.
  const { error } = await client.from("products").delete().eq("id", product.id).eq("store_id", storeId);
  if (error) throw new Error(error.message);
  await deleteProductImages(product.imageUrls);
}

export async function setVisible(id: string, isVisible: boolean): Promise<void> {
  const client = requireClient();
  const storeId = await getActiveStoreId();
  const { error } = await client.from("products")
    .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
    .eq("id", id).eq("store_id", storeId);
  if (error) throw new Error(error.message);
}

// Swaps sort_order with the neighboring product so reordering is a simple,
// dependency-free up/down move rather than a drag-and-drop library.
export async function moveProduct(all: AdminProduct[], id: string, direction: "up" | "down"): Promise<void> {
  const client = requireClient();
  const storeId = await getActiveStoreId();
  const index = all.findIndex((product) => product.id === id);
  if (index === -1) return;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= all.length) return;
  const current = all[index];
  const swapWith = all[swapIndex];

  const { error: firstError } = await client.from("products").update({ sort_order: swapWith.sortOrder }).eq("id", current.id).eq("store_id", storeId);
  if (firstError) throw new Error(firstError.message);
  const { error: secondError } = await client.from("products").update({ sort_order: current.sortOrder }).eq("id", swapWith.id).eq("store_id", storeId);
  if (secondError) throw new Error(secondError.message);
}

// Uploads only — it deliberately does NOT delete the image being replaced.
// The caller removes the old file after the product row is successfully saved,
// so abandoning the form (Cancel) can't leave a saved product pointing at a
// file that has already been deleted from storage.
export async function uploadProductImage(file: File): Promise<string> {
  const client = requireClient();
  const compressed = await compressImageToWebp(file);
  const path = `${ACTIVE_STORE_SLUG}/${crypto.randomUUID()}.webp`;

  const { error: uploadError } = await client.storage.from(STORAGE_BUCKET).upload(path, compressed, {
    contentType: "image/webp",
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
