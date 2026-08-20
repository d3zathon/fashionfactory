import type { AnalyticsProvider, CollectionProvider, MediaProvider } from "../interfaces";

export const mockCollectionProvider: CollectionProvider = { async getCollections() { return []; } };
export const mockMediaProvider: MediaProvider = { async getMedia() { return []; } };
export const noOpAnalyticsProvider: AnalyticsProvider = { track() {} };
