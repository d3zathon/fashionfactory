import type { AnalyticsProvider, CollectionProvider, MediaProvider } from "../interfaces";
import { collections } from "@/data/mock";

export const mockCollectionProvider: CollectionProvider = {
  async getCollections() { return collections.filter((collection) => collection.active).sort((a, b) => a.sortOrder - b.sortOrder); },
  async getCollection(slug) { return collections.find((collection) => collection.active && collection.slug === slug) ?? null; },
};

export const mockMediaProvider: MediaProvider = {
  async getMedia() { return []; },
};

export const noOpAnalyticsProvider: AnalyticsProvider = {
  track() {},
};
