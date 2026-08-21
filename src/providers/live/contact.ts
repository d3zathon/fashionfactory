import type { ContactProvider } from "../interfaces";

export const liveContactProvider: ContactProvider = {
  async submitInquiry(data) {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) return { success: false, error: result.error ?? "Unable to submit inquiry." };
      return result;
    } catch {
      return { success: false, error: "Unable to submit inquiry. Please check your connection." };
    }
  },
};
