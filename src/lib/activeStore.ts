import { getStoreProfile } from "@/providers/static";

/**
 * The store this deployment serves.
 *
 * One deployment serves one store, so the scope is fixed at build time rather
 * than chosen per session. NEXT_PUBLIC_STORE_SLUG overrides it (useful when
 * pointing a preview deployment at a different tenant); otherwise it is
 * whichever store the committed data was generated for.
 *
 * Lives in its own module so middleware and server routes can read it without
 * importing src/providers/live/supabaseStore, which pulls in the browser
 * Supabase client and has no business in the edge bundle.
 */
export const ACTIVE_STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG || getStoreProfile().slug;
