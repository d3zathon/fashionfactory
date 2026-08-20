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

The frontend currently uses mock providers. Phone, WhatsApp, Instagram, and Google Maps links use the supplied business information. Contact inquiries are handled by a local mock provider.

Future integrations should implement the provider interfaces without changing presentation components. See `.env.example` for integration configuration placeholders.

## Important

Development imagery is clearly separated from business data so real store/product media can be substituted through `MediaService` without rewriting the UI. No credentials or API secrets belong in the frontend.
