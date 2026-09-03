# Production deployment

How to take this repository from a fresh clone to a live storefront, and how to
add another store to the same platform afterwards.

**This deployment serves `jutta-nepal`** (Jutta Nepal, shoes and clothing,
Bhaisepati, Lalitpur). `0005_jutta_nepal_store.sql` seeds that store, its
categories and its branch, and `0006_shoes_and_clothing.sql` widens the rail
list to cover clothing, so after the migrations the only store-specific work
left is the product catalogue. Where a step below needs a store slug, use `jutta-nepal`;
`fashion-factory-nepal` still exists as the platform's default tenant and is
used in some examples as the "other store".

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
| `GITHUB_PUBLISH_TOKEN` | for Publish | Fine-grained PAT, this repo only, **Actions: read and write** and nothing else. Not Contents — see below. |
| `GITHUB_REPO` | for Publish | `owner/repo`. |
| `GITHUB_PUBLISH_REF` | for Publish | **Must** be the branch Vercel deploys from. |

> `NEXT_PUBLIC_*` values are inlined into the JavaScript bundle **at build time**.
> Adding or changing one requires a redeploy before it takes effect. Server-only
> secrets apply on the next request.

**Least privilege on `GITHUB_PUBLISH_TOKEN`.** `POST /repos/{owner}/{repo}/actions/workflows/{id}/dispatches`
requires the fine-grained **Actions: write** permission and nothing more
([GitHub: permissions required for fine-grained PATs](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens)).
The commit and push are made *inside* the workflow by `GITHUB_TOKEN`, which
`publish.yml` grants `contents: write` for that run only — so the PAT never
needs repository write access. This matters because the PAT lives on the web
host: scoped to Actions alone, a leak lets someone start a publish; with
Contents write it would let them push code to the branch that redeploys itself.
Set an expiry and re-issue on schedule.

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
  before launch, change both together. See §4a first — as the repository stands,
  neither branch is ready to be pointed at without a decision.
- **Region**: `vercel.json` pins functions to `sin1` (Singapore), matching the
  Supabase region. If your plan rejects a fixed region, remove the `regions` key.

Everything the app runs server-side (middleware, the three API routes) is a
standard Next.js serverless function — no extra runtime configuration.

---

## 4a. Branch topology — settle this before importing to Vercel

Two *different* branches matter, and conflating them is what breaks Publish:

| Role | What GitHub/Vercel does with it | Must be |
| --- | --- | --- |
| **Default branch** (repo setting) | Where GitHub looks up a workflow **by filename** when `POST /actions/workflows/publish.yml/dispatches` is called | A branch that contains `.github/workflows/publish.yml` |
| **Deploy branch** = `GITHUB_PUBLISH_REF` = Vercel production branch | Checked out by the workflow, receives the regenerated JSON commit, and is what Vercel builds | A branch that contains the application |

`workflow_dispatch` resolves the workflow file on the **default branch only**.
The `ref` you dispatch with decides which branch's *copy* of the workflow runs
and which branch it pushes to — it does not affect the lookup. A workflow that
exists only on a feature branch cannot be dispatched at all; the API answers
`404` and the Publish button reports "GitHub refused the publish (404…)".

**As this repository stands today, that lookup will fail.**

- Default branch is `main`. `main` contains only `.gitattributes`, `index.html`,
  a logo `.jpg` and a `.rar` — the original static landing page the repository
  started as. It has **no `.github/workflows/` directory at all**.
- `feat/fashion-factory-foundation` holds the entire application, all three
  workflows, and every commit that matters.

So Publish returns 404 no matter how correctly the three environment variables
are set, and a Vercel import left on its default settings would build `main` and
deploy that stray `index.html` as the storefront.

**[HUMAN]** Pick one before deploying. Both are one-time decisions:

- **Option A — merge to `main` (recommended).** Merge
  `feat/fashion-factory-foundation` into `main`, keep `main` as the default
  branch, set the Vercel production branch and `GITHUB_PUBLISH_REF` to `main`.
  This is the conventional layout, and it makes the default branch and the
  deploy branch the same branch, which removes the whole class of problem.
  `main` is an **ancestor** of the app branch, so this is a clean fast-forward
  with no conflicts to resolve. It removes `index.html` and the `.rar` from the
  tip, because commit `d15fe88` deleted them deliberately when the static page
  was replaced by the app; the logo lives on as `src/app/icon.jpg`, and both
  removed files stay recoverable from history at `cb921fc`.
