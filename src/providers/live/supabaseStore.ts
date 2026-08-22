import { getSupabaseClient } from "@/lib/supabase/client";
import { getStoreProfile } from "@/providers/static";
import type { BusinessHours, StoreBranding, StoreFeatures, StoreSeo } from "@/models";

/**
 * Which store this admin panel administers.
 *
 * One deployment serves one store, so the panel's scope is fixed at build time
 * rather than chosen per session. NEXT_PUBLIC_STORE_SLUG overrides it (useful
 * when pointing a preview deployment at a different tenant); otherwise it is
 * whichever store the committed data was generated for.
 */
export const ACTIVE_STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG || getStoreProfile().slug;

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
}

export interface AdminStoreSettings {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  visitTitle: string | null;
  visitStepBody: string | null;
  locationLabel: string;
  phone: string;
  email: string | null;
  instagramHandle: string | null;
  instagramUrl: string | null;
  tiktokHandle: string | null;
  tiktokUrl: string | null;
  facebookUrl: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  openingHours: string;
  whatsappNumber: string;
  businessHours: BusinessHours[];
  branding: StoreBranding;
  features: StoreFeatures;
  seo: StoreSeo;
}

export interface AdminLocation {
  id: string;
  name: string;
  address: string;
  mapsUrl: string;
  lat: number;
  lng: number;
  sortOrder: number;
  active: boolean;
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured on this host yet.");
  return client;
}

// Resolved once per page load. Every admin query is scoped by it, so a stale or
// wrong value would silently show another store's catalogue — hence resolving
// from the slug rather than trusting anything the browser can set.
let cachedStoreId: string | null = null;

export async function getActiveStoreId(): Promise<string> {
  if (cachedStoreId) return cachedStoreId;
  const client = requireClient();
  const { data, error } = await client.from("stores").select("id").eq("slug", ACTIVE_STORE_SLUG).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`No store found with slug "${ACTIVE_STORE_SLUG}". Run the migrations in supabase/migrations.`);
  cachedStoreId = data.id as string;
  return cachedStoreId;
}

// --- categories -------------------------------------------------------------

export async function listCategories(): Promise<AdminCategory[]> {
  const client = requireClient();
  const storeId = await getActiveStoreId();
  const { data, error } = await client
    .from("categories").select("*").eq("store_id", storeId).order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? null,
    active: row.active as boolean,
    sortOrder: row.sort_order as number,
  }));
}

export async function updateCategory(id: string, input: { name: string; description: string | null; active: boolean }): Promise<void> {
  const client = requireClient();
  const storeId = await getActiveStoreId();
  // id and slug are deliberately not updatable here: products reference
  // category ids, and slugs are live URLs (/collection#slug) that would break.
  const { error } = await client
    .from("categories")
    .update({ name: input.name, description: input.description, active: input.active })
    .eq("id", id)
    .eq("store_id", storeId);
  if (error) throw new Error(error.message);
}

export async function moveCategory(all: AdminCategory[], id: string, direction: "up" | "down"): Promise<void> {
  const client = requireClient();
  const storeId = await getActiveStoreId();
  const index = all.findIndex((c) => c.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= all.length) return;
  const current = all[index];
  const other = all[swapIndex];
  const { error: e1 } = await client.from("categories").update({ sort_order: other.sortOrder }).eq("id", current.id).eq("store_id", storeId);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await client.from("categories").update({ sort_order: current.sortOrder }).eq("id", other.id).eq("store_id", storeId);
  if (e2) throw new Error(e2.message);
}

// How many products sit in each category — shown before deactivating one.
export async function countProductsByCategory(): Promise<Record<string, number>> {
  const client = requireClient();
  const storeId = await getActiveStoreId();
  const { data, error } = await client.from("products").select("category_id").eq("store_id", storeId);
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = row.category_id as string;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

// --- store settings ---------------------------------------------------------

function toSettings(row: Record<string, unknown>): AdminStoreSettings {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    tagline: (row.tagline as string) ?? null,
    description: (row.description as string) ?? null,
    visitTitle: (row.visit_title as string) ?? null,
    visitStepBody: (row.visit_step_body as string) ?? null,
    locationLabel: row.location_label as string,
    phone: row.phone as string,
    email: (row.email as string) ?? null,
    instagramHandle: (row.instagram_handle as string) ?? null,
    instagramUrl: (row.instagram_url as string) ?? null,
    tiktokHandle: (row.tiktok_handle as string) ?? null,
    tiktokUrl: (row.tiktok_url as string) ?? null,
    facebookUrl: (row.facebook_url as string) ?? null,
    logoUrl: (row.logo_url as string) ?? null,
    faviconUrl: (row.favicon_url as string) ?? null,
    openingHours: row.opening_hours as string,
    whatsappNumber: row.whatsapp_number as string,
    businessHours: (row.business_hours as BusinessHours[]) ?? [],
    branding: (row.branding as StoreBranding) ?? {},
    features: (row.features as StoreFeatures) ?? {},
    seo: {
      title: (row.seo_title as string) ?? undefined,
      description: (row.seo_description as string) ?? undefined,
      keywords: (row.seo_keywords as string[]) ?? [],
    },
  };
}

export async function getStoreSettings(): Promise<AdminStoreSettings | null> {
  const client = requireClient();
  const { data, error } = await client.from("stores").select("*").eq("slug", ACTIVE_STORE_SLUG).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toSettings(data) : null;
}

export async function updateStoreSettings(input: AdminStoreSettings): Promise<void> {
  const client = requireClient();
  // Scoped by id, and RLS re-checks that this admin manages that store — slug
  // and id are never taken from the form.
  const { error } = await client
    .from("stores")
    .update({
      name: input.name,
      tagline: input.tagline,
      description: input.description,
      visit_title: input.visitTitle,
      visit_step_body: input.visitStepBody,
      location_label: input.locationLabel,
      phone: input.phone,
      email: input.email,
      instagram_handle: input.instagramHandle,
      instagram_url: input.instagramUrl,
      tiktok_handle: input.tiktokHandle,
      tiktok_url: input.tiktokUrl,
      facebook_url: input.facebookUrl,
      logo_url: input.logoUrl,
      favicon_url: input.faviconUrl,
      opening_hours: input.openingHours,
      whatsapp_number: input.whatsappNumber,
      features: input.features,
      seo_title: input.seo.title ?? null,
      seo_description: input.seo.description ?? null,
      seo_keywords: input.seo.keywords ?? [],
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
}

// --- locations --------------------------------------------------------------

export async function listLocations(): Promise<AdminLocation[]> {
  const client = requireClient();
  const storeId = await getActiveStoreId();
  const { data, error } = await client
    .from("store_locations").select("*").eq("store_id", storeId).order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    address: row.address as string,
    mapsUrl: row.maps_url as string,
    lat: row.lat as number,
    lng: row.lng as number,
    sortOrder: row.sort_order as number,
    active: row.active as boolean,
  }));
}

export async function updateLocation(id: string, input: Omit<AdminLocation, "id" | "sortOrder">): Promise<void> {
  const client = requireClient();
  const storeId = await getActiveStoreId();
  const { error } = await client
    .from("store_locations")
    .update({
      name: input.name,
      address: input.address,
      maps_url: input.mapsUrl,
      lat: input.lat,
      lng: input.lng,
      active: input.active,
    })
    .eq("id", id)
    .eq("store_id", storeId);
  if (error) throw new Error(error.message);
}
