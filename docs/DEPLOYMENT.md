# Production deployment

How to take this repository from a fresh clone to a live storefront, and how to
add a second store to the same platform afterwards.

Steps marked **[HUMAN]** cannot be automated — they need an account, a secret, or
a decision only the owner can make. Everything else can be run by anyone with
the repository checked out.

---

## 0. What is actually being deployed

The storefront is **static**. Products, categories and store details are read
from committed JSON in `src/data/`, not from Supabase at request time. That
means:

- The public site keeps working even if the Supabase project is paused, broken
  or deleted.
- Changing a product is a two-step flow: edit it in `/admin` (which writes to
  Supabase), then press **Publish to site**, which regenerates the JSON and
  commits it, which triggers a redeploy.
- **One deployment serves one store.** Which store is decided at publish time by
  `STORE_SLUG`. Adding a store means another row and another deployment — never
  a fork of the code.

```
Admin (Supabase, live CRUD under RLS)
  -> "Publish to site"
  -> POST /api/admin/publish            verifies the session server-side
  -> GitHub workflow_dispatch           publish.yml
  -> scripts/generate-site-data.mjs     service-role key, validates, writes JSON
  -> commit to the deploy branch
  -> Vercel redeploys
```

---

## 1. Supabase setup

**[HUMAN]** Create a Supabase project (a free project is enough). Pick the region
closest to your customers — `ap-southeast-1` (Singapore) for Nepal.

**[HUMAN]** Authentication → Providers → Email: turn **off** "Allow new users to
sign up". Until this is off, anyone holding the public anon key can create an
account. They still get nothing (admin access is granted by the `admin_users`
table, not by being signed in), but leave sign-ups off regardless.

**[HUMAN]** Authentication → Users → "Add user": create the owner's account
manually, with a strong password.

**[HUMAN]** Authentication → Policies (or Auth settings): enable **leaked
password protection**. The security advisor flags this as disabled by default;
it checks new passwords against HaveIBeenPwned.

---

## 2. Database migrations

Apply the files in `supabase/migrations/` **in filename order**. Together they
are the whole schema.

| File | What it does |
| --- | --- |
| `0001_baseline.sql` | Products, categories, store settings, branches, `admin_users`, `private.is_admin()`, RLS, the `product-images` bucket. Every statement is re-runnable. |
| `0002_multi_store.sql` | Adds `stores`, attaches every content row to a store, narrows RLS from "is an admin" to "is an admin of this store", moves product images into per-store folders, and migrates the old singleton `store_settings` into `stores` before dropping it. |
| `0003_tenant_hardening.sql` | Closes the gaps RLS alone cannot: protects platform-only columns on `stores` with a trigger, makes public reads require an *active store* as well as an active row, and adds `public.admin_manages_store()` for per-store publish authorization. Reversible — the inverse of every statement is at the bottom of the file. |

Either paste each file into **Database → SQL Editor** and run it, or use the
Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

`0002` is **destructive in one place**: it drops `public.store_settings` after
copying its single row into `public.stores`. That is intentional — two sources
for the same contact details is how a storefront ends up showing a phone number
nobody answers. Take a backup first if the project holds data you cannot lose.

### Grant the owner admin rights

**[HUMAN]** After creating the account in step 1, run this in the SQL editor. A
`store_id` of `null` makes them a **platform admin** (every store); passing a
store's id scopes them to that store alone.

```sql
-- Platform admin (manages every store):
insert into public.admin_users (user_id, email, store_id)
select id, email, null from auth.users where email = 'owner@example.com';

-- Or scoped to one store:
insert into public.admin_users (user_id, email, store_id)
select u.id, u.email, s.id
from auth.users u, public.stores s
where u.email = 'manager@example.com' and s.slug = 'fashion-factory-nepal';
```

Adding an admin is deliberately a SQL operation: it means the web host never
needs a privileged key to manage membership.

### Verify

```sql
select slug, name, is_default from public.stores;
select count(*) from public.products;          -- 0 on a fresh project
select user_id, store_id from public.admin_users;
```

---

## 3. Environment variables

`.env.example` is the authoritative list, grouped by where each value belongs.
The short version:

