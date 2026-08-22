import type { ContactProvider } from "../interfaces";

export const liveContactProvider: ContactProvider = {
  async submitInquiry(data, meta) {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The decoy travels under its form field name; the route drops the
        // submission when it arrives non-empty.
        body: JSON.stringify({ ...data, contact_reference: meta?.honeypot ?? "" }),
      });
      const result = await response.json();
      if (!response.ok) return { success: false, error: result.error ?? "Unable to submit inquiry." };
      return result;
    } catch {
      return { success: false, error: "Unable to submit inquiry. Please check your connection." };
    }
  },
};
