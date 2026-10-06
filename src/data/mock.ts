import type { Category, Collection, FAQ, HomepageContent, InstagramPost, StoreSettings, Testimonial } from "@/models";

const image = (id: string, src: string, alt: string) => ({ id, src, alt });

export const storeSettings: StoreSettings = {
  name: "Fashion Factory Nepal",
  locationLabel: "Kathmandu Valley, Nepal · Kirtipur & Budhanilkantha",
  phone: "+977 9840260456",
  instagramHandle: "@fashion.factory_2022",
  instagramUrl: "https://www.instagram.com/fashion.factory_2022/",
  locations: [
    {
      id: "kirtipur",
      name: "Fashion Factory — Kirtipur",
      address: "M7FJ+JHC, Kirtipur 44600, Nepal",
      mapsUrl: "https://www.google.com/maps/place/Fashion+Factory/@27.67409,85.2814289,3647m/data=!3m1!1e3!4m10!1m2!2m1!1sfashion+factory!3m6!1s0x39eb19d5f435a403:0x7d3cfd5ad03122c1!8m2!3d27.6740549!4d85.2814038!15sCg9mYXNoaW9uIGZhY3RvcnmSAQlnaWZ0X3Nob3DgAQA!16s%2Fg%2F11sxvnp1t0?entry=ttu&g_ep=EgoyMDI2MDgxNy4wIKXMDSoASAFQAw%3D%3D",
      lat: 27.6740549,
      lng: 85.2814038,
    },
    {
      id: "budhanilkantha",
      name: "Fashion Factory — Budhanilkantha",
      address: "Q9G6+FMJ, Budhanilkantha 44600, Nepal",
      mapsUrl: "https://www.google.com/maps/place/Fashion+factory+budhanilkantha/@27.7762096,85.3590733,911m/data=!3m2!1e3!4b1!4m6!3m5!1s0x39eb1d004815b655:0x9d3cda67e875d3e0!8m2!3d27.7762049!4d85.3616482!16s%2Fg%2F11m5qgldvt?entry=ttu&g_ep=EgoyMDI2MDgxNy4wIKXMDSoASAFQAw%3D%3D",
      lat: 27.7762049,
      lng: 85.3616482,
    },
  ],
  openingHours: "9:00 AM – 5:00 PM daily",
  whatsappNumber: "9779840260456",
};

export const homepageContent: HomepageContent = {
  eyebrow: "Kathmandu, Nepal",
  headline: "Define Your Style.",
  description: "Discover handbags, accessories and gifts at Fashion Factory Nepal in Kathmandu.",
  heroImage: image("hero", "/images/store/store-handbag-shelves.jpg", "Fashion Factory's handbag display in Kathmandu"),
  introductionTitle: "Fashion Made Easy to Discover.",
  introductionBody: "Fashion Factory is a Kathmandu destination for handbags, jewelry, accessories and thoughtful gifts. Browse the collection, connect with the store, and visit in person to find your next favorite.",
  finalCtaTitle: "Your Next Look Starts Here.",
  finalCtaBody: "Visit Fashion Factory in Kathmandu or connect with us online.",
};

export const categories: Category[] = [
  { id: "new", name: "New Arrivals", slug: "new-arrivals", description: "Fresh pieces to discover.", active: true, sortOrder: 1 },
  { id: "mens", name: "Handbags", slug: "handbags", description: "Everyday shapes, statement bags and polished classics.", active: true, sortOrder: 2 },
  { id: "womens", name: "Shoulder Bags & Clutches", slug: "shoulder-bags-clutches", description: "Compact crossbodies, shoulder bags and occasion pieces.", active: true, sortOrder: 3 },
  { id: "accessories", name: "Jewelry & Accessories", slug: "jewelry-accessories", description: "Finishing touches and small statement pieces.", active: true, sortOrder: 4 },
  { id: "gifts", name: "Gifts & Drinkware", slug: "gifts-drinkware", description: "Colorful mugs and thoughtful little gifts.", active: true, sortOrder: 5 },
];

export const collections: Collection[] = [
  { id: "all", name: "The Collection", slug: "all", description: "A curated catalogue of bags, accessories and gifts.", productIds: Array.from({ length: 24 }, (_, i) => `ff${String(i + 1).padStart(2, "0")}`), active: true, sortOrder: 1 },
  { id: "featured", name: "Featured", slug: "featured", description: "Selected pieces highlighted on the storefront.", productIds: ["ff04", "ff09", "ff08", "ff18", "ff16", "ff02", "ff15", "ff24"], active: true, sortOrder: 2 },
];

export const instagramPosts: InstagramPost[] = [
  { id: "ig1", image: image("ig1", "/images/store/store-accessories-display.jpg", "Accessories display at Fashion Factory"), caption: "Details from the store.", permalink: storeSettings.instagramUrl, publishedAt: "2026-10-06" },
  { id: "ig2", image: image("ig2", "/images/store/store-counter-and-display.jpg", "The Fashion Factory shop floor"), caption: "Find your next favorite.", permalink: storeSettings.instagramUrl, publishedAt: "2026-10-06" },
  { id: "ig3", image: image("ig3", "/images/store/store-handbag-shelves.jpg", "Handbags displayed in store"), caption: "A closer look at the bag edit.", permalink: storeSettings.instagramUrl, publishedAt: "2026-10-06" },
  { id: "ig4", image: image("ig4", "/images/store/store-handbag-wall.jpg", "Handbag wall at Fashion Factory"), caption: "Visit us in Kathmandu.", permalink: storeSettings.instagramUrl, publishedAt: "2026-10-06" },
  { id: "ig5", image: image("ig5", "/images/store/store-sunglasses-and-bags.jpg", "Sunglasses and handbags at Fashion Factory"), caption: "Explore the in-store edit.", permalink: storeSettings.instagramUrl, publishedAt: "2026-10-06" },
  { id: "ig6", image: image("ig6", "/images/store/store-handbag-display.jpg", "Handbag display at Fashion Factory"), caption: "New details to discover.", permalink: storeSettings.instagramUrl, publishedAt: "2026-10-06" },
  { id: "ig7", image: image("ig7", "/images/store/store-featured-clutch.jpg", "Featured clutch at Fashion Factory"), caption: "Find us in Kathmandu.", permalink: storeSettings.instagramUrl, publishedAt: "2026-10-06" },
];

export const testimonials: Testimonial[] = [];

export const faqs: FAQ[] = [
  { id: "faq1", question: "Where is Fashion Factory located?", answer: "Fashion Factory has two locations in the Kathmandu Valley — Kirtipur and Budhanilkantha. Use each branch's Get Directions link for its Google Maps listing.", active: true, sortOrder: 1 },
  { id: "faq2", question: "What are the store opening hours?", answer: storeSettings.openingHours, active: true, sortOrder: 2 },
  { id: "faq3", question: "Can I contact the store before visiting?", answer: "Yes. You can call or message Fashion Factory on WhatsApp using the contact actions throughout the site.", active: true, sortOrder: 3 },
  { id: "faq4", question: "Can I ask about product availability?", answer: "Yes. Use a product inquiry or WhatsApp message to ask about current availability.", active: true, sortOrder: 4 },
  { id: "faq5", question: "Where can I see your latest products?", answer: "Browse the collection here or follow @fashion.factory_2022 on Instagram for updates.", active: true, sortOrder: 5 },
];
