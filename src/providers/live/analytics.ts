import type { AnalyticsProvider } from "../interfaces";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export const webAnalyticsProvider: AnalyticsProvider = {
  track(event, properties) {
    if (typeof window === "undefined") return;
    window.gtag?.("event", event, properties);
    window.fbq?.("trackCustom", event, properties);
  },
};
