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

export interface StoreSettings {
  name: string;
  locationLabel: string;
  address?: string;
  phone: string;
  instagramHandle: string;
  instagramUrl: string;
  mapsUrl: string;
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
