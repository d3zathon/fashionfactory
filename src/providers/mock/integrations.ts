import type { AnalyticsProvider, MediaProvider } from "../interfaces";

export const mockMediaProvider: MediaProvider = {
  async getMedia() { return []; },
};

export const noOpAnalyticsProvider: AnalyticsProvider = {
  track() {},
};
