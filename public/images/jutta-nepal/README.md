# Jutta Nepal image assets

Two places a Jutta Nepal image can live. Neither needs a component change.

## 1. Product photography → the admin panel (the normal path)

Product photos are **not** files in this repository. They are uploaded through
`/admin → Products`, stored in the Supabase `product-images` bucket, and reach
the storefront when **Publish to site** regenerates `src/data/products.json`
with the resulting URLs. That is the whole loop — no commit, no redeploy, and
the shop owner never touches code.

`src/data/products.json` currently holds an **empty catalogue**. Jutta Nepal's
own photography has not been supplied, and the alternative — stock photographs
of shoes or clothing the shop does not sell — would put
someone else's products on this storefront under Jutta Nepal's name. Every
page handles an empty catalogue deliberately rather than accidentally:

- the homepage drops its "Selected pairs" and editorial-photo sections
- the category index shows a typographic plate instead of a preview
- the shop page shows an empty state with a WhatsApp CTA
- a product card with no photo renders "Photo coming soon", never a blank
  `<img>`

Publish one real product and all of it comes back on its own.

## 2. Fixed brand imagery → this folder

For images that belong to the site rather than to the catalogue — a storefront
hero photograph, an OG override, a logo file — drop the file here and reference
it by its public path:

```
public/images/jutta-nepal/hero.jpg   →   /images/jutta-nepal/hero.jpg
```

The homepage hero is the one that matters today. It is **optional**: with no
hero image the hero renders the brand ground (`.hero-plate` in
`src/app/globals.css`). To use a photograph instead, drop the file here and add
it to `homepageContent` in `src/data/mock.ts`:

```ts
heroImage: {
  id: "hero",
  src: "/images/jutta-nepal/hero.jpg",
  alt: "Inside the Jutta Nepal shop in Bhaisepati",
},
```

Nothing else changes: the preload hint, the scrim and the layout are already
conditional on that one field.

Use landscape, at least 2000px wide, and compress before committing — this path
is served as-is, without the optimisation the Supabase-hosted product images
get.
