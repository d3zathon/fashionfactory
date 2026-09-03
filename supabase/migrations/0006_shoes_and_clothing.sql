-- Jutta Nepal sells clothing as well as shoes.
--
-- 0005 seeded a footwear-only rail list, which was what the store had been
-- described as. This widens it. Doing it as its own migration rather than by
-- editing 0005 is deliberate: 0005 may already be applied, and a migration
-- that has run is history — rewriting it makes an applied database and a fresh
-- one disagree about what the schema is.
--
-- Timing matters more than the content here. Category ids and slugs are locked
-- once products reference them (they are the primary key products point at,
-- and they appear in live URLs like /collection?c=sneakers), so the rail list
-- has to be right BEFORE the first catalogue is entered. Right now no product
-- rows exist, which is the only moment this is free.
--
-- Additive and idempotent. No table, policy or column is touched, no other
-- store's rows are read or written, and re-running changes nothing.

-- ---------------------------------------------------------------------------
-- 1. Retire the ambiguous women's-footwear rail
-- ---------------------------------------------------------------------------
-- `womens` meant women's *shoes*. With clothing on the site that reading stops
-- holding the moment a dress is filed under it, and two rails called "Women's"
-- and "Women's Clothing" would be worse still.
--
-- Deactivated rather than deleted, for two reasons: `active = false` is already
-- how the storefront and the publish generator exclude a rail, so this is the
-- supported way to retire one; and a delete would be irreversible against a
-- database this migration cannot inspect. If the shop later wants a women's
-- footwear rail, this row is renamed to "Women's Shoes" and switched back on
-- rather than re-created. It can be deleted outright once you have confirmed
-- no product points at it.
update public.categories c
   set active = false
  from public.stores s
 where c.store_id = s.id
   and s.slug = 'jutta-nepal'
   and c.id = 'womens';

-- ---------------------------------------------------------------------------
-- 2. Add the clothing rails
-- ---------------------------------------------------------------------------
-- Shoe rails stay type-based and unisex (Sneakers, Formal & Office, Boots,
-- Sandals & Slides); clothing splits by who it is for, which is how the two
-- families are actually shopped. Seven active rails in total, which is about
-- the ceiling before the homepage index reads as a long list.
insert into public.categories (store_id, id, name, slug, description, active, sort_order)
select s.id, v.id, v.name, v.slug, v.description, true, v.sort_order
from public.stores s
cross join (values
  ('mens-clothing',   'Men''s Clothing',   'mens-clothing',   'Shirts, tees, trousers and outerwear.', 6),
  ('womens-clothing', 'Women''s Clothing', 'womens-clothing', 'Tops, dresses, trousers and outerwear.', 7)
) as v(id, name, slug, description, sort_order)
where s.slug = 'jutta-nepal'
on conflict (store_id, id) do nothing;

-- ---------------------------------------------------------------------------
-- Rollback
-- ---------------------------------------------------------------------------
--   delete from public.categories c using public.stores s
--    where c.store_id = s.id and s.slug = 'jutta-nepal'
--      and c.id in ('mens-clothing', 'womens-clothing');
--   update public.categories c set active = true from public.stores s
--    where c.store_id = s.id and s.slug = 'jutta-nepal' and c.id = 'womens';
