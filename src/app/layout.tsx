import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fashion Factory Nepal | Fashion Store in Kathmandu",
  description: "Discover fashion at Fashion Factory Nepal in Kathmandu. Browse the collection, contact the store, and get directions to Sorakhutte.",
  keywords: ["Fashion Factory Nepal", "fashion store Kathmandu", "clothing store Kathmandu", "fashion shop Kathmandu", "clothing store near Sorakhutte"],
  openGraph: { title: "Fashion Factory Nepal", description: "Define Your Style.", type: "website" },
};

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: "Fashion Factory Nepal",
  telephone: "+977 9864831830",
  address: { "@type": "PostalAddress", addressLocality: "Kathmandu", addressCountry: "NP" },
  openingHours: "Mo-Su 09:00-17:00",
  sameAs: ["https://www.instagram.com/fashion.factory_2022/"],
  url: "https://www.google.com/maps/place/Fashion+Factory/@27.67409,85.2814289,3685m/data=!3m1!1e3!4m10!1m2!2m1!1sfashion+factory!3m6!1s0x39eb19d5f435a403:0x7d3cfd5ad03122c1!8m2!3d27.6740549!4d85.2814038!15sCg9mYXNoaW9uIGZhY3RvcnmSAQlnaWZ0X3Nob3DgAQA!16s%2Fg%2F11sxvnp1t0",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />{children}</body></html>;
}
