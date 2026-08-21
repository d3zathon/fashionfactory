// Regenerates src/data/products.json from Supabase. Run by
// .github/workflows/publish.yml (workflow_dispatch, triggered by the admin
// panel's "Publish to site" button) — never run against the anon key, always
// the service-role key, and never from client code.
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

const { data, error } = await supabase
  .from("products")
  .select("*")
  .eq("is_visible", true)
  .order("sort_order", { ascending: true });

if (error) {
  console.error("Failed to fetch products:", error.message);
  process.exit(1);
}

const products = (data ?? []).map((row, index) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  categoryId: row.category_id,
  description: row.description ?? undefined,
  images: row.image_url ? [{ id: row.id, src: row.image_url, alt: row.name }] : [],
  sortOrder: row.sort_order ?? index + 1,
}));

const output = {
  generatedAt: new Date().toISOString(),
  products,
};

const outPath = path.join(fileURLToPath(new URL("..", import.meta.url)), "src/data/products.json");
await writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Wrote ${products.length} product(s) to ${outPath}`);