### On the host (Vercel → Settings → Environment Variables)

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | **yes** | Absolute origin, no trailing slash. Without it `sitemap.xml` is empty and social previews cannot resolve image URLs. |
| `NEXT_PUBLIC_SUPABASE_URL` | for `/admin` | Project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | for `/admin` | Anon/publishable key. Public by design — RLS is the protection. |
| `NEXT_PUBLIC_STORE_SLUG` | no | Only when a build should serve a different tenant than the committed data. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | no | Analytics only renders when set. |
| `NEXT_PUBLIC_META_PIXEL_ID` | no | Same. |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | no | Contact form forwards to Telegram when both are set; no-ops otherwise. |
| `INSTAGRAM_ACCESS_TOKEN` | no | Live Instagram strip; placeholders otherwise. Expires every 60 days. |
| `GITHUB_PUBLISH_TOKEN` | for Publish | Fine-grained PAT, this repo only, **Contents: write** + **Actions: write**. |
| `GITHUB_REPO` | for Publish | `owner/repo`. |
| `GITHUB_PUBLISH_REF` | for Publish | **Must** be the branch Vercel deploys from. |

> `NEXT_PUBLIC_*` values are inlined into the JavaScript bundle **at build time**.
> Adding or changing one requires a redeploy before it takes effect. Server-only
> secrets apply on the next request.

### In GitHub Actions (Settings → Secrets and variables → Actions)

| Secret | Used by |
| --- | --- |
| `SUPABASE_URL` | `publish.yml`, `keepalive.yml` |
| `SUPABASE_SERVICE_ROLE_KEY` | `publish.yml` only |
| `SUPABASE_ANON_KEY` | `keepalive.yml` only |

**[HUMAN]** The service-role key bypasses RLS entirely. It belongs only in
GitHub Actions — never on the web host, never in `.env.local`, never in client
code.

---

## 4. Vercel configuration

**[HUMAN]** Import the repository into Vercel and connect the GitHub account.

- **Framework**: Next.js (auto-detected; `vercel.json` states it anyway).
- **Build command**: `npm run build` — set in `vercel.json`.
- **Install command**: `npm ci` — requires the committed `package-lock.json`.
- **Node**: 20.x, matching `engines` in `package.json` and CI.
- **Production branch**: must equal `GITHUB_PUBLISH_REF`. Today the repository's
  working branch is `feat/fashion-factory-foundation`; if you merge to `main`
  before launch, change both together.
- **Region**: `vercel.json` pins functions to `sin1` (Singapore), matching the
  Supabase region. If your plan rejects a fixed region, remove the `regions` key.

Everything the app runs server-side (middleware, the three API routes) is a
standard Next.js serverless function — no extra runtime configuration.

---

## 5. Domain and DNS

**[HUMAN]** Add the domain in Vercel → Settings → Domains, then create the
records it shows you at your registrar. Typically:

| Record | Name | Value |
| --- | --- | --- |
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Use whatever Vercel displays — the values above are its usual defaults, not a
promise. After the certificate is issued, set `NEXT_PUBLIC_SITE_URL` to the
final origin and **redeploy** (it is a `NEXT_PUBLIC_` value, so a redeploy is
required).

---

## 6. Supabase authentication URLs

**[HUMAN]** Authentication → URL Configuration:

- **Site URL**: the production origin, e.g. `https://fashionfactory.com.np`
- **Redirect URLs**: add
  - `https://<your-domain>/**`
  - `http://localhost:3000/**` for local development
  - your Vercel preview pattern if admins sign in on previews

Sessions are cookie-based (`@supabase/ssr`), which is what allows middleware and
server routes to verify them. Getting the Site URL wrong shows up as an admin
being bounced back to `/admin/login` after a seemingly successful sign-in.

---

## 7. Storage

`0001_baseline.sql` creates the `product-images` bucket: public reads, 2 MB
limit, WebP/JPEG/PNG only. The admin compresses uploads to WebP (~1200px,
quality 82) before they leave the browser, so the size limit is a backstop.

`0002_multi_store.sql` changes the layout to **one folder per store**:

```
product-images/
  fashion-factory-nepal/<uuid>.webp
  <another-store-slug>/<uuid>.webp
```

The write policies resolve that first path segment to a store and check the
caller administers it. Files already in the bucket root stay readable; new
uploads always go into a store folder.

**[HUMAN]** Nothing to do here unless you want a different size limit or a CDN
in front of the bucket.

---

## 8. Post-deployment checks

Run through these on the live domain, on a phone as well as a desktop:

**Build and pipeline**
- [ ] Vercel build succeeded; `npm run validate` passes locally on the same commit.
- [ ] `/sitemap.xml` lists the homepage, `/collection` and every product.
- [ ] `/robots.txt` disallows `/admin` and points at the sitemap.

