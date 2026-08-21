import { getSupabaseClient } from "@/lib/supabase/client";

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
}

export interface AdminStoreSettings {
  name: string;
  locationLabel: string;
  phone: string;
  instagramHandle: string;
  instagramUrl: string;
  openingHours: string;
  whatsappNumber: string;
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

// --- categories -------------------------------------------------------------

export async function listCategories(): Promise<AdminCategory[]> {
  const client = requireClient();
  const { data, error } = await client.from("categories").select("*").order("sort_order", { ascending: true });
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
  // id and slug are deliberately not updatable here: products reference
  // category ids, and slugs are live URLs (/collection#slug) that would break.
  const { error } = await client
    .from("categories")
    .update({ name: input.name, description: input.description, active: input.active })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function moveCategory(all: AdminCategory[], id: string, direction: "up" | "down"): Promise<void> {
  const client = requireClient();
  const index = all.findIndex((c) => c.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= all.length) return;
  const current = all[index];
  const other = all[swapIndex];
  const { error: e1 } = await client.from("categories").update({ sort_order: other.sortOrder }).eq("id", current.id);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await client.from("categories").update({ sort_order: current.sortOrder }).eq("id", other.id);
  if (e2) throw new Error(e2.message);
}

// How many products sit in each category — shown before deactivating one.
export async function countProductsByCategory(): Promise<Record<string, number>> {
  const client = requireClient();
  const { data, error } = await client.from("products").select("category_id");
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = row.category_id as string;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

// --- store settings ---------------------------------------------------------

export async function getStoreSettings(): Promise<AdminStoreSettings | null> {
  const client = requireClient();
  const { data, error } = await client.from("store_settings").select("*").limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    name: data.name as string,
    locationLabel: data.location_label as string,
    phone: data.phone as string,
    instagramHandle: data.instagram_handle as string,
    instagramUrl: data.instagram_url as string,
    openingHours: data.opening_hours as string,
    whatsappNumber: data.whatsapp_number as string,
  };
}

export async function updateStoreSettings(input: AdminStoreSettings): Promise<void> {
  const client = requireClient();
  const { error } = await client
    .from("store_settings")
    .update({
      name: input.name,
      location_label: input.locationLabel,
      phone: input.phone,
      instagram_handle: input.instagramHandle,
      instagram_url: input.instagramUrl,
      opening_hours: input.openingHours,
      whatsapp_number: input.whatsappNumber,
    })
    .eq("id", true);
  if (error) throw new Error(error.message);
}

// --- locations --------------------------------------------------------------

export async function listLocations(): Promise<AdminLocation[]> {
  const client = requireClient();
  const { data, error } = await client.from("store_locations").select("*").order("sort_order", { ascending: true });
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
    .eq("id", id);
  if (error) throw new Error(error.message);
}
