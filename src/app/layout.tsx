import type { Metadata } from "next";
import Script from "next/script";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { StoreSettingsService } from "@/services";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: "Fashion Factory Nepal | Fashion Store in Kathmandu",
  description: "Discover fashion at Fashion Factory Nepal. Browse the collection, contact the store, and get directions to our Kirtipur and Budhanilkantha branches.",
  keywords: ["Fashion Factory Nepal", "fashion store Kathmandu", "clothing store Kathmandu", "fashion shop Kathmandu", "Fashion Factory Kirtipur", "Fashion Factory Budhanilkantha"],
  openGraph: { title: "Fashion Factory Nepal", description: "Define Your Style.", type: "website" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const store = await StoreSettingsService.getStoreSettings();
  const localBusinesses = store.locations.map((location) => ({
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: location.name,
    telephone: store.phone,
    address: { "@type": "PostalAddress", streetAddress: location.address, addressCountry: "NP" },
    geo: { "@type": "GeoCoordinates", latitude: location.lat, longitude: location.lng },
    openingHours: "Mo-Su 09:00-17:00",
    sameAs: [store.instagramUrl],
    url: location.mapsUrl,
  }));

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
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
