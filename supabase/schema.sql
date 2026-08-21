-- Fashion Factory Nepal — admin panel schema.
-- Run this once in the Supabase project's SQL editor (Database > SQL Editor).
--
-- Authorization model: being *authenticated* grants nothing. Access is granted
-- only by membership in public.admin_users, checked via private.is_admin() from
-- every policy. This closes the privilege-escalation path where any user who
-- signed up (sign-ups are public unless disabled) would have had full CRUD.
--
-- Categories are intentionally NOT a table: the admin only offers the 5 fixed
-- categories already hardcoded in src/data/mock.ts, so category_id is a plain
-- checked text column, not a foreign key into a categories table.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

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
-- Supports the anon read path (is_visible filter + sort_order ordering).
create index if not exists products_visible_sort_idx on public.products (is_visible, sort_order);

alter table public.products enable row level security;

-- ---------------------------------------------------------------------------
-- Admin role layer
-- ---------------------------------------------------------------------------

create schema if not exists private;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  note text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- SECURITY DEFINER so an RLS policy can read admin_users without recursing into
-- admin_users' own policies. Lives in `private` (not exposed to the Data API),
-- reads only the calling user's own row, and pins an empty search_path.
create or replace function private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- Readable only by admins; writable by nobody through the API. Membership
-- changes go through SQL / service_role only, so the web host never needs a
-- privileged key to manage admins.
drop policy if exists "admins can read admin list" on public.admin_users;
create policy "admins can read admin list" on public.admin_users
  for select to authenticated using (private.is_admin());

-- ---------------------------------------------------------------------------
-- Product policies
-- ---------------------------------------------------------------------------

create policy "anon can read visible products"
  on public.products for select
  to anon
  using (is_visible = true);

drop policy if exists "authenticated has full access" on public.products;

create policy "admins can read all products" on public.products
  for select to authenticated using (private.is_admin());
create policy "admins can insert products" on public.products
  for insert to authenticated with check (private.is_admin());
create policy "admins can update products" on public.products
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admins can delete products" on public.products
  for delete to authenticated using (private.is_admin());

-- Keep updated_at honest regardless of what the client sends (mass-assignment safe).
create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before insert or update on public.products
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

-- Product photos, uploaded already compressed to WebP (~1200px, quality 82) by
-- the admin panel. The size/mime limits are a backstop if compression is
-- bypassed or fails, protecting the 1 GB free tier.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "public can read product images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

create policy "admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and private.is_admin());

create policy "admins can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and private.is_admin())
  with check (bucket_id = 'product-images' and private.is_admin());

create policy "admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and private.is_admin());

-- ---------------------------------------------------------------------------
-- After running this file
-- ---------------------------------------------------------------------------
-- 1. Authentication > Providers > Email — turn OFF "Allow new users to sign up".
--    Until this is off, anyone can create an account with the public anon key.
--    They still get nothing (admin_users is the gate), but keep it off anyway.
-- 2. Authentication > Users — manually add the owner account.
-- 3. Grant that account admin rights (SQL Editor):
--      insert into public.admin_users (user_id, email)
--      select id, email from auth.users where email = 'owner@example.com';
-- 4. Project Settings > API — copy the Project URL and the anon public key into
--    NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY on the host, and
--    the service_role key into the SUPABASE_SERVICE_ROLE_KEY GitHub Actions
--    secret only (never on the host, never in client code).
