-- Fashion Factory Nepal — admin panel schema.
-- Run this once in the Supabase project's SQL editor (Database > SQL Editor).
-- Categories are intentionally NOT a table: the admin only offers the 5 fixed
-- categories already hardcoded in src/data/mock.ts, so category_id is a plain
-- checked text column, not a foreign key into a categories table.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_id text not null check (category_id in ('new', 'mens', 'womens', 'accessories', 'gifts')),
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists products_sort_order_idx on public.products (sort_order);

alter table public.products enable row level security;

create policy "anon can read visible products"
  on public.products for select
  to anon
  using (is_visible = true);

create policy "authenticated has full access"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- Storage bucket for product photos, uploaded (already compressed to WebP,
-- ~1200px, quality 82) from the admin panel.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public can read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "authenticated can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "authenticated can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');

create policy "authenticated can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- After running this file:
-- 1. Authentication > Providers > Email — turn OFF "Allow new users to sign up".
-- 2. Authentication > Users — manually add the one owner account (email + password).
-- 3. Project Settings > API — copy the Project URL and the anon public key into
--    NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY on the host, and
--    the service_role key into the SUPABASE_SERVICE_ROLE_KEY GitHub Actions
--    secret only (never on the host, never in client code).
