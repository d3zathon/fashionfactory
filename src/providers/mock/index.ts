import { categories, faqs, homepageContent, instagramPosts, products, storeSettings, testimonials } from "@/data/mock";
import type { CategoryProvider, ContactProvider, ContentProvider, InstagramProvider, ProductProvider, StoreSettingsProvider, TestimonialProvider } from "../interfaces";

export const mockProductProvider: ProductProvider = {
  async getProducts() { return products; },
  async getProduct(id) { return products.find((product) => product.id === id) ?? null; },
  async getFeaturedProducts() { return products.filter((product) => product.featured); },
  async getProductsByCategory(categoryId) { return products.filter((product) => product.categoryId === categoryId); },
};

export const mockCategoryProvider: CategoryProvider = { async getCategories() { return categories.filter((category) => category.active).sort((a, b) => a.sortOrder - b.sortOrder); } };
export const mockContentProvider: ContentProvider = { async getHomepageContent() { return homepageContent; }, async getFAQs() { return faqs.filter((faq) => faq.active).sort((a, b) => a.sortOrder - b.sortOrder); } };
export const mockInstagramProvider: InstagramProvider = { async getPosts() { return instagramPosts; }, async getLatestPosts(limit = 4) { return instagramPosts.slice(0, limit); } };
export const mockStoreSettingsProvider: StoreSettingsProvider = { async getStoreSettings() { return storeSettings; } };
export const mockTestimonialProvider: TestimonialProvider = { async getTestimonials() { return testimonials; } };
export const mockContactProvider: ContactProvider = { async submitInquiry() { await new Promise((resolve) => setTimeout(resolve, 450)); return { success: true, id: `mock-${Date.now()}` }; } };
