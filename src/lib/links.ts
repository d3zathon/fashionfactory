/**
 * Contact link builders.
 *
 * Business numbers are stored in human-readable form (e.g. "+977 9840260456")
 * but `tel:` and `wa.me` targets must not contain spaces or punctuation.
 */

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
 * TikTok handle, displayed verbatim wherever it appears.
 *
 * Kept here rather than in StoreSettings because src/data/store.json is
 * regenerated from Supabase by scripts/generate-site-data.mjs on every admin
 * publish; a field with no matching database column would be silently dropped
 * the next time someone pressed "Publish to site".
 */
export const TIKTOK_HANDLE = "Fashionfactory@99";

/**
 * Build a TikTok profile URL from a display handle.
 *
 * TikTok usernames only permit letters, digits, underscores and periods, so the
 * decorative "@" inside the display handle is stripped out to form the URL —
 * the same reason telHref strips formatting out of a phone number. Lowercased
 * to match how TikTok canonicalises usernames; the displayed handle keeps its
 * original casing.
 */
export function tiktokHref(handle: string = TIKTOK_HANDLE): string {
  const username = handle.replace(/[^A-Za-z0-9._]/g, "").toLowerCase();
  return `https://www.tiktok.com/@${username}`;
}

/** Default prefilled WhatsApp message used by the site-wide contact actions. */
export const GENERAL_WHATSAPP_MESSAGE =
  "Hi Fashion Factory, I found you through your website and would like to know more about your collection.";

/** Prefilled WhatsApp message for a product availability inquiry. */
export const productWhatsappMessage = (productName: string) =>
  `Hi Fashion Factory, I would like to ask about ${productName}. Is it currently available?`;
