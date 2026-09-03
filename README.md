# Jutta Nepal

A storefront for **Jutta Nepal**, a shoe and clothing store in Bhaisepati, Lalitpur —
and the platform it runs on. One codebase serves any number of stores:
everything store-specific (name, contact details, social handles, branding,
copy, which sections render) is data, not code.

This deployment serves `jutta-nepal`. The repository began as the storefront
for another shop, Fashion Factory Nepal, which is still the platform's default
tenant in the database and still referenced by the earlier migrations — none of
it reaches this storefront, which reads only the committed JSON in `src/data`.

**What is and is not filled in.** Jutta Nepal's identity, contact details,
policy, branch and SEO are complete and real. The **product catalogue is
deliberately empty**: no photography has been supplied, and stock images would
put shoes the shop does not sell on its own storefront. Every surface handles
that state on purpose — see
[public/images/jutta-nepal/README.md](public/images/jutta-nepal/README.md) for
what happens where, and how to fill it.

**Deploying it? Start with [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).**

## Stack

- Next.js + React
- TypeScript
- CSS with an editorial design system
- Provider/service architecture

## Architecture

```text
UI components
  -> hooks
  -> services
  -> provider adapters
  -> static provider   (committed JSON — what the live storefront reads)
  -> live providers    (Supabase, Instagram, Telegram — admin and integrations)
  -> mock providers    (development content)
```

Business content lives in `src/data` and domain contracts live in `src/models`. UI components should consume hooks/services rather than importing mock data directly.

### One codebase, many stores

`StoreProfile` (`src/models`) is the tenant contract: identity, contact details,
social handles, branding tokens, feature flags, SEO metadata and storefront copy.
It is served by `StoreSettingsService` like any other data, and is also readable
synchronously via `getStoreProfile()` for the three callers that cannot await —
Next's `metadata` export, the OG image, and module-level constants.

A deployment serves exactly one store, chosen when its data is generated
(`STORE_SLUG`). In the database every content row carries a `store_id`, and RLS
scopes each admin to the store they belong to. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#9-adding-another-store) for how to add one.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

The site runs with no environment variables at all: content comes from the
committed JSON in `src/data`, the contact form no-ops, and `/admin` reports that
it is not configured. (Jutta Nepal has the Instagram section switched off in its
feature flags until there is a real feed to show, so no placeholder strip
renders either.) Copy
`.env.example` to `.env.local` and fill in the Supabase values to work on
`/admin`.

### Checks

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # next build
npm run validate   # all three, in that order
```

## Integrations

Collections, homepage copy, testimonials and FAQs still come from mock providers
(`src/data/mock.ts`); products, categories and store details come from the
committed JSON that the admin's Publish flow regenerates. The homepage hero
image is one of the mock-provider fields and is **optional** — with none set,
the hero renders the brand ground rather than a photograph.

Contact and Instagram switch between mock and live behavior automatically based on **environment variables set on the host** — no code change or redeploy needed to go live:

- **Contact form** (`src/app/api/contact/route.ts`): forwards to a Telegram bot when `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` are set; otherwise behaves like the mock provider. Create a bot via `@BotFather`, then read `https://api.telegram.org/bot<token>/getUpdates` after messaging it once to find your chat id.
- **Instagram feed** (`src/app/api/instagram/route.ts`): pulls from the Instagram Graph API when `INSTAGRAM_ACCESS_TOKEN` is set; otherwise falls back to mock posts.
- **Analytics** (`src/providers/live/analytics.ts`): GA4/Meta Pixel scripts only render (in `src/app/layout.tsx`) when `NEXT_PUBLIC_GA_MEASUREMENT_ID` / `NEXT_PUBLIC_META_PIXEL_ID` are set.

All three secrets (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `INSTAGRAM_ACCESS_TOKEN`) are read server-side only — they are never bundled into client code. Set them in the hosting platform's environment variable settings (e.g. Vercel project settings), not in a committed file.

Future integrations (a real product/CMS/DB backend) should implement the remaining provider interfaces in `src/providers/interfaces.ts` and be wired the same way, without changing presentation components. See `.env.example` for all configuration placeholders.

## Admin panel (`/admin`)

A self-serve panel so the shop owner can manage product photos/name/category/
visibility/order without touching code — one owner, one login, no analytics,
no order management, no rich-text editor.

**The public site never calls Supabase directly.** Products are read from the
committed `src/data/products.json`, exactly like every other mock data file — zero
network calls, and the site is unaffected even if the Supabase project is paused
or deleted. The admin's **Publish to site** button is what closes the loop:

```
Admin (Supabase, live CRUD + RLS)
  -> "Publish to site" button
  -> POST /api/admin/publish (verifies the session, then triggers a GitHub
     workflow_dispatch using a server-only GITHUB_PUBLISH_TOKEN)
  -> .github/workflows/publish.yml runs scripts/generate-site-data.mjs
     (using the Supabase service-role key, a GitHub Actions secret — never a
     host env var, never client code), validates the data, and commits
     src/data/products.json, categories.json and store.json
  -> push triggers the host's normal redeploy
```

