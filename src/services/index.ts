import { mockCategoryProvider, mockContactProvider, mockContentProvider, mockInstagramProvider, mockProductProvider, mockStoreSettingsProvider, mockTestimonialProvider } from "@/providers/mock";
import { mockCollectionProvider, mockMediaProvider, noOpAnalyticsProvider } from "@/providers/mock/integrations";

export const ProductService = mockProductProvider;
export const CategoryService = mockCategoryProvider;
export const CollectionService = mockCollectionProvider;
export const ContentService = mockContentProvider;
export const InstagramService = mockInstagramProvider;
export const ContactService = mockContactProvider;
export const StoreSettingsService = mockStoreSettingsProvider;
export const TestimonialService = mockTestimonialProvider;
export const MediaService = mockMediaProvider;
export const AnalyticsService = noOpAnalyticsProvider;
