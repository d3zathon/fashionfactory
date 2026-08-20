import { categories, collections, faqs, homepageContent, instagramPosts, products, storeSettings, testimonials } from "@/data/mock";
import type { CategoryProvider, CollectionProvider, ContactProvider, ContentProvider, InstagramProvider, ProductProvider, StoreSettingsProvider, TestimonialProvider } from "../interfaces";

export const mockProductProvider: ProductProvider = {
  async getProducts() { return products; },
  async getProduct(id) { return products.find((product) => product.id === id) ?? null; },
  async getProductBySlug(slug) { return products.find((product) => product.slug === slug) ?? null; },
  async getFeaturedProducts() { return products.filter((product) => product.featured); },
  async getProductsByCategory(categoryId) { return products.filter((product) => product.categoryId === categoryId); },
};

export const mockCategoryProvider: CategoryProvider = {
  async getCategories() { return categories.filter((category) => category.active).sort((a, b) => a.sortOrder - b.sortOrder); },
  async getCategory(identifier) {
    return categories.find((category) => category.active && (category.id === identifier || category.slug === identifier)) ?? null;
  },
};

export const mockCollectionProvider: CollectionProvider = {
  async getCollections() { return collections.filter((collection) => collection.active).sort((a, b) => a.sortOrder - b.sortOrder); },
  async getCollection(slug) { return collections.find((collection) => collection.active && collection.slug === slug) ?? null; },
};

export const mockContentProvider: ContentProvider = {
  async getHomepageContent() { return homepageContent; },
  async getFAQs() { return faqs.filter((faq) => faq.active).sort((a, b) => a.sortOrder - b.sortOrder); },
};

export const mockInstagramProvider: InstagramProvider = {
  async getPosts() { return instagramPosts; },
  async getLatestPosts(limit = 4) { return instagramPosts.slice(0, limit); },
};

export const mockStoreSettingsProvider: StoreSettingsProvider = {
  async getStoreSettings() { return storeSettings; },
};

export const mockTestimonialProvider: TestimonialProvider = {
  async getTestimonials() { return testimonials; },
};

export const mockContactProvider: ContactProvider = {
  async submitInquiry() {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return { success: true, id: `mock-${Date.now()}` };
  },
};
