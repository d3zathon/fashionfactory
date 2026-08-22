-- Tenant hardening.
--
-- 0002 scoped every write to "an admin of this store". Three gaps remained,
-- all of them reachable by calling the REST API directly with a valid store
-- admin session — the admin UI never offers these, which is exactly why they
-- cannot be left to the UI:
--
--   1. A store admin could UPDATE their own store's slug, is_active, is_default
--      or id. RLS checks which ROWS you may touch, never which COLUMNS, so the
--      "store admins update their store" policy permitted all of them. Changing
--      a slug repoints the publish pipeline at a different tenant's data;
--      is_default moves the platform's default store; is_active takes a
--      storefront offline.
--   2. Public reads of categories and store_locations checked only the row's own
--      `active` flag, not whether its store is active — so deactivating a store
--      hid its products but still served its categories and branch addresses.
--   3. private.can_manage_store_slug() LEFT JOINed stores, so a slug that
--      matched no store still returned true for a platform admin, letting the
--      storage policies accept uploads into arbitrary folders.
--
-- Verified against a disposable staging project with two stores, a platform
-- admin, a store-scoped admin for each, and an ordinary signed-in account. That
-- run found two further defects, fixed here and marked "caught in staging"
-- below: anonymous reads of public.stores failed outright, and the column guard
-- also blocked the platform's own service_role and SQL-editor connections.
--
-- Reversible: every statement here has a stated inverse in the "Rollback"
-- section at the bottom of this file.

-- ---------------------------------------------------------------------------
-- 1. Platform-controlled columns on public.stores
-- ---------------------------------------------------------------------------
-- Enforced with a trigger rather than column privileges, because REVOKE UPDATE
-- (slug, ...) applies to the whole `authenticated` role and would lock platform
-- admins out too — they authenticate exactly like everyone else. A trigger can
-- ask *who* is updating.

-- SECURITY INVOKER on purpose, so current_user is the role that actually issued
-- the UPDATE. A SECURITY DEFINER trigger reports its own owner instead, which
-- makes the platform's own credentials indistinguishable from a shopkeeper's.
create or replace function private.guard_protected_store_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- The platform's own administrative channels. service_role bypasses RLS
  -- entirely and belongs to the publish pipeline; postgres/supabase_admin is
  -- the SQL editor and migrations. Without this the guard also blocks the
  -- operator running the documented setup and rollback SQL by hand — caught in
  -- staging, where deactivating a store from the SQL editor was refused.
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  -- Platform admins may change anything.
  if private.is_platform_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.slug is distinct from old.slug
     or new.is_active is distinct from old.is_active
     or new.is_default is distinct from old.is_default
     or new.created_at is distinct from old.created_at
     -- site_url decides canonical URLs and where the deployment believes it
     -- lives; it belongs to whoever runs the deployment, not the shopkeeper.
     or new.site_url is distinct from old.site_url then
    raise exception
      'Only a platform administrator can change a store''s id, slug, is_active, is_default, created_at or site_url.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_protected_store_columns() from public;

drop trigger if exists stores_guard_protected_columns on public.stores;
create trigger stores_guard_protected_columns
  before update on public.stores
  for each row execute function private.guard_protected_store_columns();

-- Membership is platform-controlled too. public.admin_users has a SELECT policy
-- and deliberately no INSERT/UPDATE/DELETE policy, so RLS denies every write
-- through the API — granting admin rights stays a SQL/service_role operation
-- and the web host never needs a privileged key. Asserted rather than assumed,
-- so a future migration that adds a write policy here fails loudly instead of
-- silently opening self-promotion.
do $$
declare
  write_policies int;
begin
  select count(*) into write_policies
  from pg_policies
  where schemaname = 'public' and tablename = 'admin_users' and cmd <> 'SELECT';

  if write_policies > 0 then
    raise exception
      'public.admin_users has % write policy/policies. Membership must stay service_role-only.', write_policies;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Public reads: active row AND active store
-- ---------------------------------------------------------------------------
-- STABLE and SECURITY DEFINER so the planner can cache it per statement and it
-- does not depend on the caller's own visibility of public.stores.

