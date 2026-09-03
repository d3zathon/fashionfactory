// Fills the storefront with placeholder products so the layout can be reviewed
// with the shop full, and empties it again.
//
//   npm run preview:on    src/data/products.preview.json -> products.json
//   npm run preview:off   back to an empty catalogue
//
// Why this exists as a script rather than "just edit the file": products.json
// is what the site publishes. Editing it by hand to see the grid, and then
// forgetting, is how a placeholder ends up live under a real shop's name. This
// makes turning it on and off one word each way, and stamps the file it writes
// so the state is obvious in `git status` and in the file itself.
//
// It writes ONLY src/data/products.json and reads only the committed preview
// file. It never touches Supabase, and it is not part of the publish pipeline —
// the real catalogue reaches the site from /admin via Publish, which overwrites
// whatever this left behind.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const live = path.join(root, "src/data/products.json");
const preview = path.join(root, "src/data/products.preview.json");

const mode = process.argv[2];
if (mode !== "on" && mode !== "off") {
  console.error("Usage: node scripts/preview-catalogue.mjs on|off");
  process.exit(1);
}

const generatedAt = new Date().toISOString();

if (mode === "on") {
  const { products } = JSON.parse(await readFile(preview, "utf8"));
  await writeFile(
    live,
    `${JSON.stringify(
      {
        _comment:
          "PLACEHOLDER CATALOGUE — written by scripts/preview-catalogue.mjs, not by a real publish. These are not Jutta Nepal products. Run `npm run preview:off` to empty it, or publish from /admin to replace it with the real one.",
        generatedAt,
        products,
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  console.log(`Preview catalogue on — ${products.length} placeholder products.`);
  console.log("Run `npm run preview:off` before committing.");
} else {
  await writeFile(live, `${JSON.stringify({ generatedAt, products: [] }, null, 2)}\n`, "utf8");
  console.log("Preview catalogue off — the catalogue is empty again.");
}