The generator validates before writing and exits non-zero on problems that
would break the storefront — a product with no slug, a duplicate slug, a
product pointing at an inactive category, no active categories, or a store slug
that does not exist. It also refuses to publish an **empty catalogue**, or one
that loses more than half its products, unless `ALLOW_EMPTY_CATALOGUE=1` or
`ALLOW_CATALOGUE_SHRINK=1` says so explicitly: Publish is a one-click action and
the storefront is whatever it writes. Missing product photos are warnings, not
failures.

Admin sections: **Overview** (what needs attention), **Products** (CRUD,
reorder, visibility, image upload), **Categories** (rename/describe/reorder/
hide — ids and slugs are locked because products reference them and they appear
in live URLs), and **Settings** (identity, contact details, social handles,
storefront copy, the returns/exchange policy, SEO, which sections render, and
branch addresses — these drive every Call/WhatsApp/Directions CTA on the public
site).

### Authorization model

Being signed in grants **nothing**. Access is granted only by membership in
`public.admin_users`, and that is enforced at three independent layers:

1. **`src/middleware.ts`** — runs before any `/admin` page or `/api/admin` route.
   Verifies the session with `getUser()` (which revalidates the token, unlike
   `getSession()`, whose cookie payload is not trustworthy on its own), then
   checks `admin_users` membership. Non-admins are redirected; API calls get 403.
2. **Server-side re-check** — `requireAdmin()` in `src/lib/supabase/server.ts`,
   called inside the publish route itself, so the endpoint is safe even if
   middleware matching ever changes.
3. **RLS** — every policy calls `private.can_manage_store(store_id)`. This is the
   last line of defense and holds even if the app is bypassed entirely and the
   REST API is called directly with the anon key. An admin of one store cannot
   read or write another store's rows.

Two things RLS alone cannot express, added in `0003`:

- **Column-level protection.** Policies decide which *rows* you may write, never
  which *columns*, so a `BEFORE UPDATE` trigger refuses changes to `id`, `slug`,
  `is_active`, `is_default`, `created_at` and `site_url` unless the caller is a
  platform admin. Hiding the fields in the admin UI is not protection: a store
  admin holds a valid session and can call PostgREST directly.
- **Per-store publish.** `/api/admin/publish` calls
  `public.admin_manages_store()` before dispatching, so an admin of store B
  cannot trigger store A's workflow. See
  [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#8a-the-permission-model) for the full
  matrix.

Sessions are cookie-based (`@supabase/ssr`), not `localStorage` — that is what
makes server-side checks possible at all.

Adding an admin is deliberately a SQL/dashboard operation, so the web host never
needs a privileged key:

```sql
-- store_id null = platform admin (every store); pass a store's id to scope them.
insert into public.admin_users (user_id, email, store_id)
select id, email, null from auth.users where email = 'owner@example.com';
```

Setup:
1. Create a free Supabase project, then apply `supabase/migrations/` in filename
   order, `0001` through `0006`. Together they create `stores`, `products`,
   `categories`, `store_locations`, `admin_users`, the store-scoped RLS
   policies, the `product-images` bucket, the `jutta-nepal` store with its
   categories and branch, the `returns_policy` column the footer, FAQ and
   product pages read, and the clothing rails alongside the footwear ones.
2. In Authentication > Providers, turn off public sign-ups, manually add the
   owner account under Authentication > Users, then grant it admin rights with
   the SQL above.
3. Set `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` on the host,
   and `GITHUB_PUBLISH_TOKEN` (+ `GITHUB_REPO`) alongside the existing Telegram
   secrets — the latter are server-only, never `NEXT_PUBLIC_`.
   Note: unlike the server-only secrets, `NEXT_PUBLIC_*` values are inlined into
   the bundle **at build time**, so adding them requires a redeploy before
   `/admin` picks them up.
4. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY` as
   **GitHub Actions secrets** (Settings > Secrets and variables > Actions) — the
   service-role key must never leave GitHub Actions.

Until those are configured, `/admin` shows a clear "not configured" state — same
inert-by-default pattern as the Telegram/Instagram integrations above.

`.github/workflows/keepalive.yml` pings Supabase every 3 days (`workflow_dispatch`
also available) to stay ahead of the free tier's 7-day inactivity pause; it no-ops
cleanly if the secrets above aren't set yet. `/admin` is excluded from search via
`robots.ts` and per-page `noindex` metadata.

## Store policy

Returns and exchange terms live on the store profile (`returnsPolicy`, editable
in `/admin → Settings`), not in page copy, and render in three places from that
one string: the footer, the FAQ list, and every product page. A store that
records none renders no policy line anywhere — the site never states terms on a
shop's behalf.

## Important

Imagery is business data, not code: product photos are uploaded through
`/admin` and reach the site through Publish, and fixed brand imagery goes in
`public/images/<store>/`. Neither needs a component change. No credentials or
API secrets belong in the frontend.
