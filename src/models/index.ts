export interface ProductImage {
  id: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description?: string;
  price?: number;
  currency?: string;
  images: ProductImage[];
  sizes?: string[];
  colors?: string[];
  available?: boolean;
  featured?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: ProductImage;
  active: boolean;
  sortOrder: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productIds: string[];
  image?: ProductImage;
  active: boolean;
  sortOrder: number;
}

export interface InstagramPost {
  id: string;
  image: ProductImage;
  caption?: string;
  permalink: string;
  publishedAt: string;
}

export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  mapsUrl: string;
  lat: number;
  lng: number;
}

export interface StoreSettings {
  name: string;
  locationLabel: string;
  phone: string;
  instagramHandle: string;
  instagramUrl: string;
  locations: StoreLocation[];
  openingHours: string;
  whatsappNumber: string;
}

export interface ContactInquiry {
  name: string;
  phone: string;
  message: string;
  productId?: string;
  categoryId?: string;
}

/**
 * Submission metadata that is not part of the inquiry itself.
 *
 * `honeypot` carries the decoy field's value. It is deliberately not a field on
 * ContactInquiry: it describes the submission, not the customer, and a domain
 * model claiming to hold a "company" would mislead whoever later adds a real
 * one.
 */
export interface ContactMeta {
  honeypot?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  quote: string;
  rating?: number;
  verified?: boolean;
}

export interface Promotion {
  id: string;
  title: string;
  description?: string;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface MediaAsset {
  id: string;
  src: string;
  alt: string;
  type: "image" | "video";
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  active: boolean;
  sortOrder: number;
}

export interface HomepageContent {
  eyebrow: string;
  headline: string;
  description: string;
  heroImage?: ProductImage;
  introductionTitle: string;
  introductionBody: string;
  finalCtaTitle: string;
  finalCtaBody: string;
}

// ---------------------------------------------------------------------------
// Store / tenant
// ---------------------------------------------------------------------------
// One deployment serves one store, selected at publish time by STORE_SLUG. The
// fields below are everything the codebase needs to render any store's
// storefront — nothing store-specific should be typed into a component.

/** Palette and wordmark. Optional throughout: a store that sets none renders the default theme. */
export interface StoreBranding {
  accent?: string;
  accentDeep?: string;
  accentLight?: string;
  ink?: string;
  paper?: string;
  /**
   * The header/footer lockup, rendered as three tiers (regular, bold, small).
   * ["JUTTA", "NEPAL"] for Jutta Nepal. Falls back to splitting the store
   * name on spaces, which produces the same thing for a two-word name.
   */
  wordmark?: string[];
}

/** Sections a store can turn off without a code change. Unset means enabled. */
export interface StoreFeatures {
  styleQuiz?: boolean;
  instagramFeed?: boolean;
  testimonials?: boolean;
  faqs?: boolean;
  contactForm?: boolean;
  locations?: boolean;
}

/** Search metadata for the storefront's root layout. */
export interface StoreSeo {
  title?: string;
  description?: string;
  keywords?: string[];
}

/** Structured hours for schema.org, alongside the human-readable openingHours string. */
export interface BusinessHours {
  days: string[];
  opens: string;
  closes: string;
}

/**
 * The full tenant profile. StoreSettings is the subset the storefront already
 * used before tenancy existed, so it stays as-is and this extends it — every field
 * added here is optional, and no existing consumer has to change.
 */
export interface StoreProfile extends StoreSettings {
  slug: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  faviconUrl?: string;
  email?: string;
  tiktokHandle?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  address?: string;
  countryCode?: string;
  currency?: string;
  businessHours?: BusinessHours[];
  branding?: StoreBranding;
  features?: StoreFeatures;
  siteUrl?: string;
  /**
   * Headline over the branch list ("\n" becomes a line break), and the copy for
   * the third "how it works" step. Both name specific neighbourhoods, so they
   * are store configuration rather than strings typed into the page — and they
   * live here, not in HomepageContent, because a heading has to be in the
   * server-rendered HTML rather than appearing after hydration.
   */
  visitTitle?: string;
  visitStepBody?: string;
  /**
   * The store's returns and exchanges terms, in the shop's own words.
   *
   * Configuration rather than page copy: it is a commitment the business makes
   * and changes on its own schedule, it has to read identically in the footer,
   * the FAQ and on every product page, and no two stores' terms are the same.
   * A store that has not recorded any renders no policy line at all — the
   * alternative would be inventing terms on the shop's behalf.
   */
  returnsPolicy?: string;
  /**
   * Search metadata. Kept explicit rather than derived from name + tagline:
   * the title tag and keyword set are the store's own SEO decisions, and a
   * generated approximation would quietly replace them.
   */
  seo?: StoreSeo;
}
