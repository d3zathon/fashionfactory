-- More than one photograph per product.
--
-- The storefront has always rendered a gallery — the Product model carries
-- `images[]` and the product page maps over it — but the admin could only ever
-- store one URL, so every gallery had exactly one picture in it. Survivable for
-- shoes. Not survivable for clothing, which nobody buys from a single
-- front-on shot.
--
-- Additive and idempotent, and inherits the products table's existing RLS
-- unchanged.
--
-- ---------------------------------------------------------------------------
-- Why two columns rather than one
-- ---------------------------------------------------------------------------
-- `image_urls` is the authoritative, ordered gallery. `image_url` stays, and
-- the application keeps it equal to the first entry.
--
-- That mirroring is deliberate rather than lazy. `image_url` is what the
-- publish generator, every existing row, and anything reading this table
-- outside the app already understands; dropping it would break all of them at
-- once for a change that is meant to be additive. Keeping it as a derived
-- "primary image" means old readers keep working and see the right picture,
-- while the app reads and writes the full list. The write path in
-- src/providers/live/supabaseProducts.ts owns that invariant.
--
-- A separate product_images table would be the textbook shape, but it would
-- need its own policies, its own admin screen and a join on every read, to
-- model a list that is capped at a handful of entries and only ever read whole.
alter table public.products
  add column if not exists image_urls text[];

-- Backfill so every existing row has a gallery that agrees with its primary
-- image. Scoped to rows that have a photo and no gallery yet, so re-running
-- cannot overwrite a gallery someone has since curated.
update public.products
   set image_urls = array[image_url]
 where image_url is not null
   and image_urls is null;

comment on column public.products.image_urls is
  'Ordered gallery for the product page. The first entry is mirrored into image_url by the application, which is what older readers and the publish generator fall back to. NULL means no photos.';

-- ---------------------------------------------------------------------------
-- Rollback
-- ---------------------------------------------------------------------------
-- Dropping the column loses every photo past the first; image_url still holds
-- the primary one, so no product is left without a picture.
--
--   alter table public.products drop column if exists image_urls;