- **Option B — change the default branch.** Repo → Settings → Branches → change
  the default to `feat/fashion-factory-foundation`, and set the Vercel
  production branch and `GITHUB_PUBLISH_REF` to the same. Nothing is merged and
  `main` is left as-is. Faster, but the repository keeps shipping production
  from a branch named `feat/…`.

Verify afterwards, before wiring the Publish button:

```
gh api repos/d3zathon/fashionfactory --jq .default_branch
gh api "repos/d3zathon/fashionfactory/contents/.github/workflows?ref=$(gh api repos/d3zathon/fashionfactory --jq .default_branch)" --jq '.[].name'
```

The second command must list `publish.yml`. If it 404s, Publish will 404 too.

---

## 5. Domain and DNS

**[HUMAN]** Every step here needs your registrar and Vercel accounts. Work
through it in order — several steps depend on the one before.

**Step 1 — deploy on the Vercel subdomain first.** Get
`<project>.vercel.app` building and working *before* attaching the domain. A
broken build and a broken DNS record look identical from the browser, and
debugging both at once wastes an afternoon.

**Step 2 — decide the canonical host.** Pick one and treat the other as a
redirect. `www.example.com` is the safer default: an apex domain cannot be a
CNAME, so it needs A records that break if Vercel ever changes IPs, whereas
`www` follows a CNAME automatically. Whichever you pick is what
`NEXT_PUBLIC_SITE_URL` must equal.

**Step 3 — add both names in Vercel.** Project → Settings → Domains → Add.
Enter the apex (`example.com`) and `www.example.com`. Vercel will mark one as
the primary and offer to redirect the other; point the redirect at whichever you
chose in Step 2.

**Step 4 — create the DNS records your registrar needs.** Vercel shows the exact
values on the Domains screen after Step 3 — **use what it shows you**, not the
table below, which records only its usual defaults and is not a promise:

| Record | Name / Host | Value | TTL |
| --- | --- | --- | --- |
| `A` | `@` (apex) | `76.76.21.21` | Automatic / 3600 |
| `CNAME` | `www` | `cname.vercel-dns.com` | Automatic / 3600 |

Notes that catch people out:
- Some registrars want the host as `@`, others want it blank, others want the
  full domain. All three mean the apex.
- A trailing dot on the CNAME value (`cname.vercel-dns.com.`) is required by
  some registrars and rejected by others. Follow the registrar's own examples.
- Delete any pre-existing `A`, `AAAA` or `CNAME` record on the same name first —
  parking pages left behind by the registrar are the usual cause of a domain
  that resolves somewhere unexpected.
- If the domain sits behind Cloudflare, set the records to **DNS only** (grey
  cloud) until the certificate is issued. Proxied records stop Vercel's
  validation.

**Step 5 — wait for propagation and the certificate.** Vercel's Domains screen
moves to "Valid Configuration" and issues a Let's Encrypt certificate on its
own. Typically minutes; up to 48 hours if the previous TTL was long. Check with:

```
nslookup example.com
nslookup www.example.com
```

**Step 6 — set `NEXT_PUBLIC_SITE_URL` and redeploy.** Set it to the final
canonical origin, no trailing slash (e.g. `https://www.example.com`). This is a
`NEXT_PUBLIC_` value, inlined at build time, so it does **not** take effect
until you trigger a fresh deployment. Until then `sitemap.xml`, `robots.txt` and
social preview images all carry the old origin.

**Step 7 — update Supabase's auth URLs.** §6 below. Sign-in silently bounces
back to `/admin/login` if the Site URL still says `localhost`.

**Step 8 — verify on the live domain.**

```
curl -sI https://www.example.com | head -1                      # 200
curl -sI https://example.com | grep -i location                 # redirect to canonical
curl -s https://www.example.com/robots.txt | grep -i sitemap    # absolute, correct host
curl -s https://www.example.com/sitemap.xml | head -5           # not empty
```

Then sign in at `/admin` on the real domain and confirm the session sticks
across a refresh.

---

## 6. Supabase authentication URLs

**[HUMAN]** Authentication → URL Configuration:

- **Site URL**: the production origin, e.g. `https://juttanepal.com.np`
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
  jutta-nepal/<uuid>.webp
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

