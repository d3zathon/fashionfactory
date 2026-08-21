import type { Category, Collection, FAQ, HomepageContent, InstagramPost, Product, StoreSettings, Testimonial } from "@/models";

const image = (id: string, src: string, alt: string) => ({ id, src, alt });

export const storeSettings: StoreSettings = {
  name: "Fashion Factory Nepal",
  locationLabel: "Kathmandu, Nepal · Sorakhutte area",
  phone: "+977 9864831830",
  instagramHandle: "@fashion.factory_2022",
  instagramUrl: "https://www.instagram.com/fashion.factory_2022/",
  mapsUrl: "https://www.google.com/maps/place/Fashion+Factory/@27.67409,85.2814289,3685m/data=!3m1!1e3!4m10!1m2!2m1!1sfashion+factory!3m6!1s0x39eb19d5f435a403:0x7d3cfd5ad03122c1!8m2!3d27.6740549!4d85.2814038!15sCg9mYXNoaW9uIGZhY3RvcnmSAQlnaWZ0X3Nob3DgAQA!16s%2Fg%2F11sxvnp1t0",
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

export const products: Product[] = [
  { id: "p1", name: "Everyday Overshirt", slug: "everyday-overshirt", categoryId: "mens", description: "A versatile layered piece.", sizes: ["M", "L", "XL"], colors: ["Black", "Stone"], images: [image("p1", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85", "Neutral overshirt")], featured: true },
  { id: "p2", name: "Relaxed Statement Look", slug: "relaxed-statement-look", categoryId: "womens", description: "A polished silhouette for everyday styling.", sizes: ["S", "M", "L"], colors: ["Cream", "Black"], images: [image("p2", "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=85", "Fashion look")], featured: true },
  { id: "p3", name: "Classic Layer", slug: "classic-layer", categoryId: "new", description: "An easy piece to build a look around.", sizes: ["M", "L"], images: [image("p3", "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85", "Layered fashion")], featured: true },
  { id: "p4", name: "Minimal Accessories", slug: "minimal-accessories", categoryId: "accessories", description: "Simple details that complete a look.", images: [image("p4", "https://images.unsplash.com/photo-1612902456551-333ac5afa26e?auto=format&fit=crop&w=1200&q=85", "Fashion accessories")], featured: true },
  { id: "p5", name: "Weekend Edit", slug: "weekend-edit", categoryId: "womens", description: "An easygoing look for relaxed days.", sizes: ["S", "M", "L"], colors: ["White", "Black"], images: [image("p5", "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1200&q=85", "Casual fashion look")], featured: true },
  { id: "p6", name: "Giftable Detail", slug: "giftable-detail", categoryId: "gifts", description: "A small fashion find with easy gifting appeal.", images: [image("p6", "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=85", "Fashion gift detail")], featured: false },
  { id: "p7", name: "Clean Everyday Tee", slug: "clean-everyday-tee", categoryId: "mens", description: "A simple wardrobe staple for everyday styling.", sizes: ["M", "L", "XL"], colors: ["White", "Charcoal"], images: [image("p7", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85", "Everyday t-shirt")], featured: true },
  { id: "p8", name: "Soft Layering Piece", slug: "soft-layering-piece", categoryId: "new", description: "A relaxed layer for building a versatile look.", sizes: ["S", "M", "L"], colors: ["Beige", "Black"], images: [image("p8", "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=85", "Layering piece")], featured: true },
  { id: "p9", name: "Finishing Touch", slug: "finishing-touch", categoryId: "accessories", description: "A minimal accessory to complete a look.", images: [image("p9", "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=1200&q=85", "Accessory detail")], featured: false },
];

export const instagramPosts: InstagramPost[] = [
  { id: "ig1", image: image("ig1", "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85", "Fashion rack"), caption: "What's new in store.", permalink: storeSettings.instagramUrl, publishedAt: "2026-08-15" },
  { id: "ig2", image: image("ig2", "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1000&q=85", "Clothing collection"), caption: "Find your next look.", permalink: storeSettings.instagramUrl, publishedAt: "2026-08-12" },
  { id: "ig3", image: image("ig3", "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=85", "Contemporary fashion"), permalink: storeSettings.instagramUrl, publishedAt: "2026-08-09" },
  { id: "ig4", image: image("ig4", "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1000&q=85", "Fashion store"), caption: "Visit us in Kathmandu.", permalink: storeSettings.instagramUrl, publishedAt: "2026-08-05" },
];

export const testimonials: Testimonial[] = [];

export const faqs: FAQ[] = [
  { id: "faq1", question: "Where is Fashion Factory located?", answer: "Fashion Factory is in Kathmandu, Nepal, in the Sorakhutte area. Use the Directions link for the supplied Google Maps listing.", active: true, sortOrder: 1 },
  { id: "faq2", question: "What are the store opening hours?", answer: storeSettings.openingHours, active: true, sortOrder: 2 },
  { id: "faq3", question: "Can I contact the store before visiting?", answer: "Yes. You can call or message Fashion Factory on WhatsApp using the contact actions throughout the site.", active: true, sortOrder: 3 },
  { id: "faq4", question: "Can I ask about product availability?", answer: "Yes. Use a product inquiry or WhatsApp message to ask about current availability.", active: true, sortOrder: 4 },
  { id: "faq5", question: "Where can I see your latest products?", answer: "Browse the collection here or follow @fashion.factory_2022 on Instagram for updates.", active: true, sortOrder: 5 },
];
