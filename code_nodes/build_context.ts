import { extractOrderIds } from "./extract_order";
import { detectIntent, Intent } from "./detect_intent";

export type Platform = "shopify" | "bol" | "unknown";

export interface EmailInput {
  from: string;
  subject: string;
  body: string;
}

export interface SupportContext {
  source: Platform;
  raw_email: string;
  normalized_email: string;
  order_id: string | null;
  intent: Intent;
  errors: string[];
}

function detectPlatform(email: EmailInput, extraction: any): Platform {
  const sender = email.from.toLowerCase();
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();

  if (sender.includes("bol.com")) return "bol";
  if (subject.includes("via bol.com")) return "bol";
  if (body.includes("bol.com") || body.includes(" bol ")) return "bol";

  if (extraction.bolOrders.length > 0) return "bol";
  if (extraction.shopifyOrders.length > 0) return "shopify";

  return "unknown";
}

export function buildSupportContext(email: EmailInput): SupportContext {
  const errors: string[] = [];

  const combinedText = `${email.subject}\n${email.body}`;

  const normalized = combinedText
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, "\n")
    .trim();

  const extraction = extractOrderIds(normalized);

  const platform = detectPlatform(email, extraction);

  let order_id: string | null = null;

  if (platform === "bol" && extraction.bolOrders.length > 0) {
    order_id = extraction.bolOrders[0];
  }

  if (platform === "shopify" && extraction.shopifyOrders.length > 0) {
    order_id = extraction.shopifyOrders[0];
  }

  const intent = detectIntent(normalized);

  errors.push(...extraction.errors);

  return {
    source: platform,
    raw_email: combinedText,
    normalized_email: normalized,
    order_id,
    intent,
    errors,
  };
}
