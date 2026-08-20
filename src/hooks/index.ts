"use client";

import { useEffect, useState } from "react";
import { CategoryService, ContentService, InstagramService, ProductService, StoreSettingsService, TestimonialService } from "@/services";
import type { Category, FAQ, HomepageContent, InstagramPost, Product, StoreSettings, Testimonial } from "@/models";

function useAsync<T>(loader: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => { let active = true; loader().then((value) => active && setData(value)).catch((err) => active && setError(err instanceof Error ? err : new Error("Unable to load data"))).finally(() => active && setLoading(false)); return () => { active = false; }; }, [loader]);
  return { data, loading, error };
}

export const useProducts = () => useAsync<Product[]>(ProductService.getProducts, []);
export const useFeaturedProducts = () => useAsync<Product[]>(ProductService.getFeaturedProducts, []);
export const useCategories = () => useAsync<Category[]>(CategoryService.getCategories, []);
export const useStoreSettings = () => useAsync<StoreSettings>(StoreSettingsService.getStoreSettings, {} as StoreSettings);
export const useInstagram = () => useAsync<InstagramPost[]>(() => InstagramService.getLatestPosts(4), []);
export const useTestimonials = () => useAsync<Testimonial[]>(TestimonialService.getTestimonials, []);
export const useHomepageContent = () => useAsync<HomepageContent>(ContentService.getHomepageContent, {} as HomepageContent);
export const useFAQs = () => useAsync<FAQ[]>(ContentService.getFAQs, []);
