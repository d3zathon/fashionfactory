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
  description: "Discover fashion at Fashion Factory Nepal, Kathmandu.",
  heroImage: image("hero", "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2200&q=88", "Fashion clothing displayed on a rack"),
  introductionTitle: "Fashion Made Easy to Discover.",
  introductionBody: "Fashion Factory is a Kathmandu-based fashion and clothing retail destination. Browse the collection, connect with the store, and visit in person to find your next look.",
  finalCtaTitle: "Your Next Look Starts Here.",
  finalCtaBody: "Visit Fashion Factory in Kathmandu or connect with us online.",
};

export const categories: Category[] = [
  { id: "new", name: "New Arrivals", slug: "new-arrivals", description: "Fresh pieces to discover.", active: true, sortOrder: 1 },
  { id: "mens", name: "Men's", slug: "mens", description: "Everyday and occasion-ready styles.", active: true, sortOrder: 2 },
  { id: "womens", name: "Women's", slug: "womens", description: "Contemporary pieces for your wardrobe.", active: true, sortOrder: 3 },
  { id: "accessories", name: "Accessories", slug: "accessories", description: "Finishing touches for your look.", active: true, sortOrder: 4 },
  { id: "gifts", name: "Gifts", slug: "gifts", description: "Thoughtful finds to take home.", active: true, sortOrder: 5 },
];

export const collections: Collection[] = [
  { id: "all", name: "The Collection", slug: "all", description: "A curated catalogue for the storefront experience.", productIds: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"], active: true, sortOrder: 1 },
  { id: "featured", name: "Featured", slug: "featured", description: "Selected pieces highlighted on the storefront.", productIds: ["p1", "p2", "p3", "p5", "p7"], active: true, sortOrder: 2 },
];

export const instagramPosts: InstagramPost[] = [
  { id: "ig1", image: image("ig1", "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85", "Fashion rack"), caption: "What's new in store.", permalink: storeSettings.instagramUrl, publishedAt: "2026-08-15" },
  { id: "ig2", image: image("ig2", "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1000&q=85", "Clothing collection"), caption: "Find your next look.", permalink: storeSettings.instagramUrl, publishedAt: "2026-08-12" },
  { id: "ig3", image: image("ig3", "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=85", "Contemporary fashion"), permalink: storeSettings.instagramUrl, publishedAt: "2026-08-09" },
  { id: "ig4", image: image("ig4", "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1000&q=85", "Fashion store"), caption: "Visit us in Kathmandu.", permalink: storeSettings.instagramUrl, publishedAt: "2026-08-05" },
];

export const testimonials: Testimonial[] = [];

export const faqs: FAQ[] = [
  { id: "faq1", question: "Where is Fashion Factory located?", answer: "Fashion Factory has two locations in the Kathmandu Valley — Kirtipur and Budhanilkantha. Use each branch's Get Directions link for its Google Maps listing.", active: true, sortOrder: 1 },
  { id: "faq2", question: "What are the store opening hours?", answer: storeSettings.openingHours, active: true, sortOrder: 2 },
  { id: "faq3", question: "Can I contact the store before visiting?", answer: "Yes. You can call or message Fashion Factory on WhatsApp using the contact actions throughout the site.", active: true, sortOrder: 3 },
  { id: "faq4", question: "Can I ask about product availability?", answer: "Yes. Use a product inquiry or WhatsApp message to ask about current availability.", active: true, sortOrder: 4 },
  { id: "faq5", question: "Where can I see your latest products?", answer: "Browse the collection here or follow @fashion.factory_2022 on Instagram for updates.", active: true, sortOrder: 5 },
];
