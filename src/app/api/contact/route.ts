import { NextResponse } from "next/server";
import type { ContactInquiry } from "@/models";
import { getStoreProfile } from "@/providers/static";
import { clientKey, rateLimit } from "@/lib/rateLimit";

// Five inquiries per address per ten minutes. A real customer sends one, maybe
// two if the first seems not to have gone through; anything past five in ten
// minutes is not someone shopping.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

// Upper bounds, not formatting rules — they exist so a script cannot post a
// megabyte of text through a form meant for a sentence or two.
const MAX_LENGTHS: Record<keyof ContactInquiry, number> = {
  name: 100,
  phone: 32,
  message: 2000,
  productId: 200,
  categoryId: 200,
};

interface ContactPayload extends Partial<ContactInquiry> {
  /** Honeypot — see below. */
  contact_reference?: string;
}

function validate(data: Partial<ContactInquiry>): string | null {
  if (!data.name || data.name.trim().length < 2) return "Please enter your name.";
  if (!data.phone || !/^[+\d][\d\s().-]{6,}$/.test(data.phone)) return "Please enter a valid phone or WhatsApp number.";
  if (!data.message || data.message.trim().length < 10) return "Please add a little more detail to your message.";

  for (const [field, max] of Object.entries(MAX_LENGTHS) as [keyof ContactInquiry, number][]) {
    const value = data[field];
    if (typeof value === "string" && value.length > max) {
      return `That ${field === "message" ? "message" : "value"} is too long.`;
    }
  }
  return null;
}

function formatMessage(data: ContactInquiry): string {
  const lines = [
    `New inquiry from the ${getStoreProfile().name} website`,
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
  ];
  if (data.categoryId) lines.push(`Product/category: ${data.categoryId}`);
  if (data.productId) lines.push(`Product: ${data.productId}`);
  lines.push(`Message: ${data.message}`);
  return lines.join("\n");
}

export async function POST(request: Request) {
  let body: ContactPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot. The form renders a decoy field that is hidden from sight, from
  // assistive technology and from the tab order; a human never fills it in,
  // while a bot that fills every input does. Answered with the same success the
  // real path returns, so the script has no signal to adapt to — and nothing is
  // forwarded. Its name is deliberately not one browser autofill recognises,
  // so a real customer is never dropped by their own browser.
  if (typeof body.contact_reference === "string" && body.contact_reference.trim() !== "") {
    return NextResponse.json({ success: true, id: `dropped-${Date.now()}` });
  }

  const limit = rateLimit(`contact:${clientKey(request)}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, error: "Too many inquiries from this connection. Please try again shortly, or message the store on WhatsApp." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ success: false, error: validationError }, { status: 400 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const data = body as ContactInquiry;

  if (!botToken || !chatId) {
    // No delivery route configured on this host. This used to answer with the
    // mock provider's success, so a customer filled in the form, read "your
    // inquiry was received", and reached nobody — the worst possible failure
    // for the one page element whose entire job is to reach the shop. Fail
    // honestly and hand them the channel that does work. Setting
    // TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID switches this off with no code
    // change, exactly as before.
    return NextResponse.json(
      {
        success: false,
        error: `The inquiry form isn't connected yet — your message was not sent. Please message ${getStoreProfile().name} on WhatsApp instead and we'll reply there.`,
      },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: formatMessage(data) }),
    });
    if (!response.ok) {
      return NextResponse.json({ success: false, error: "Unable to deliver inquiry." }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ success: false, error: "Unable to deliver inquiry." }, { status: 502 });
  }

  return NextResponse.json({ success: true, id: `telegram-${Date.now()}` });
}
