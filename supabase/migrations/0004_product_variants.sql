-- Persist sizes, colours and the featured flag on products.
--
-- These three already existed in the TypeScript model and in the committed
-- src/data/products.json, but nowhere in the database. The seeded JSON was
-- written by hand, so the first real publish would have regenerated it from
-- Supabase, found no such columns, and dropped all three — emptying the
-- homepage's "Selected pieces" section (which filters on `featured`) and
-- removing the Sizes/Colours groups and their structured data from every
-- product page. This closes that gap before the first publish, not after it.
--
-- Forward-only, and additive: it creates no policies and changes none. Column
-- additions inherit the table's existing RLS, so tenant isolation is exactly as
-- 0002 and 0003 left it — a store admin can read and write these columns on
-- their own store's rows and nowhere else.
--
-- No backfill: `featured` defaults to false, and which pieces a shop wants in
-- its shop window is the owner's decision, not something to guess from seed
-- data that never came from them.

-- text[] rather than jsonb: these are flat lists of short labels, and an array
-- keeps them queryable with plain array operators if that is ever wanted.
--
-- Nullable with no default, deliberately. NULL means "the owner never specified
-- sizes for this piece", which is the state every existing row is in and which
-- the storefront already models as an optional field; an empty-array default
-- would erase that distinction on day one and make "no sizes" indistinguishable
-- from "sizes not yet entered". The generator omits the key entirely when the
-- value is null or empty, which is exactly the shape the model expects.
alter table public.products add column if not exists sizes  text[];
alter table public.products add column if not exists colors text[];

-- NOT NULL DEFAULT false, matching is_visible's shape on this table: a product
-- is either in the shop window or it is not, and there is no third state worth
-- representing. Existing rows become not-featured, which is the safe default —
-- the homepage shows nothing it was not told to show.
alter table public.products add column if not exists featured boolean not null default false;

comment on column public.products.sizes    is 'Optional size labels, shown on the product page. NULL = never specified.';
comment on column public.products.colors   is 'Optional colour labels, shown on the product page. NULL = never specified.';
comment on column public.products.featured is 'Included in the homepage "Selected pieces" section.';

-- ---------------------------------------------------------------------------
-- Rollback
-- ---------------------------------------------------------------------------
-- alter table public.products drop column if exists sizes;
-- alter table public.products drop column if exists colors;
-- alter table public.products drop column if exists featured;
