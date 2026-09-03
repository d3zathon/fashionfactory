-- Jutta Nepal — a second store on the platform, plus the returns/exchange
-- terms every store needs somewhere to record.
--
-- Additive and idempotent. Nothing here drops, resets or re-scopes anything
-- that 0001–0004 created: no table is dropped, no policy is changed, no row
-- belonging to another store is touched, and every insert is guarded so a
-- re-run is a no-op. Tenant isolation is exactly as 0002/0003 left it — the
-- new column inherits `stores`' existing RLS, and the seeded rows carry the
-- new store's `store_id` like every other content row.
--
-- Two independent things, in one migration because the store's seed needs the
-- column:
--
--   1. `stores.returns_policy` — the shop's returns and exchange terms in its
--      own words. Configuration rather than page copy: the footer, the FAQ and
--      every product page render the same string, it is a commitment the
--      business changes on its own schedule, and no two stores' terms match.
--      Nullable with no default: NULL means "this store has not stated any",
--      and the storefront then renders no policy line at all rather than one
--      invented on the shop's behalf.
--
--   2. The `jutta-nepal` store row, its categories and its branch. Seeded
--      here so the admin panel and the publish pipeline have a tenant to point
--      at (STORE_SLUG=jutta-nepal); `is_default` stays false, so Fashion
--      Factory remains the platform default and the partial unique index on
--      is_default is untouched.
--
-- Deliberately no products. The shop's photography has not been supplied, and
-- a seeded catalogue would put invented product names and stock imagery on a
-- real business's storefront. Products are added through /admin and reach the
-- site through Publish, which is the path they are meant to take.

-- ---------------------------------------------------------------------------
-- 1. Returns / exchange terms
-- ---------------------------------------------------------------------------

alter table public.stores add column if not exists returns_policy text;

comment on column public.stores.returns_policy is
  'Returns and exchange terms in the store''s own words. Rendered in the footer, the FAQ and on product pages. NULL = the store has stated none, and no policy line renders.';

-- ---------------------------------------------------------------------------
-- 2. Jutta Nepal
-- ---------------------------------------------------------------------------
-- One statement per table, each guarded, so re-applying the file changes
-- nothing. Existing values are left alone on a re-run: the admin panel is the
-- place these are edited after the first apply, and a migration must not
-- silently revert the owner's own edits.

insert into public.stores (
  slug, name, tagline, description,
  phone, whatsapp_number,
  instagram_handle, instagram_url,
  location_label, address, opening_hours, business_hours,
  country_code, currency,
  visit_title, visit_step_body,
  returns_policy,
  branding, features,
  seo_title, seo_description, seo_keywords,
  is_default
) values (
  'jutta-nepal',
  'Jutta Nepal',
  'Every Step Counts.',
  'Jutta Nepal is a footwear store in Bhaisepati, Lalitpur. Browse what''s in the shop, ask about a pair on WhatsApp, and come in to try it on.',
  '+977 9702042301',
  '9779702042301',
  '@jutta__nepal',
  'https://www.instagram.com/jutta__nepal/',
  'Bhaisepati, Lalitpur, Nepal',
  'Bhaisepati, Lalitpur, Nepal 44700',
  -- The shop's actual hours were not supplied. This says so plainly instead of
  -- asserting a schedule, and `business_hours` stays empty so no openingHours
  -- claim reaches schema.org either.
  'Message us to confirm today''s hours',
  '[]'::jsonb,
  'NP',
  'NPR',
  E'One shop in\nBhaisepati.',
  'Come to Bhaisepati and try the pair on.',
  'No refunds or returns. Exchanges are accepted within 2 days, subject to store policy and product condition.',
  '{"accent":"#23375c","accentDeep":"#16233c","accentLight":"#93aad6","ink":"#12141a","paper":"#f3f2ef","wordmark":["JUTTA","NEPAL"]}'::jsonb,
  -- Instagram and customer quotes are off until there are real posts and real
  -- quotes to show; both sections would otherwise render empty or filled with
  -- content the shop did not produce.
  '{"styleQuiz":true,"instagramFeed":false,"testimonials":false,"faqs":true,"contactForm":true,"locations":true}'::jsonb,
  'Jutta Nepal | Footwear Store in Bhaisepati, Lalitpur',
  'Jutta Nepal is a footwear store in Bhaisepati, Lalitpur. Browse the shoes, message the store on WhatsApp to ask about a pair, and get directions.',
  array['Jutta Nepal','shoe store Bhaisepati','footwear store Lalitpur','shoes Lalitpur','sneakers Kathmandu','jutta Nepal Bhaisepati'],
  false
)
on conflict (slug) do nothing;

-- Categories. ids and slugs are locked once products reference them and once
-- they appear in live /collection?c= URLs, which is why the admin panel can
-- rename and reorder them but not re-key them — so they are set correctly here.
insert into public.categories (store_id, id, name, slug, description, active, sort_order)
select s.id, v.id, v.name, v.slug, v.description, true, v.sort_order
from public.stores s
cross join (values
  ('new',      'New Arrivals',    'new-arrivals', 'The most recent pairs to land in the shop.', 1),
  ('sneakers', 'Sneakers',        'sneakers',     'Everyday trainers and low-tops.',            2),
  ('formal',   'Formal & Office', 'formal',       'Loafers, derbies and dress shoes.',          3),
  ('boots',    'Boots',           'boots',        'Ankle boots, chukkas and high-tops.',        4),
  ('sandals',  'Sandals & Slides','sandals',      'Open pairs for warm days and indoors.',      5),
  ('womens',   'Women''s',        'womens',       'The women''s rail across every style.',      6)
) as v(id, name, slug, description, sort_order)
where s.slug = 'jutta-nepal'
on conflict (store_id, id) do nothing;

-- The branch. Coordinates are the marker in the shop's own Google Maps listing,
-- not an approximation of the neighbourhood centre.
insert into public.store_locations (store_id, id, name, address, maps_url, lat, lng, sort_order, active)
select s.id,
       'bhaisepati',
       'Jutta Nepal — Bhaisepati',
       'Bhaisepati, Lalitpur, Nepal 44700',
       'https://www.google.com/maps/place/Jutta+Nepal+Bhaisepati/@27.6638716,85.2746002,7766m/data=!3m1!1e3!4m10!1m2!2m1!1sJutta+Nepal!3m6!1s0x39eb17002eec70c9:0x89aea1fde71432c1!8m2!3d27.6522818!4d85.3045567!15sCgtKdXR0YSBOZXBhbFoNIgtqdXR0YSBuZXBhbJIBCnNob2Vfc3RvcmXgAQA!16s%2Fg%2F11ytrt8gj4?entry=ttu&g_ep=EgoyMDI2MDgzMS4wIKXMDSoASAFQAw%3D%3D',
       27.6522818,
       85.3045567,
       1,
       true
from public.stores s
where s.slug = 'jutta-nepal'
on conflict (store_id, id) do nothing;

-- ---------------------------------------------------------------------------
-- Rollback
-- ---------------------------------------------------------------------------
-- Every statement above has an inverse. Deleting the store cascades to its
-- categories and locations (both reference stores(id) on delete cascade), so
-- the second statement is the whole of part 2. Dropping the column loses any
-- terms other stores have recorded, so run it only if part 1 is being reverted
-- for every tenant.
--
--   delete from public.stores where slug = 'jutta-nepal';
--   alter table public.stores drop column if exists returns_policy;
