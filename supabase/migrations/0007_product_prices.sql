-- Prices on products.
--
-- The storefront's Product model and product page have always been able to
-- render a price, but there was nowhere to put one: no column, no admin field.
-- The result was that every "how much is this?" became a WhatsApp message,
-- which is a real cost on a catalogue people compare before travelling to
-- Bhaisepati.
--
-- Additive and idempotent. One nullable column on an existing table, which
-- inherits that table's RLS exactly as 0004's columns did — a store admin can
-- read and write it on their own store's rows and nowhere else. No policy is
-- created or changed.
--
-- NULL is meaningful and is the default: it means "this store has not
-- published a price for this item", and the storefront then renders no price
-- at all rather than a zero or a blank. That is deliberately the same
-- behaviour the site has today, so applying this migration changes nothing
-- visible until someone actually enters a price. Publishing prices stays a
-- decision the shop makes per item, not one this migration makes for it.
--
-- numeric(10,2) rather than a float: money must not be stored in binary
-- floating point, and 10 digits covers any price a shop like this will ever
-- charge in NPR. The currency is not stored per product — it comes from
-- stores.currency, because a shop prices everything in one currency and
-- repeating it on every row would just be a way for the two to disagree.
alter table public.products
  add column if not exists price numeric(10, 2);

-- A negative price is never a typo worth keeping. Guarded so the migration can
-- be re-applied: adding a constraint that already exists is an error, unlike
-- adding a column with `if not exists`.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_price_non_negative'
  ) then
    alter table public.products
      add constraint products_price_non_negative check (price is null or price >= 0);
  end if;
end $$;

comment on column public.products.price is
  'Optional price in the store''s own currency (stores.currency). NULL means no price is published for this item, and the storefront renders none.';

-- ---------------------------------------------------------------------------
-- Rollback
-- ---------------------------------------------------------------------------
--   alter table public.products drop constraint if exists products_price_non_negative;
--   alter table public.products drop column if exists price;
