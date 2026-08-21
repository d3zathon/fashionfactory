# Fashion Factory Nepal

Production-oriented frontend foundation for Fashion Factory Nepal, Kathmandu.

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
  -> mock provider (current)
  -> API/CMS provider (future)
```

Business content lives in `src/data` and domain contracts live in `src/models`. UI components should consume hooks/services rather than importing mock data directly.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Current phase

Product/category/collection/content data still comes from mock providers (`src/data/mock.ts`). Phone, WhatsApp, Instagram, and Google Maps links use the supplied business information.

Contact and Instagram now switch between mock and live behavior automatically based on **environment variables set on the host** — no code change or redeploy needed to go live:

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
  -> .github/workflows/publish.yml runs scripts/generate-products-json.mjs
     (using the Supabase service-role key, a GitHub Actions secret — never a
     host env var, never client code) and commits src/data/products.json
  -> push triggers the host's normal redeploy
```

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
3. **RLS** — every policy calls `private.is_admin()`. This is the last line of
   defense and holds even if the app is bypassed entirely and the REST API is
   called directly with the anon key.

Sessions are cookie-based (`@supabase/ssr`), not `localStorage` — that is what
makes server-side checks possible at all.

Adding an admin is deliberately a SQL/dashboard operation, so the web host never
needs a privileged key:

```sql
insert into public.admin_users (user_id, email)
select id, email from auth.users where email = 'owner@example.com';
```

Setup:
1. Create a free Supabase project, then run `supabase/schema.sql` in its SQL
   editor (creates `products`, `admin_users`, `private.is_admin()`, RLS
   policies, and the `product-images` storage bucket + policies).
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

## Important

Development imagery is clearly separated from business data so real store/product media can be substituted through `MediaService` without rewriting the UI. No credentials or API secrets belong in the frontend.