create or replace function private.store_is_active(target_store uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (select 1 from public.stores s where s.id = target_store and s.is_active);
$$;

revoke all on function private.store_is_active(uuid) from public;
grant execute on function private.store_is_active(uuid) to anon, authenticated;

-- 0002's "public can read active stores" policy is `is_active or
-- private.can_manage_store(id)`, but only granted that function to
-- `authenticated`. Postgres checks EXECUTE when the expression is evaluated, so
-- every anonymous SELECT on public.stores failed outright with
-- "42501: permission denied for function can_manage_store" — a policy named
-- "public can read" that the public could not use. Caught in staging.
--
-- Safe to grant: the function is SECURITY DEFINER, reports only on the caller's
-- own membership, and auth.uid() is null for anon, so it can only ever answer
-- false. Granting it is what makes the policy's first branch reachable.
grant execute on function private.can_manage_store(uuid) to anon;

drop policy if exists "public can read active categories" on public.categories;
create policy "public can read active categories" on public.categories
  for select to anon, authenticated
  using (active = true and private.store_is_active(store_id));

drop policy if exists "public can read active locations" on public.store_locations;
create policy "public can read active locations" on public.store_locations
  for select to anon, authenticated
  using (active = true and private.store_is_active(store_id));

-- Restated through the same helper so all three public policies read alike.
drop policy if exists "public can read visible products" on public.products;
create policy "public can read visible products" on public.products
  for select to anon, authenticated
  using (is_visible = true and private.store_is_active(store_id));

-- ---------------------------------------------------------------------------
-- 3. Slug resolution must require the store to exist
-- ---------------------------------------------------------------------------
-- The LEFT JOIN meant an unmatched slug produced a NULL store id, which a
-- platform admin's `store_id is null` clause still satisfied. An inner join
-- makes a non-existent slug deny everyone, which is what the storage write
-- policies need: the first path segment must name a real store.

create or replace function private.can_manage_store_slug(target_slug text)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.stores s
    join public.admin_users a
      on a.store_id is null or a.store_id = s.id
    where s.slug = target_slug
      and a.user_id = (select auth.uid())
  );
$$;

revoke all on function private.can_manage_store_slug(text) from public;
grant execute on function private.can_manage_store_slug(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Publish authorization, callable by the application
-- ---------------------------------------------------------------------------
-- /api/admin/publish must confirm the caller administers the store this
-- deployment serves, not merely that they are some store's admin. Exposed in
-- `public` because PostgREST cannot reach the `private` schema, and delegating
-- to the same helper the policies use keeps one definition of the rule rather
-- than a second copy in TypeScript that can drift.
--
-- It only ever reports on the caller's own rights, so it leaks nothing.

-- SECURITY INVOKER, not DEFINER: the privilege it needs already lives in
-- private.can_manage_store_slug(), which authenticated may execute, so this
-- wrapper does not need elevation of its own. Supabase's linter flags every
-- signed-in-callable SECURITY DEFINER function in an exposed schema, and it is
-- right to — keeping this one INVOKER means there is no elevated entry point on
-- the public API at all.
create or replace function public.admin_manages_store(store_slug text)
returns boolean
language sql
security invoker
stable
set search_path = ''
as $$
  select private.can_manage_store_slug(store_slug);
$$;

revoke all on function public.admin_manages_store(text) from public, anon;
grant execute on function public.admin_manages_store(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Rollback
-- ---------------------------------------------------------------------------
-- drop trigger if exists stores_guard_protected_columns on public.stores;
-- drop function if exists private.guard_protected_store_columns();
-- drop function if exists public.admin_manages_store(text);
--
-- drop policy if exists "public can read active categories" on public.categories;
-- create policy "public can read active categories" on public.categories
--   for select to anon, authenticated using (active = true);
-- drop policy if exists "public can read active locations" on public.store_locations;
-- create policy "public can read active locations" on public.store_locations
--   for select to anon, authenticated using (active = true);
-- drop policy if exists "public can read visible products" on public.products;
-- create policy "public can read visible products" on public.products
--   for select to anon, authenticated
--   using (is_visible = true and exists (select 1 from public.stores s where s.id = store_id and s.is_active));
--
-- drop function if exists private.store_is_active(uuid);
-- revoke execute on function private.can_manage_store(uuid) from anon;
--
-- -- restores 0002's LEFT JOIN form of private.can_manage_store_slug(text)