**Storefront**
- [ ] Homepage renders with the store's name, hours and hero image.
- [ ] Layout holds at 320px, 375px and 414px as well as desktop.
- [ ] **Every contact link works**: `tel:` dials, WhatsApp opens with the message
      prefilled, Instagram and TikTok open the right profiles, and each branch's
      Directions link opens the correct Google Maps pin.
- [ ] Product pages load, and "More in this category" links between them.
- [ ] A wrong URL renders the 404 page rather than an error.

**Admin**
- [ ] `/admin` redirects to `/admin/login` when signed out.
- [ ] A signed-in account that is *not* in `admin_users` is refused.
- [ ] The owner can sign in, edit a product, upload a photo, and save settings.
- [ ] **Publish to site** triggers the workflow, and the commit it makes
      redeploys the site.

**Security**
- [ ] Supabase → Advisors → Security shows nothing unexpected.
- [ ] Public sign-ups are off.
- [ ] A store admin cannot change their store's `slug` (see the SQL check below).
- [ ] Deactivating a store (`is_active = false`) hides its products, categories
      **and** branch addresses from anonymous reads.
- [ ] `curl -sI https://<domain> | grep -i x-content-type-options` returns the header.
- [ ] The anon key is the only Supabase key present in the browser bundle.

**Careful with the first publish.** The live `products` table starts empty while
the repository ships nine placeholder products. The generator now refuses to
publish an empty catalogue for exactly this reason — add the real products in
`/admin` before pressing Publish.

---

## 8a. The permission model

Three roles, and what each may do.

| | Anonymous visitor | Store admin | Platform admin |
| --- | --- | --- | --- |
| Read visible products / active categories / active locations **of an active store** | yes | yes | yes |
| Read anything belonging to an **inactive** store | no | own store only | yes |
| Create / edit / delete products, categories, locations | no | own store only | any store |
| Edit store profile: name, contact, social, hours, copy, SEO, branding, features | no | own store only | any store |
| Change `id`, `slug`, `is_active`, `is_default`, `created_at`, `site_url` | no | **no** | yes |
| Create or delete a store | no | no | yes |
| Grant or revoke admin rights | no | no | SQL / service_role only |
| Trigger Publish | no | own store only | any store |
| Upload product images | no | own store's folder only | any folder |

A **platform admin** is a row in `admin_users` with `store_id` null; a **store
admin** has that store's id.

Two of these are worth being explicit about, because they are enforced somewhere
other than where you would look first:

- **Protected columns** are guarded by a `BEFORE UPDATE` trigger, not by a
  policy. RLS decides which *rows* you may write, never which *columns*, so the
  "store admins update their store" policy would otherwise have allowed a store
  admin to rename their own slug — repointing the publish pipeline — or flip
  `is_default`. The admin UI never offers these fields, but the UI is not the
  boundary: a store admin holds a valid session and can call PostgREST directly.
- **Admin membership** has a SELECT policy and deliberately no write policy, so
  every write through the API is denied and granting rights stays a SQL /
  service_role operation. `0003` asserts this at migration time, so a future
  migration that adds a write policy to `admin_users` fails loudly instead of
  quietly enabling self-promotion.

Publish authorization is checked twice: middleware refuses a session that does
not manage this deployment's store, and `/api/admin/publish` re-checks through
`public.admin_manages_store()` before dispatching, so an admin of store B cannot
trigger store A's workflow even if the middleware matcher changes. The route also
names the store in the dispatch `inputs` rather than letting the generator fall
back to whatever `src/data/store.json` holds on that branch.

### Verifying the model

Run these after applying the migrations. They are the checks that would have
caught each gap `0003` closes, so they are worth re-running after any future
policy change.

```sql
-- 1. Protected columns are refused for a store admin and allowed for a platform
--    admin. Run as the store admin's role by impersonating their JWT in the SQL
--    editor, or from the app with that account signed in.
--    Expected: ERROR 42501 "Only a platform administrator can change ...".
update public.stores set slug = 'hijacked' where slug = 'fashion-factory-nepal';

-- 2. Public reads follow the store's active flag. Expected: the second count is
--    0 for every table once the store is deactivated.
update public.stores set is_active = false where slug = 'fashion-factory-nepal';
set local role anon;
select
  (select count(*) from public.products)        as products,
  (select count(*) from public.categories)      as categories,
  (select count(*) from public.store_locations) as locations;
reset role;
update public.stores set is_active = true where slug = 'fashion-factory-nepal';

-- 3. Membership is not writable through the API. Expected: 0 rows.
select policyname, cmd from pg_policies
where schemaname = 'public' and tablename = 'admin_users' and cmd <> 'SELECT';

-- 4. Publish authorization answers per store. Expected: true for a store the
--    signed-in account manages, false for any other.
select public.admin_manages_store('fashion-factory-nepal');
```

