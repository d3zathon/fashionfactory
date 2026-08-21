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

## Important

Development imagery is clearly separated from business data so real store/product media can be substituted through `MediaService` without rewriting the UI. No credentials or API secrets belong in the frontend.
