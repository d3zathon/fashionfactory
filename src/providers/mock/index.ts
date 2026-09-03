// Categories and store settings now come from @/providers/static, backed by
// committed JSON that the publish flow regenerates from Supabase.
import { collections, faqs, homepageContent, instagramPosts, testimonials } from "@/data/mock";
import type { CollectionProvider, ContactProvider, ContentProvider, InstagramProvider, TestimonialProvider } from "../interfaces";

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

export const mockTestimonialProvider: TestimonialProvider = {
  async getTestimonials() { return testimonials; },
};

/**
 * Not wired to anything, and deliberately kept.
 *
 * /api/contact used to fall back to this when no delivery route was
 * configured, which meant an unconfigured host answered a real customer with
 * "your inquiry was received" and dropped the message. The route now fails
 * honestly instead. This stays as the reference implementation of
 * ContactProvider — the shape a real second delivery channel (email, a CRM)
 * would take — and must never be put back on the request path as a fallback
 * for a channel that is simply not configured.
 */
export const mockContactProvider: ContactProvider = {
  async submitInquiry() {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return { success: true, id: `mock-${Date.now()}` };
  },
};
