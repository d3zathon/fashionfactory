// Regenerates the committed storefront data from Supabase:
//   src/data/products.json, categories.json, store.json
//
// Run by .github/workflows/publish.yml (workflow_dispatch, triggered by the
// admin panel's "Publish to site" button). Always with the service-role key,
// which lives only as a GitHub Actions secret — never on the web host, never
// in client code.
//
// Multi-store: STORE_SLUG selects which tenant to publish. One deployment
// serves one store, so a store's site is built from its own generated JSON.
// Defaults to whatever the committed store.json already holds, so a deployment
// that only ever serves one store needs no workflow change.
//
// Validates before writing: a publish that would break the storefront fails
// loudly here rather than shipping bad data to the live site.
import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";
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

// Escape hatches for the two guards below. Both are deliberate, explicit
// opt-ins — a publish that empties the storefront should never be a default.
const allowEmptyCatalogue = process.env.ALLOW_EMPTY_CATALOGUE === "1";
const allowCatalogueShrink = process.env.ALLOW_CATALOGUE_SHRINK === "1";

async function readJson(relPath) {
  try {
    return JSON.parse(await readFile(path.join(root, relPath), "utf8"));
  } catch {
    return null;
  }
}

const previousProducts = await readJson("src/data/products.json");
const previousStore = await readJson("src/data/store.json");
const storeSlug = process.env.STORE_SLUG || previousStore?.storeSlug || previousStore?.settings?.slug;

if (!storeSlug) {
  console.error("STORE_SLUG is not set and src/data/store.json names no store. Set STORE_SLUG to the slug of the store to publish.");
  process.exit(1);
}

async function fetchAll(table, query) {
  const { data, error } = await query;
  if (error) {
    console.error(`Failed to read ${table}: ${error.message}`);
    process.exit(1);
  }
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

const { data: storeRow, error: storeError } = await supabase
  .from("stores").select("*").eq("slug", storeSlug).maybeSingle();
if (storeError) {
  console.error(`Failed to read stores: ${storeError.message}`);
  process.exit(1);
}
if (!storeRow) {
  console.error(`No store found with slug "${storeSlug}". Check STORE_SLUG, or apply supabase/migrations.`);
  process.exit(1);
}

const storeId = storeRow.id;

const productRows = await fetchAll(
  "products",
  supabase.from("products").select("*").eq("store_id", storeId).eq("is_visible", true).order("sort_order", { ascending: true })
);
const categoryRows = await fetchAll(
  "categories",
  supabase.from("categories").select("*").eq("store_id", storeId).eq("active", true).order("sort_order", { ascending: true })
);
const locationRows = await fetchAll(
  "store_locations",
  supabase.from("store_locations").select("*").eq("store_id", storeId).eq("active", true).order("sort_order", { ascending: true })
);

// ---------------------------------------------------------------------------
// Validation — fail the publish rather than ship a broken storefront.
// ---------------------------------------------------------------------------
const errors = [];
const warnings = [];

if (categoryRows.length === 0) errors.push("No active categories — the shop page would render empty.");
if (locationRows.length === 0) warnings.push("No active store locations — the Visit Us section will be empty.");

// A publish is a one-click action from the admin panel, and the storefront is
// whatever this script writes. Without these two guards, an admin whose
// products table is empty (or who hides most of the catalogue) silently
// replaces a working shop window with nothing.
const previousCount = previousProducts?.products?.length ?? 0;
if (productRows.length === 0 && !allowEmptyCatalogue) {
  errors.push(
    previousCount > 0
      ? `No visible products, but the live site currently shows ${previousCount}. Publishing would empty the storefront. Add or unhide products, or set ALLOW_EMPTY_CATALOGUE=1 if that is genuinely intended.`
      : "No visible products. Set ALLOW_EMPTY_CATALOGUE=1 to publish an empty catalogue on purpose."
  );
} else if (previousCount >= 4 && productRows.length < previousCount / 2 && !allowCatalogueShrink) {
  errors.push(
    `Publishing would drop the catalogue from ${previousCount} products to ${productRows.length}. If that is intended, set ALLOW_CATALOGUE_SHRINK=1.`
  );
}

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

// The homepage's "Selected pairs" section filters on this flag, so a catalogue
// with none leaves that section blank. A warning rather than an error: a shop
// is allowed to feature nothing, it just rarely means to.
if (productRows.length > 0 && !productRows.some((p) => p.featured)) {
  warnings.push(
    `No product is marked featured, so the homepage "Selected pairs" section will be empty. Tick "Feature on the homepage" on the products that belong there.`
  );
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
// sizes/colors are omitted entirely when the column is null or empty, which is
// what keeps them optional in the model rather than becoming empty arrays that
// render as an empty Sizes group. featured is always written, so the generated
// file states outright which products the homepage will show.
const products = productRows.map((row, index) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  categoryId: row.category_id,
  description: row.description ?? undefined,
  images: row.image_url ? [{ id: row.id, src: row.image_url, alt: row.name }] : [],
  ...(row.sizes?.length ? { sizes: row.sizes } : {}),
  ...(row.colors?.length ? { colors: row.colors } : {}),
  featured: row.featured === true,
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

// Undefined rather than null for absent values: the storefront's types treat
// these as optional, and JSON.stringify drops undefined keys entirely.
const orNothing = (value) => value ?? undefined;

const store = {
  generatedAt,
  storeSlug: storeRow.slug,
  settings: {
    slug: storeRow.slug,
    name: storeRow.name,
    tagline: orNothing(storeRow.tagline),
    description: orNothing(storeRow.description),
    locationLabel: storeRow.location_label,
    phone: storeRow.phone,
    whatsappNumber: storeRow.whatsapp_number,
    email: orNothing(storeRow.email),
    instagramHandle: orNothing(storeRow.instagram_handle),
    instagramUrl: orNothing(storeRow.instagram_url),
    tiktokHandle: orNothing(storeRow.tiktok_handle),
    tiktokUrl: orNothing(storeRow.tiktok_url),
    facebookUrl: orNothing(storeRow.facebook_url),
    logoUrl: orNothing(storeRow.logo_url),
    faviconUrl: orNothing(storeRow.favicon_url),
    address: orNothing(storeRow.address),
    visitTitle: orNothing(storeRow.visit_title),
    visitStepBody: orNothing(storeRow.visit_step_body),
    returnsPolicy: orNothing(storeRow.returns_policy),
    openingHours: storeRow.opening_hours,
    businessHours: storeRow.business_hours ?? [],
    countryCode: storeRow.country_code,
    currency: storeRow.currency,
    siteUrl: orNothing(storeRow.site_url),
    branding: storeRow.branding ?? {},
    features: storeRow.features ?? {},
    seo: {
      title: orNothing(storeRow.seo_title),
      description: orNothing(storeRow.seo_description),
      keywords: storeRow.seo_keywords ?? [],
    },
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

console.log(
  `\nPublished ${storeRow.name} (${storeRow.slug}): ${products.length} product(s), ${categories.length} categor(ies), ${store.locations.length} location(s).`
);
