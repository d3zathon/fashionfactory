import { mockCategoryProvider, mockCollectionProvider, mockContactProvider, mockContentProvider, mockInstagramProvider, mockProductProvider, mockStoreSettingsProvider, mockTestimonialProvider } from "@/providers/mock";

export const ProductService = mockProductProvider;
export const CategoryService = mockCategoryProvider;
export const CollectionService = mockCollectionProvider;
export const ContentService = mockContentProvider;
export const InstagramService = mockInstagramProvider;
export const ContactService = mockContactProvider;
export const StoreSettingsService = mockStoreSettingsProvider;
export const TestimonialService = mockTestimonialProvider;
export const MediaService = { getMedia: async () => [] as import("@/models").MediaAsset[] };
export const AnalyticsService = {
  track: (event: string, properties?: Record<string, string | number | boolean>) => {
    if (process.env.NODE_ENV === "development") console.debug(`[analytics] ${event}`, properties);
  },
};
