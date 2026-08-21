import type { Metadata } from "next";
import { StoreSettingsService } from "@/services";
import "./globals.css";
import "./route-state.css";

export const metadata: Metadata = {
  title: "Fashion Factory Nepal | Fashion Store in Kathmandu",
  description: "Discover fashion at Fashion Factory Nepal in Kathmandu. Browse the collection, contact the store, and get directions to Sorakhutte.",
  keywords: ["Fashion Factory Nepal", "fashion store Kathmandu", "clothing store Kathmandu", "fashion shop Kathmandu", "clothing store near Sorakhutte"],
  openGraph: { title: "Fashion Factory Nepal", description: "Define Your Style.", type: "website" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const store = await StoreSettingsService.getStoreSettings();
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: store.name,
    telephone: store.phone,
    address: { "@type": "PostalAddress", addressLocality: "Kathmandu", addressCountry: "NP" },
    openingHours: "Mo-Su 09:00-17:00",
    sameAs: [store.instagramUrl],
    url: store.mapsUrl,
  };

  return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />{children}</body></html>;
}
