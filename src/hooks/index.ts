"use client";

import { useCallback, useEffect, useState } from "react";
import { CategoryService, CollectionService, ContactService, ContentService, InstagramService, MediaService, ProductService, StoreSettingsService, TestimonialService } from "@/services";
import type { Category, Collection, ContactInquiry, ContactMeta, FAQ, HomepageContent, InstagramPost, MediaAsset, Product, StoreProfile, Testimonial } from "@/models";

function useAsync<T>(loader: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    loader()
      .then((value) => active && setData(value))
      .catch((err) => active && setError(err instanceof Error ? err : new Error("Unable to load data")))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [loader]);

  return { data, loading, error };
}

export const useProducts = () => useAsync<Product[]>(ProductService.getProducts, []);
export const useFeaturedProducts = () => useAsync<Product[]>(ProductService.getFeaturedProducts, []);
export const useCategories = () => useAsync<Category[]>(CategoryService.getCategories, []);
export const useCollections = () => useAsync<Collection[]>(CollectionService.getCollections, []);
export const useStoreSettings = () => useAsync<StoreProfile>(StoreSettingsService.getStoreSettings, {} as StoreProfile);
/**
 * Latest Instagram posts.
 *
 * `enabled` is what a store's `instagramFeed` feature flag maps onto: a store
 * with the section switched off should not pay for the request that fills it.
 * Disabled resolves to an empty list rather than skipping the hook, so the
 * caller's hook order never changes with the flag.
 */
export const useInstagram = (enabled = true) => {
  const loadInstagram = useCallback(
    () => (enabled ? InstagramService.getLatestPosts(4) : Promise.resolve<InstagramPost[]>([])),
    [enabled]
  );
  return useAsync<InstagramPost[]>(loadInstagram, []);
};
export const useTestimonials = () => useAsync<Testimonial[]>(TestimonialService.getTestimonials, []);
export const useHomepageContent = () => useAsync<HomepageContent>(ContentService.getHomepageContent, {} as HomepageContent);
export const useFAQs = () => useAsync<FAQ[]>(ContentService.getFAQs, []);
export const useMedia = () => useAsync<MediaAsset[]>(MediaService.getMedia, []);

export function useContact() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState(false);
  const submit = useCallback(async (data: ContactInquiry, meta?: ContactMeta) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await ContactService.submitInquiry(data, meta);
      if (!result.success) throw new Error(result.error ?? "Unable to submit inquiry");
      setSuccess(true);
      return result;
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error("Unable to submit inquiry");
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, []);
  return { submit, loading, error, success };
}
