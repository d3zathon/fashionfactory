"use client";

import { FormEvent, useState } from "react";
import { ContactService, AnalyticsService } from "@/services";

interface FieldErrors {
  name?: string;
  phone?: string;
  message?: string;
}

export function ContactForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  // What the server said went wrong, when it said anything useful. Previously
  // every failure — including "this form has no delivery route configured, your
  // message went nowhere" — was flattened into "please try again", which sends
  // the customer around a loop that cannot succeed.
  const [failure, setFailure] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const category = String(data.get("category") ?? "").trim();
    // Decoy field: empty for every human, filled by bots that autofill inputs.
    const honeypot = String(data.get("contact_reference") ?? "");
    const nextErrors: FieldErrors = {};

    if (name.length < 2) nextErrors.name = "Please enter your name.";
    if (!/^[+\d][\d\s().-]{6,}$/.test(phone)) nextErrors.phone = "Please enter a valid phone or WhatsApp number.";
    if (message.length < 10) nextErrors.message = "Please add a little more detail to your message.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setFailure(null);
      setState("error");
      return;
    }

    setState("loading");
    setFailure(null);
    try {
      const result = await ContactService.submitInquiry(
        { name, phone, message, categoryId: category || undefined },
        { honeypot }
      );
      if (!result.success) throw new Error(result.error ?? "Submission failed");
      AnalyticsService.track("contact_form_submission");
      form.reset();
      setErrors({});
      setState("success");
    } catch (error) {
      setFailure(error instanceof Error ? error.message : null);
      setState("error");
    }
  }

  return (
    <form className="contact-form" onSubmit={submit} noValidate>
      <label>Name<input name="name" required autoComplete="name" placeholder="Your name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "contact-name-error" : undefined} />{errors.name && <span id="contact-name-error" className="field-error">{errors.name}</span>}</label>
      <label>Phone / WhatsApp<input name="phone" required inputMode="tel" autoComplete="tel" placeholder="+977 ..." aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "contact-phone-error" : undefined} />{errors.phone && <span id="contact-phone-error" className="field-error">{errors.phone}</span>}</label>
      <label>Product / category (optional)<input name="category" placeholder="What are you looking for?" /></label>
      {/* Decoy. Hidden from sight, from assistive technology and from the tab
          order — positioned off-screen rather than display:none, which some bots
          skip. Named "contact_reference" rather than something like "company":
          bots fill every input they find, but browser autofill matches known
          field types, and an autofilled organisation name would silently
          discard a real customer's inquiry. */}
      <div className="hp-field" aria-hidden="true">
        <label>
          Reference
          <input name="contact_reference" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <label>Message<textarea name="message" required rows={5} placeholder="Tell us what you'd like to know..." aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "contact-message-error" : undefined} />{errors.message && <span id="contact-message-error" className="field-error">{errors.message}</span>}</label>
      <button className="btn btn-dark" disabled={state === "loading"}>{state === "loading" ? "Sending…" : "Send Inquiry"}</button>
      {state === "success" && <p className="form-success" role="status">Thanks — your inquiry was received.</p>}
      {state === "error" && !Object.keys(errors).length && (
        <p className="form-error" role="alert">
          {failure ?? "We couldn't send your inquiry. Please try again."}
        </p>
      )}
    </form>
  );
}
