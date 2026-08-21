import { NextResponse } from "next/server";
import type { ContactInquiry } from "@/models";
import { mockContactProvider } from "@/providers/mock";

function validate(data: Partial<ContactInquiry>): string | null {
  if (!data.name || data.name.trim().length < 2) return "Please enter your name.";
  if (!data.phone || !/^[+\d][\d\s().-]{6,}$/.test(data.phone)) return "Please enter a valid phone or WhatsApp number.";
  if (!data.message || data.message.trim().length < 10) return "Please add a little more detail to your message.";
  return null;
}

function formatMessage(data: ContactInquiry): string {
  const lines = [
    "New inquiry from Fashion Factory website",
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
  ];
  if (data.categoryId) lines.push(`Product/category: ${data.categoryId}`);
  if (data.productId) lines.push(`Product: ${data.productId}`);
  lines.push(`Message: ${data.message}`);
  return lines.join("\n");
}

export async function POST(request: Request) {
  let body: Partial<ContactInquiry>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ success: false, error: validationError }, { status: 400 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const data = body as ContactInquiry;

  if (!botToken || !chatId) {
    // Telegram forwarding isn't configured on this host yet.
    return NextResponse.json(await mockContactProvider.submitInquiry(data));
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
