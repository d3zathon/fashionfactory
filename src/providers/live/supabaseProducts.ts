import { getSupabaseClient } from "@/lib/supabaseClient";
import { compressImageToWebp } from "@/lib/imageCompression";

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
  updatedAt: string;
}

export const CATEGORY_OPTIONS: { id: string; name: string }[] = [
  { id: "new", name: "New Arrivals" },
  { id: "mens", name: "Men's" },
  { id: "womens", name: "Women's" },
  { id: "accessories", name: "Accessories" },
  { id: "gifts", name: "Gifts" },
];

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
    sortOrder: row.sort_order as number,
    isVisible: row.is_visible as boolean,
    updatedAt: row.updated_at as string,
  };
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured on this host yet.");
  return client;
}

export async function listProducts(): Promise<AdminProduct[]> {
  const client = requireClient();
  const { data, error } = await client.from("products").select("*").order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  const client = requireClient();
  const { data, error } = await client.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
}

async function uniqueSlug(client: ReturnType<typeof requireClient>, name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let attempt = 1;
  for (;;) {
    let query = client.from("products").select("id").eq("slug", candidate);
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
  imageUrl?: string | null;
  isVisible: boolean;
}

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  const client = requireClient();
  const slug = await uniqueSlug(client, input.name);
  const { data: existing, error: countError } = await client.from("products").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  if (countError) throw new Error(countError.message);
  const nextSortOrder = existing && existing.length > 0 ? (existing[0].sort_order as number) + 1 : 1;

  const { data, error } = await client
    .from("products")
    .insert({
      name: input.name,
      slug,
      category_id: input.categoryId,
      description: input.description ?? null,
      image_url: input.imageUrl ?? null,
      is_visible: input.isVisible,
      sort_order: nextSortOrder,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data);
}

export async function updateProduct(id: string, input: ProductInput): Promise<AdminProduct> {
  const client = requireClient();
  const slug = await uniqueSlug(client, input.name, id);
  const { data, error } = await client
    .from("products")
    .update({
      name: input.name,
      slug,
      category_id: input.categoryId,
      description: input.description ?? null,
      image_url: input.imageUrl ?? null,
      is_visible: input.isVisible,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
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
  if (!url) return;
  const client = requireClient();
  const path = storagePathFromUrl(url);
  if (path) await client.storage.from(STORAGE_BUCKET).remove([path]);
}

export async function deleteProduct(product: AdminProduct): Promise<void> {
  const client = requireClient();
  // Delete the row first: if this fails the image is still intact, whereas the
  // reverse order would leave a surviving row pointing at a deleted file.
  const { error } = await client.from("products").delete().eq("id", product.id);
  if (error) throw new Error(error.message);
  await deleteProductImage(product.imageUrl);
}

export async function setVisible(id: string, isVisible: boolean): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("products").update({ is_visible: isVisible, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}

// Swaps sort_order with the neighboring product so reordering is a simple,
// dependency-free up/down move rather than a drag-and-drop library.
export async function moveProduct(all: AdminProduct[], id: string, direction: "up" | "down"): Promise<void> {
  const client = requireClient();
  const index = all.findIndex((product) => product.id === id);
  if (index === -1) return;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= all.length) return;
  const current = all[index];
  const swapWith = all[swapIndex];

  const { error: firstError } = await client.from("products").update({ sort_order: swapWith.sortOrder }).eq("id", current.id);
  if (firstError) throw new Error(firstError.message);
  const { error: secondError } = await client.from("products").update({ sort_order: current.sortOrder }).eq("id", swapWith.id);
  if (secondError) throw new Error(secondError.message);
}

// Uploads only — it deliberately does NOT delete the image being replaced.
// The caller removes the old file after the product row is successfully saved,
// so abandoning the form (Cancel) can't leave a saved product pointing at a
// file that has already been deleted from storage.
export async function uploadProductImage(file: File): Promise<string> {
  const client = requireClient();
  const compressed = await compressImageToWebp(file);
  const path = `${crypto.randomUUID()}.webp`;

  const { error: uploadError } = await client.storage.from(STORAGE_BUCKET).upload(path, compressed, {
    contentType: "image/webp",
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
