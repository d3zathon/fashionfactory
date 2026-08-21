// Regenerates the committed storefront data from Supabase:
//   src/data/products.json, categories.json, store.json
//
// Run by .github/workflows/publish.yml (workflow_dispatch, triggered by the
// admin panel's "Publish to site" button). Always with the service-role key,
// which lives only as a GitHub Actions secret — never on the web host, never
// in client code.
//
// Validates before writing: a publish that would break the storefront fails
// loudly here rather than shipping bad data to the live site.
import { createClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const root = fileURLToPath(new URL("..", import.meta.url));
const generatedAt = new Date().toISOString();

async function fetchAll(table, query) {
  const { data, error } = await query;
  if (error) {
    console.error(`Failed to read ${table}: ${error.message}`);
    process.exit(1);
  }
  return data ?? [];
}

const productRows = await fetchAll(
  "products",
  supabase.from("products").select("*").eq("is_visible", true).order("sort_order", { ascending: true })
);
const categoryRows = await fetchAll(
  "categories",
  supabase.from("categories").select("*").eq("active", true).order("sort_order", { ascending: true })
);
const locationRows = await fetchAll(
  "store_locations",
  supabase.from("store_locations").select("*").eq("active", true).order("sort_order", { ascending: true })
);
const { data: settingsRow, error: settingsError } = await supabase
  .from("store_settings").select("*").limit(1).maybeSingle();
if (settingsError) {
  console.error(`Failed to read store_settings: ${settingsError.message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Validation — fail the publish rather than ship a broken storefront.
// ---------------------------------------------------------------------------
const errors = [];
const warnings = [];

if (!settingsRow) errors.push("store_settings has no row — the storefront needs contact details.");
if (categoryRows.length === 0) errors.push("No active categories — the collection page would render empty.");
if (locationRows.length === 0) warnings.push("No active store locations — the Visit Us section will be empty.");

const categoryIds = new Set(categoryRows.map((c) => c.id));
const seenSlugs = new Set();
for (const p of productRows) {
  if (!p.name?.trim()) errors.push(`Product ${p.id} has no name.`);
  if (!p.slug?.trim()) errors.push(`Product "${p.name}" has no slug.`);
  if (seenSlugs.has(p.slug)) errors.push(`Duplicate product slug "${p.slug}".`);
  seenSlugs.add(p.slug);
  if (!categoryIds.has(p.category_id)) {
    errors.push(`Product "${p.name}" references category "${p.category_id}", which is not active.`);
  }
  // Not fatal: the storefront renders a placeholder, but it looks unfinished.
  if (!p.image_url) warnings.push(`Product "${p.name}" has no photo.`);
}

for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length) {
  console.error("\nPublish aborted — fix these first:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
const products = productRows.map((row, index) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  categoryId: row.category_id,
  description: row.description ?? undefined,
  images: row.image_url ? [{ id: row.id, src: row.image_url, alt: row.name }] : [],
  sortOrder: row.sort_order ?? index + 1,
}));

const categories = categoryRows.map((row, index) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description ?? undefined,
  active: row.active,
  sortOrder: row.sort_order ?? index + 1,
}));

const store = {
  generatedAt,
  settings: {
    name: settingsRow.name,
    locationLabel: settingsRow.location_label,
    phone: settingsRow.phone,
    instagramHandle: settingsRow.instagram_handle,
    instagramUrl: settingsRow.instagram_url,
    openingHours: settingsRow.opening_hours,
    whatsappNumber: settingsRow.whatsapp_number,
  },
  locations: locationRows.map((row, index) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    mapsUrl: row.maps_url,
    lat: row.lat,
    lng: row.lng,
    sortOrder: row.sort_order ?? index + 1,
  })),
};

const files = [
  ["src/data/products.json", { generatedAt, products }],
  ["src/data/categories.json", { generatedAt, categories }],
  ["src/data/store.json", store],
];

for (const [relPath, payload] of files) {
  await writeFile(path.join(root, relPath), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${relPath}`);
}

console.log(`\nPublished ${products.length} product(s), ${categories.length} categor(ies), ${store.locations.length} location(s).`);
