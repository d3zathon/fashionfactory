import type { Metadata } from "next";
import Script from "next/script";
import { StoreSettingsService } from "@/services";
import "./globals.css";
import "./route-state.css";

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
    <html lang="en">
      <body>
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
