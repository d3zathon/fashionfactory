"use client";

import Link from "next/link";
import { useStoreSettings } from "@/hooks";
import { GENERAL_WHATSAPP_MESSAGE, telHref, whatsappHref } from "@/lib/links";

export function Footer() {
  const { data: store } = useStoreSettings();
  const whatsapp = whatsappHref(store?.whatsappNumber, GENERAL_WHATSAPP_MESSAGE);

  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Link className="brand footer-brand" href="/" aria-label="Fashion Factory Nepal home"><span>FASHION</span><strong>FACTORY</strong><small>NEPAL</small></Link>
          <p className="muted">{store?.locationLabel}</p>
        </div>
        <div>
          <p className="eyebrow">Explore</p>
          <Link href="/collection">Collection</Link>
          <Link href="/#about">About</Link>
          <Link href="/#instagram">Instagram</Link>
          <Link href="/#visit-us">Visit Us</Link>
          <Link href="/#contact">Contact</Link>
        </div>
        <div>
          <p className="eyebrow">Connect</p>
          <a href={telHref(store?.phone)}>{store?.phone}</a>
          <a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
          <a href={store?.instagramUrl} target="_blank" rel="noreferrer">{store?.instagramHandle}</a>
          <a href={store?.mapsUrl} target="_blank" rel="noreferrer">Google Maps</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Fashion Factory Nepal</span>
        <span>{store?.openingHours}</span>
      </div>
    </footer>
  );
}
