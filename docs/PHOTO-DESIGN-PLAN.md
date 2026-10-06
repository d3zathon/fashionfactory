# Fashion Factory photo and design plan

## Design direction

Use a friendly vintage shop-catalog feel: warm cream paper, tomato-red accents, sunshine-yellow highlights, softly rounded cards, and clear display type. Keep the product inquiry flow and responsive navigation. The result should read as a local accessories and gift destination, since the supplied photos show handbags, jewelry, drinkware, and the store rather than apparel.

## Photo placement

- **Hero:** use the handbag-shelf shop photo as the opening image so visitors immediately see the actual store and product range.
- **Quick paths:** place search in the hero, use plain-language navigation, and show a concise six-item featured edit so shoppers can start browsing immediately.
- **Featured and collection cards:** use all 24 item photos as local product images, with concise descriptive names and no invented prices or brand claims. Put handbags first in the featured order, then jewelry, gifts, and clutches.
- **Clear actions:** keep “Ask availability” visible on each item card without relying on hover; use rounded, high-contrast controls with touch-friendly sizes.
- **Category index:** assign a representative local image to each category. Retitle the former generic men's and women's groups to match the photographed inventory while preserving their existing internal category IDs.
- **Social edit:** use the seven supplied store-view images as a four-column desktop grid and two-column mobile grid, linked to the store's Instagram profile.
- **Editorial image:** continue using a real featured product image so this section stays connected to the current catalog.

## Implementation details

Photos are copied into `public/images/products` and `public/images/store`, resized to a maximum 1800px edge, and JPEG-optimized for the website. The static catalog, category records, and mock homepage/social content all point to these local assets. The product inquiry, WhatsApp, maps, and Instagram actions remain in place.

## Source photo map

The supplied product photos become: statement gold-tone jewelry, colorful jhumka earrings, woven-handle mini bag, colorblock top-handle bag, chain-strap shoulder bag, patterned mini bags, gathered pouches, cream quilted crossbody, tan shoulder bag, six gift mugs/cups, orange ridged carry-on case, neutral ridged bag, black bow bag, taupe and ivory top-handle bags, white top-handle bag, black quilted mini bag, and brown/black sunburst clutches. The seven `instagram-post-fashionfactoryglobal-*.jpg` images become the store/social gallery and the hero source.

## Review notes

The source filenames do not provide reliable product names, materials, pricing, sizes, or stock status. Catalog labels are descriptive visual names only; current inventory and item details should be confirmed by the store through its existing inquiry channels.
