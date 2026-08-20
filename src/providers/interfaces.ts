import type { Category, FAQ, HomepageContent, InstagramPost, Product, StoreSettings, Testimonial, ContactInquiry } from "@/models";

export interface ProductProvider { getProducts(): Promise<Product[]>; getProduct(id: string): Promise<Product | null>; getFeaturedProducts(): Promise<Product[]>; getProductsByCategory(categoryId: string): Promise<Product[]>; }
export interface CategoryProvider { getCategories(): Promise<Category[]>; }
export interface CollectionProvider { getCollections(): Promise<unknown[]>; }
export interface ContentProvider { getHomepageContent(): Promise<HomepageContent>; getFAQs(): Promise<FAQ[]>; }
export interface InstagramProvider { getPosts(): Promise<InstagramPost[]>; getLatestPosts(limit?: number): Promise<InstagramPost[]>; }
export interface ContactProvider { submitInquiry(data: ContactInquiry): Promise<{ success: boolean; id?: string }>; }
export interface StoreSettingsProvider { getStoreSettings(): Promise<StoreSettings>; }
export interface TestimonialProvider { getTestimonials(): Promise<Testimonial[]>; }
export interface MediaProvider { getMedia(): Promise<unknown[]>; }
export interface AnalyticsProvider { track(event: string, properties?: Record<string, string | number | boolean>): void; }
