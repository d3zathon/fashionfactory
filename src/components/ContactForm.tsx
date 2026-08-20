"use client";

import { FormEvent, useState } from "react";
import { ContactService, AnalyticsService } from "@/services";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    if (!name || !phone || !message) { setState("error"); return; }
    try {
      const result = await ContactService.submitInquiry({ name, phone, message, categoryId: String(form.get("category") ?? "") || undefined });
      if (!result.success) throw new Error("Submission failed");
      AnalyticsService.track("contact_form_submission");
      event.currentTarget.reset();
      setState("success");
    } catch { setState("error"); }
  }
  return <form className="contact-form" onSubmit={submit} noValidate>
    <label>Name<input name="name" required placeholder="Your name" /></label>
    <label>Phone / WhatsApp<input name="phone" required inputMode="tel" placeholder="+977 ..." /></label>
    <label>Product / category (optional)<input name="category" placeholder="What are you looking for?" /></label>
    <label>Message<textarea name="message" required rows={5} placeholder="Tell us what you'd like to know..." /></label>
    <button className="btn btn-dark" disabled={state === "loading"}>{state === "loading" ? "Sending…" : "Send Inquiry"}</button>
    {state === "success" && <p className="form-success" role="status">Thanks — your inquiry was received.</p>}
    {state === "error" && <p className="form-error" role="alert">Please complete the required fields and try again.</p>}
  </form>;
}
