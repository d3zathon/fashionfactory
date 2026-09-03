import type { Category, Collection, FAQ, HomepageContent, InstagramPost, StoreSettings, Testimonial } from "@/models";

export const storeSettings: StoreSettings = {
  name: "Jutta Nepal",
  locationLabel: "Bhaisepati, Lalitpur, Nepal",
  phone: "+977 9702042301",
  instagramHandle: "@jutta__nepal",
  instagramUrl: "https://www.instagram.com/jutta__nepal/",
  locations: [
    {
      id: "bhaisepati",
      name: "Jutta Nepal — Bhaisepati",
      address: "Bhaisepati, Lalitpur, Nepal 44700",
      mapsUrl: "https://www.google.com/maps/place/Jutta+Nepal+Bhaisepati/@27.6638716,85.2746002,7766m/data=!3m1!1e3!4m10!1m2!2m1!1sJutta+Nepal!3m6!1s0x39eb17002eec70c9:0x89aea1fde71432c1!8m2!3d27.6522818!4d85.3045567!15sCgtKdXR0YSBOZXBhbFoNIgtqdXR0YSBuZXBhbJIBCnNob2Vfc3RvcmXgAQA!16s%2Fg%2F11ytrt8gj4?entry=ttu&g_ep=EgoyMDI2MDgzMS4wIKXMDSoASAFQAw%3D%3D",
      lat: 27.6522818,
      lng: 85.3045567,
    },
  ],
  openingHours: "Message us to confirm today's hours",
  whatsappNumber: "9779702042301",
};

/**
 * Homepage copy.
 *
 * No `heroImage`: the storefront has no photography of its own yet, and a
 * stock photograph of someone else's shoes is not Jutta Nepal's shop window.
 * The hero renders its brand ground instead (see `.hero-plate` in globals.css)
 * and picks up a real photograph the moment one is set here — no component
 * change, no CSS change.
 */
export const homepageContent: HomepageContent = {
  eyebrow: "Bhaisepati, Lalitpur",
  headline: "Every Step Counts.",
  description: "Footwear for everyday wear, work and weekends — see what's in the shop, then message us about the pair you want.",
  introductionTitle: "A shoe shop you can message before you walk in.",
  introductionBody: "Jutta Nepal is a footwear store in Bhaisepati, Lalitpur. Browse the shop here, ask about sizes and availability on WhatsApp, and come in to try the pair on.",
  finalCtaTitle: "Find your next pair.",
  finalCtaBody: "Message Jutta Nepal on WhatsApp, or visit the shop in Bhaisepati.",
};

export const categories: Category[] = [
  { id: "new", name: "New Arrivals", slug: "new-arrivals", description: "The most recent pairs to land in the shop.", active: true, sortOrder: 1 },
  { id: "sneakers", name: "Sneakers", slug: "sneakers", description: "Everyday trainers and low-tops.", active: true, sortOrder: 2 },
  { id: "formal", name: "Formal & Office", slug: "formal", description: "Loafers, derbies and dress shoes.", active: true, sortOrder: 3 },
  { id: "boots", name: "Boots", slug: "boots", description: "Ankle boots, chukkas and high-tops.", active: true, sortOrder: 4 },
  { id: "sandals", name: "Sandals & Slides", slug: "sandals", description: "Open pairs for warm days and indoors.", active: true, sortOrder: 5 },
  { id: "womens", name: "Women's", slug: "womens", description: "The women's rail across every style.", active: true, sortOrder: 6 },
];

// Collections group products by id, so they stay empty until the catalogue is
// published from the admin panel. Listing ids for products that do not exist
// would render as empty rails on the storefront.
export const collections: Collection[] = [
  { id: "all", name: "The Shop", slug: "all", description: "Everything currently on the shelf.", productIds: [], active: true, sortOrder: 1 },
  { id: "featured", name: "Featured", slug: "featured", description: "The pairs highlighted on the homepage.", productIds: [], active: true, sortOrder: 2 },
];

// Empty until the Instagram Graph API is configured (INSTAGRAM_ACCESS_TOKEN) or
// real posts are recorded. The homepage's Instagram section is switched off in
// the store's feature flags meanwhile, so nothing renders either way — filling
// this with stock photography would put pictures Jutta Nepal did not post under
// a heading that says it did.
export const instagramPosts: InstagramPost[] = [];

// The store has published no customer quotes, and the `testimonials` feature
// flag is off. Quotes belong here only once real ones exist.
export const testimonials: Testimonial[] = [];

export const faqs: FAQ[] = [
  { id: "faq1", question: "Where is Jutta Nepal?", answer: "The shop is in Bhaisepati, Lalitpur 44700. Use the Directions link in the Visit Us section for the Google Maps listing.", active: true, sortOrder: 1 },
  { id: "faq2", question: "What is your returns and exchange policy?", answer: "No refunds or returns. Exchanges are accepted within 2 days, subject to store policy and product condition.", active: true, sortOrder: 2 },
  { id: "faq3", question: "Can I check a size or availability before visiting?", answer: "Yes. Message the shop on WhatsApp with the pair you have in mind and we'll tell you what sizes are on the shelf.", active: true, sortOrder: 3 },
  { id: "faq4", question: "What are the opening hours?", answer: storeSettings.openingHours, active: true, sortOrder: 4 },
  { id: "faq5", question: "Where can I see the newest pairs?", answer: "New arrivals are listed in the shop here, and posted to @jutta__nepal on Instagram.", active: true, sortOrder: 5 },
];