**Careful with the first publish.** The repository ships nine placeholder
products in `src/data/products.json`, and the live `products` table holds far
fewer real ones. Two guards in `scripts/generate-site-data.mjs` stand between
that mismatch and an emptied storefront, and **both are hard errors that abort
the publish**:

- **Empty catalogue** — no visible products at all. Overridable only with
  `ALLOW_EMPTY_CATALOGUE=1`, which `publish.yml` does not expose as an input at
  all, so the Publish button can never trigger it.
- **Catalogue shrink** — fires when the site already shows 4 or more products
  and the publish would cut that to less than half. Overridable only with
  `ALLOW_CATALOGUE_SHRINK=1`, which is exposed as the workflow's
  `allow_catalogue_shrink` input, defaults to `false`, and is **never sent by
  `/api/admin/publish`** — the route dispatches `store_slug` and nothing else.
  Enabling it therefore requires a deliberate manual run from the Actions tab.

With nine committed products and only a couple live, the first Publish **will be
refused by the shrink guard**, and that is the guard doing its job. The correct
response is to enter the real catalogue in `/admin` first — never to switch the
override on to get past it. Only tick `allow_catalogue_shrink` when you have
looked at the product list and genuinely intend the site to shrink.

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

- **Platform channels** — `service_role`, `postgres` and `supabase_admin` are
  exempt from the column guard. They bypass RLS anyway and are the platform
  operator's own channel (migrations, the SQL editor, the publish pipeline);
  blocking them would stop legitimate administration, not an attacker.
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

**These checks must impersonate a real user.** The SQL editor connects as
`postgres`, which is one of the platform's own administrative channels and is
deliberately exempt from the column guard — running the `update` below directly
in the editor will *succeed*, which is correct and proves nothing. Set the role
and the JWT claim first, as below, or run the equivalent from the app with that
account signed in.

```sql
-- 1. Protected columns are refused for a store admin.
--    Expected: ERROR 42501 "Only a platform administrator can change ...".
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"<store-admin-user-id>","role":"authenticated"}';
  update public.stores set slug = 'hijacked' where slug = 'fashion-factory-nepal';
rollback;

-- 2. Public reads follow the store's active flag. Expected: every count drops to
--    0 while the store is inactive, including public.stores itself.
update public.stores set is_active = false where slug = 'fashion-factory-nepal';
begin;
  set local role anon;
  select
    (select count(*) from public.products)        as products,
    (select count(*) from public.categories)      as categories,
    (select count(*) from public.store_locations) as locations,
    (select count(*) from public.stores)          as stores;
rollback;
update public.stores set is_active = true where slug = 'fashion-factory-nepal';

-- 3. Membership is not writable through the API. Expected: 0 rows.
select policyname, cmd from pg_policies
where schemaname = 'public' and tablename = 'admin_users' and cmd <> 'SELECT';

-- 4. Publish authorization answers per store. Expected: true for a store the
--    impersonated account manages, false for any other.
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"<store-admin-user-id>","role":"authenticated"}';
  select public.admin_manages_store('fashion-factory-nepal') as manages_a,
         public.admin_manages_store('some-other-store')      as manages_other;
rollback;

-- 5. Cross-tenant writes affect nothing. Expected: UPDATE 0.
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"<store-a-admin-user-id>","role":"authenticated"}';
  update public.products set name = 'should not happen'
  where store_id = (select id from public.stores where slug = 'some-other-store');
rollback;
```

This whole set was executed against a disposable staging project with two
stores, a platform admin, a store-scoped admin for each store, and an ordinary
signed-in account. It found two defects, both fixed in `0003`: anonymous reads
of `public.stores` failed outright because `anon` lacked EXECUTE on
`private.can_manage_store`, and the column guard also blocked `service_role` and
the SQL editor, which would have prevented legitimate platform administration.

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
   reuse. `0005_jutta_nepal_store.sql` is a worked example of all three
   statements (store, categories, branch) written to be idempotent.

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
business hours, branch list, categories, products, the returns/exchange policy,
the "Visit us" heading and step copy, SEO title/description/keywords, brand
colours (`accent`,
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
11. Enter the real product catalogue before the first Publish. Jutta Nepal ships
    with an **empty** `src/data/products.json` on purpose, so this is the one
    outstanding piece of content — until it is done the shop page shows its
    empty state and the homepage drops its product sections.
12. Walk the post-deployment checklist on the live domain.
