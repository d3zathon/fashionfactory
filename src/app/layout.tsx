import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fashion Factory Nepal | Fashion Store in Kathmandu",
  description: "Discover fashion at Fashion Factory Nepal in Kathmandu. Browse the collection, contact the store, and get directions to Sorakhutte.",
  openGraph: { title: "Fashion Factory Nepal", description: "Define Your Style.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
