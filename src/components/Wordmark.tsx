import type { StoreProfile } from "@/models";

/**
 * The header/footer lockup.
 *
 * Three tiers — regular, bold, small — which is what `.brand` in globals.css is
 * built to style. A store can set `branding.wordmark` explicitly; otherwise the
 * tiers are its name split on spaces, which reproduces the original
 * FASHION / FACTORY / NEPAL lockup from "Fashion Factory Nepal" exactly.
 *
 * Any words past the third join into the small tier rather than being dropped,
 * so a longer name degrades instead of losing part of the business's identity.
 */
export function wordmarkTiers(store?: Pick<StoreProfile, "name" | "branding">): string[] {
  const explicit = store?.branding?.wordmark;
  if (explicit && explicit.length > 0) return explicit;
  const words = (store?.name ?? "").trim().split(/\s+/).filter(Boolean).map((word) => word.toUpperCase());
  if (words.length <= 3) return words;
  return [words[0], words[1], words.slice(2).join(" ")];
}

export function Wordmark({ store }: { store?: Pick<StoreProfile, "name" | "branding"> }) {
  const [first, second, third] = wordmarkTiers(store);
  return (
    <>
      {first && <span>{first}</span>}
      {second && <strong>{second}</strong>}
      {third && <small>{third}</small>}
    </>
  );
}
