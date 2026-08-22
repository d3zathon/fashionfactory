/**
 * Contact link builders.
 *
 * Business numbers are stored in human-readable form (e.g. "+977 9840260456")
 * but `tel:` and `wa.me` targets must not contain spaces or punctuation.
 */

import { getStoreProfile } from "@/providers/static";

/** Build a dialable `tel:` href from a display phone number. */
export function telHref(phone?: string): string | undefined {
  if (!phone) return undefined;
  const dialable = phone.replace(/[^\d+]/g, "");
  return dialable ? `tel:${dialable}` : undefined;
}

/** Build a wa.me href from an international number and a prefilled message. */
export function whatsappHref(number: string | undefined, message: string): string | undefined {
  if (!number) return undefined;
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : undefined;
}

/**
 * Build a TikTok profile URL from a display handle.
 *
 * TikTok usernames only permit letters, digits, underscores and periods, so a
 * decorative "@" inside a display handle (e.g. "Fashionfactory@99") is stripped
 * out to form the URL — the same reason telHref strips formatting out of a
 * phone number. Lowercased to match how TikTok canonicalises usernames; the
 * displayed handle keeps its original casing.
 *
 * Only a fallback: a store that has recorded its real profile URL should use
 * `tiktokUrl` directly, since a stylised handle need not match the username.
 */
export function tiktokHref(handle: string): string {
  const username = handle.replace(/[^A-Za-z0-9._]/g, "").toLowerCase();
  return `https://www.tiktok.com/@${username}`;
}

/** The TikTok link for a store: its recorded URL, or one derived from the handle. */
export function tiktokLink(store?: { tiktokUrl?: string; tiktokHandle?: string }): string | undefined {
  if (store?.tiktokUrl) return store.tiktokUrl;
  return store?.tiktokHandle ? tiktokHref(store.tiktokHandle) : undefined;
}

// The store name defaults come from the committed profile rather than a literal.
// That is a build-time constant for this deployment — one store per build — so
// these read exactly as stably as the hardcoded strings they replaced, while
// saying the right name on someone else's storefront. Callers that already hold
// a store object should still pass its name.
const defaultStoreName = () => getStoreProfile().name;

/** Prefilled WhatsApp message for the site-wide contact actions. */
export const generalWhatsappMessage = (storeName: string = defaultStoreName()) =>
  `Hi ${storeName}, I found you through your website and would like to know more about your collection.`;

/** Prefilled WhatsApp message for a product availability inquiry. */
export const productWhatsappMessage = (productName: string, storeName: string = defaultStoreName()) =>
  `Hi ${storeName}, I would like to ask about ${productName}. Is it currently available?`;
