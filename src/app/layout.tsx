import type { Metadata } from "next";
import Script from "next/script";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { StoreSettingsService } from "@/services";
import { getStoreProfile } from "@/providers/static";
import "./globals.css";
import "./route-state.css";

// Self-hosted and preloaded by Next rather than fetched from Google at runtime.
// The previous CSS @import blocked rendering on a third-party round trip and
// caused a visible font swap on every page load.
const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

// NEXT_PUBLIC_SITE_URL wins over the store's recorded siteUrl, so a preview
// deployment resolves its own absolute URLs instead of the production domain's.
const built = getStoreProfile();
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? built.siteUrl;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: built.seo?.title ?? built.name,
  description: built.seo?.description ?? built.description,
  ...(built.seo?.keywords ? { keywords: built.seo.keywords } : {}),
  alternates: { canonical: "/" },
  openGraph: {
    title: built.name,
    description: built.seo?.description ?? built.description,
    type: "website",
    url: "/",
    siteName: built.name,
    locale: "en_NP",
  },
  // The OG image is emitted by src/app/opengraph-image.tsx; naming the card
  // type is what makes X render it large rather than as a thumbnail.
  twitter: {
    card: "summary_large_image",
    title: built.seo?.title ?? built.name,
    description: built.seo?.description ?? built.description,
  },
  // Only set when the store supplies one — otherwise Next's file-based
  // src/app/icon.svg keeps serving the favicon.
  ...(built.faviconUrl ? { icons: { icon: built.faviconUrl } } : {}),
};

/**
 * The store's palette, as an override of the design system's tokens.
 *
 * Only the five tokens a store is allowed to restyle, and only when the value
 * is a plain hex colour — the string is interpolated into a <style> tag, so
 * anything else is dropped rather than trusted. Tokens the store leaves unset
 * keep their values from globals.css.
 */
const BRANDING_TOKENS: [keyof NonNullable<typeof built.branding>, string][] = [
  ["accent", "--accent"],
  ["accentDeep", "--accent-deep"],
  ["accentLight", "--accent-light"],
  ["ink", "--ink"],
  ["paper", "--paper"],
];

function brandingStyle(branding: typeof built.branding): string | null {
  const declarations = BRANDING_TOKENS.flatMap(([key, token]) => {
    const value = branding?.[key];
    return typeof value === "string" && /^#[0-9a-fA-F]{3,8}$/.test(value) ? [`${token}: ${value};`] : [];
  });
  return declarations.length ? `:root { ${declarations.join(" ")} }` : null;
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const store = await StoreSettingsService.getStoreSettings();

  // schema.org wants "Mo-Su 09:00-17:00"; the store records the structured form
  // and a human string ("9:00 AM - 5:00 PM daily") that crawlers cannot parse.
  const schemaOpeningHours = (store.businessHours ?? []).map(
    (slot) => `${slot.days.join(",")} ${slot.opens}-${slot.closes}`
  );
  const socialProfiles = [store.instagramUrl, store.tiktokUrl, store.facebookUrl].filter(Boolean);

  // JSON-LD has no document base, so a relative logo path — which is what a
  // logo committed to /public looks like — resolves against nothing and the
  // property is worse than useless. Absolute or absent.
  const absoluteLogo = (() => {
    if (!store.logoUrl) return undefined;
    if (/^https?:\/\//.test(store.logoUrl)) return store.logoUrl;
    if (!siteUrl) return undefined;
    try {
      return new URL(store.logoUrl, siteUrl).toString();
    } catch {
      return undefined;
    }
  })();

  // Both schema.org subtypes, because the shop is both: ShoeStore and
  // ClothingStore are each a Store, and an array of types is how JSON-LD says
  // "this is genuinely both" rather than making us pick the half that is
  // wrong. The country comes from the store's profile rather than a literal so
  // a branch outside Nepal would not be described as being in it, and
  // openingHours is omitted entirely when the store has recorded no structured
  // hours — an empty array would assert "open no hours at all".
  const localBusinesses = store.locations.map((location) => ({
    "@context": "https://schema.org",
    "@type": ["ShoeStore", "ClothingStore"],
    name: location.name,
    telephone: store.phone,
    ...(absoluteLogo ? { image: absoluteLogo, logo: absoluteLogo } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: location.address,
      addressCountry: store.countryCode ?? "NP",
    },
    geo: { "@type": "GeoCoordinates", latitude: location.lat, longitude: location.lng },
    ...(schemaOpeningHours.length ? { openingHours: schemaOpeningHours } : {}),
    sameAs: socialProfiles,
    url: location.mapsUrl,
  }));

  const theme = brandingStyle(store.branding);
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        {theme && <style>{theme}</style>}
        {/* First focusable element on every page: lets keyboard and screen-reader
            users jump past the navigation instead of tabbing through it each time. */}
        <a className="skip-link" href="#main">Skip to content</a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinesses) }} />
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
              window.gtag = gtag;`}
            </Script>
          </>
        )}
        {pixelId && (
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');`}
          </Script>
        )}
        {children}
      </body>
    </html>
  );
}
