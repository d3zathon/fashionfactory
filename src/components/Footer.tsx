"use client";

import Link from "next/link";
import { TikTokIcon } from "@/components/TikTokIcon";
import { Wordmark } from "@/components/Wordmark";
import { useStoreSettings } from "@/hooks";
import { AnalyticsService } from "@/services";
import { generalWhatsappMessage, telHref, tiktokLink, whatsappHref } from "@/lib/links";

export function Footer() {
  const { data: store } = useStoreSettings();
  const whatsapp = whatsappHref(store?.whatsappNumber, generalWhatsappMessage(store?.name));
  const tiktok = tiktokLink(store);

  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Link className="brand footer-brand" href="/" aria-label={`${store?.name ?? "Store"} home`}><Wordmark store={store} /></Link>
          <p className="muted">{store?.locationLabel}</p>
          {/* Where a customer expects to find the terms before they buy. The
              same string as the FAQ and the product pages, because all three
              read it from the store profile rather than restating it. */}
          {store?.returnsPolicy && (
            <div className="footer-policy">
              <p className="eyebrow">Returns &amp; Exchanges</p>
              <p>{store.returnsPolicy}</p>
            </div>
          )}
        </div>
        <div>
          <p className="eyebrow">Explore</p>
          <Link href="/collection">Shop</Link>
          <Link href="/#collection">Categories</Link>
          <Link href="/#about">About</Link>
          <Link href="/#visit-us">Visit Us</Link>
          <Link href="/#contact">Contact</Link>
        </div>
        <div>
          <p className="eyebrow">Connect</p>
          <a href={telHref(store?.phone)}>{store?.phone}</a>
          <a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
          <a href={store?.instagramUrl} target="_blank" rel="noreferrer">{store?.instagramHandle}</a>
          {tiktok && (
            <a
              className="social-link"
              href={tiktok}
              target="_blank"
              rel="noreferrer"
              onClick={() => AnalyticsService.track("tiktok_click", { placement: "footer" })}
            >
              <TikTokIcon size={14} /> {store?.tiktokHandle}
            </a>
          )}
        </div>
        <div>
          <p className="eyebrow">Locations</p>
          {store?.locations?.map((location) => (
            <a key={location.id} href={location.mapsUrl} target="_blank" rel="noreferrer">{location.name}</a>
          ))}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} {store?.name}</span>
        <span>{store?.openingHours}</span>
      </div>
    </footer>
  );
}
