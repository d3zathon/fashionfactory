-- 0001 — baseline schema (single store).
--
-- Apply migrations in filename order; together they are the whole schema. This
-- file is the original single-store shape, kept as history: 0002 layers the
-- store/tenant model on top of it. On a fresh project run both, in order.
--
-- Authorization model: being *authenticated* grants nothing. Access is granted
-- only by membership in public.admin_users, checked via private.is_admin() from
-- every policy. This closes the privilege-escalation path where any user who
-- signed up (sign-ups are public unless disabled) would have had full CRUD.
-- 0002 narrows this further, from "is an admin" to "is an admin of this store".
--
-- Every statement here is re-runnable.

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
drop policy if exists "admins can read admin list" on public.admin_users;
create policy "admins can read admin list" on public.admin_users
  for select to authenticated using (private.is_admin());

-- ---------------------------------------------------------------------------
-- Product policies
-- ---------------------------------------------------------------------------

drop policy if exists "anon can read visible products" on public.products;
create policy "anon can read visible products"
  on public.products for select
  to anon
  using (is_visible = true);

drop policy if exists "authenticated has full access" on public.products;

drop policy if exists "admins can read all products" on public.products;
create policy "admins can read all products" on public.products
  for select to authenticated using (private.is_admin());
drop policy if exists "admins can insert products" on public.products;
create policy "admins can insert products" on public.products
  for insert to authenticated with check (private.is_admin());
drop policy if exists "admins can update products" on public.products;
create policy "admins can update products" on public.products
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists "admins can delete products" on public.products;
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
-- Categories, store settings and branches
-- ---------------------------------------------------------------------------
-- Owner-editable via /admin/categories and /admin/settings. Public reads are
-- allowed (this is published contact/catalogue data); writes are admin-only.

create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Singleton: the boolean PK plus check constraint permits exactly one row.
create table if not exists public.store_settings (
  id boolean primary key default true check (id),
  name text not null,
  location_label text not null,
  phone text not null,
  instagram_handle text not null,
  instagram_url text not null,
  opening_hours text not null,
  whatsapp_number text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.store_locations (
  id text primary key,
  name text not null,
  address text not null,
  maps_url text not null,
  lat double precision not null,
  lng double precision not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.store_settings enable row level security;
alter table public.store_locations enable row level security;

create index if not exists categories_sort_idx on public.categories (active, sort_order);
create index if not exists products_category_id_idx on public.products (category_id);

-- Products reference categories for real, instead of a hand-maintained CHECK list.
alter table public.products drop constraint if exists products_category_id_check;
alter table public.products drop constraint if exists products_category_id_fkey;
alter table public.products
  add constraint products_category_id_fkey
  foreign key (category_id) references public.categories(id) on update cascade on delete restrict;

drop policy if exists "anon can read active categories" on public.categories;
create policy "anon can read active categories" on public.categories
  for select to anon using (active = true);
drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories" on public.categories
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "anon can read store settings" on public.store_settings;
create policy "anon can read store settings" on public.store_settings
  for select to anon using (true);
drop policy if exists "admins manage store settings" on public.store_settings;
create policy "admins manage store settings" on public.store_settings
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "anon can read active locations" on public.store_locations;
create policy "anon can read active locations" on public.store_locations
  for select to anon using (active = true);
drop policy if exists "admins manage locations" on public.store_locations;
create policy "admins manage locations" on public.store_locations
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop trigger if exists categories_touch_updated_at on public.categories;
create trigger categories_touch_updated_at before insert or update on public.categories
  for each row execute function private.touch_updated_at();
drop trigger if exists store_settings_touch_updated_at on public.store_settings;
create trigger store_settings_touch_updated_at before insert or update on public.store_settings
  for each row execute function private.touch_updated_at();
drop trigger if exists store_locations_touch_updated_at on public.store_locations;
create trigger store_locations_touch_updated_at before insert or update on public.store_locations
  for each row execute function private.touch_updated_at();

-- Seed the five categories the storefront is built around, plus current store
-- details. Idempotent — safe to re-run.
insert into public.categories (id, name, slug, description, active, sort_order) values
  ('new','New Arrivals','new-arrivals','Fresh pieces to discover.',true,1),
  ('mens','Men''s','mens','Everyday and occasion-ready styles.',true,2),
  ('womens','Women''s','womens','Contemporary pieces for your wardrobe.',true,3),
  ('accessories','Accessories','accessories','Finishing touches for your look.',true,4),
  ('gifts','Gifts','gifts','Thoughtful finds to take home.',true,5)
on conflict (id) do nothing;

insert into public.store_settings (id, name, location_label, phone, instagram_handle, instagram_url, opening_hours, whatsapp_number)
values (true, 'Fashion Factory Nepal', 'Kathmandu Valley, Nepal · Kirtipur & Budhanilkantha',
        '+977 9840260456', '@fashion.factory_2022', 'https://www.instagram.com/fashion.factory_2022/',
        '9:00 AM – 5:00 PM daily', '9779840260456')
on conflict (id) do nothing;

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

drop policy if exists "public can read product images" on storage.objects;
create policy "public can read product images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "admins can upload product images" on storage.objects;
create policy "admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and private.is_admin());

drop policy if exists "admins can update product images" on storage.objects;
create policy "admins can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and private.is_admin())
  with check (bucket_id = 'product-images' and private.is_admin());

drop policy if exists "admins can delete product images" on storage.objects;
create policy "admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and private.is_admin());

-- Next: apply 0002_multi_store.sql, then follow docs/DEPLOYMENT.md for the
-- steps that must be done by hand (disabling public sign-ups, creating the
-- owner account, granting it admin rights, and copying the API keys).
