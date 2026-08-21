import { mockCollectionProvider, mockContentProvider, mockTestimonialProvider } from "@/providers/mock";
import { mockMediaProvider, noOpAnalyticsProvider } from "@/providers/mock/integrations";
import { staticCategoryProvider, staticProductProvider, staticStoreSettingsProvider } from "@/providers/static";
import { liveContactProvider } from "@/providers/live/contact";
import { liveInstagramProvider } from "@/providers/live/instagram";
import { webAnalyticsProvider } from "@/providers/live/analytics";

// Products are read from the committed src/data/products.json, which the admin
// panel's "Publish" flow regenerates from Supabase — see src/app/admin and
// .github/workflows/publish.yml. The public site never calls Supabase directly.
export const ProductService = staticProductProvider;
export const CategoryService = staticCategoryProvider;
export const CollectionService = mockCollectionProvider;
export const ContentService = mockContentProvider;
export const StoreSettingsService = staticStoreSettingsProvider;
export const TestimonialService = mockTestimonialProvider;
export const MediaService = mockMediaProvider;

// Contact and Instagram always go through their API routes, which decide
// server-side (where the real secrets live) whether to call the live
// integration or fall back to mock behavior. Never branch on secret env vars
// in this file — it's bundled into client components.
export const ContactService = liveContactProvider;
export const InstagramService = liveInstagramProvider;

// GA4 / Meta Pixel IDs are NEXT_PUBLIC_ and safe to branch on client-side:
// sending them to the browser is required for the scripts to work at all.
export const AnalyticsService =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID
    ? webAnalyticsProvider
    : noOpAnalyticsProvider;