### Contact form abuse protection

`/api/contact` has three layers, none of which need an external service or a
secret:

1. **Honeypot** — a `contact_reference` field, off-screen and `aria-hidden`, that no human
   fills in. A submission carrying it is answered with the normal success
   response and silently dropped, so a script gets no signal to adapt to.
2. **Rate limit** — 5 submissions per client address per 10 minutes, returning
   `429` with `Retry-After`.
3. **Length caps** — names, phones and messages are bounded so the endpoint
   cannot be used to post a megabyte of text.

**Known limitation.** The rate limiter holds its counters in the memory of a
single serverless instance. On Vercel that means a flood spread across many cold
starts gets more than 5 through, and counters reset when an instance recycles. It
stops the realistic case — one script hammering one endpoint — at zero cost.

If you later need a limit that holds across instances, add
[Upstash Redis](https://upstash.com) (it has a free tier) and swap the body of
`src/lib/rateLimit.ts` for a `@upstash/ratelimit` call. That is the only step
that would introduce new secrets: `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN`, set as **server-only** host environment variables —
never `NEXT_PUBLIC_`, never committed. Nothing in the repository needs that
today.

---

## 9. Adding another store

No code changes, no fork.

1. **Insert the store** (SQL editor, as a platform admin):

   ```sql
   insert into public.stores (slug, name, tagline, description, phone, whatsapp_number,
                              location_label, opening_hours, instagram_handle, instagram_url,
                              branding, features)
   values ('kathmandu-denim', 'Kathmandu Denim', 'Built to last.',
           'A denim specialist in Patan.', '+977 9800000000', '9779800000000',
           'Patan, Nepal', '10:00 AM – 7:00 PM daily',
           '@kathmandu.denim', 'https://www.instagram.com/kathmandu.denim/',
           '{"accent":"#1f3a5f","wordmark":["KATHMANDU","DENIM"]}'::jsonb,
           '{"styleQuiz":false}'::jsonb);
   ```

2. **Add its categories and branches**, using the same `store_id`. Category ids
   only need to be unique within the store, so `new`/`mens`/`womens` are free to
   reuse.

3. **Grant an admin**: insert into `admin_users` with that store's `store_id`.

4. **Deploy it**: a second Vercel project from the same repository, with
   `NEXT_PUBLIC_STORE_SLUG=kathmandu-denim` and its own `NEXT_PUBLIC_SITE_URL`
   and domain.

5. **Publish its data**: run the publish workflow with `store_slug` set to the
   new slug. It regenerates `src/data/*.json` for that store.

> **The one sharp edge.** `src/data/*.json` is a single committed copy, so two
> stores publishing to the same branch overwrite each other. For more than one
> store, give each a branch (`store/kathmandu-denim`) with its own
> `GITHUB_PUBLISH_REF`, and point that store's Vercel project at it. If you get
> to a handful of stores, that is the moment to move the storefront from
> committed JSON to fetch-at-build (`generateStaticParams` + ISR against
> Supabase) — the provider layer already isolates that change to
> `src/providers/`.

### What a store can configure without code

Name, slug, tagline, description, logo, favicon, phone, WhatsApp, email,
Instagram, TikTok, Facebook, address, location label, opening hours, structured
business hours, branch list, categories, products, the "Visit us" heading and
step copy, SEO title/description/keywords, brand colours (`accent`,
`accentDeep`, `accentLight`, `ink`, `paper`), the wordmark, and which sections
render (`styleQuiz`, `instagramFeed`, `testimonials`, `faqs`, `contactForm`,
`locations`).

---

## 10. Summary of human-only steps

1. Create the Supabase project and choose its region.
2. Turn off public sign-ups; enable leaked-password protection.
3. Create the owner's auth account and grant it admin rights via SQL.
4. Apply the migrations (or approve someone doing it).
5. Copy the API keys into Vercel and GitHub Actions.
6. Create the GitHub PAT for the publish pipeline.
7. Connect the repository to Vercel and pick the production branch.
8. Configure the domain at the registrar and set `NEXT_PUBLIC_SITE_URL`.
9. Set the Supabase Site URL and redirect URLs.
10. Create the Telegram bot and the Instagram token, if those integrations are wanted.
11. Enter the real product catalogue before the first Publish.
12. Walk the post-deployment checklist on the live domain.
