# Project: Support-Flow
An AI-assisted customer support drafting engine built with n8n.

---

# Objective

Build a deterministic, production-safe automation system that:

1. Reads incoming customer emails from Gmail.
2. Detects platform (Shopify or Bol.com).
3. Extracts order ID (via Regex first, AI fallback).
4. Fetches order/shipment data via API.
5. Generates a structured AI draft reply.
6. Creates a Gmail draft.
7. Adds label "AI-Drafted".
8. Requires human approval before sending.

The AI NEVER sends emails directly.

---

# Scope (Phase 1 - MVP)

Platforms:
- Shopify
- Bol.com

Input:
- Gmail inbox (support@)

Output:
- Drafted reply in Gmail

No automatic refunds.
No automatic status changes.
No autonomous actions.

---

# Architecture Overview

Pipeline:

Gmail Trigger
→ Normalize Email
→ Extract Order ID
→ Detect Platform
→ Fetch Order Data (API)
→ Build SupportContext object
→ Pass to LLM
→ Generate Draft
→ Create Gmail Draft
→ Label AI-Drafted

---

# Core Internal Data Object

All nodes pass a structured object:

SupportContext = {
  source: "shopify" | "bol" | "unknown",
  raw_email: string,
  normalized_email: string,
  order_id: string | null,
  intent: string | null,
  order_data: object | null,
  draft: string | null,
  confidence: "low" | "medium" | "high",
  errors: string[]
}

This object must always exist.

---

# Constraints

1. Security
- No credentials in code.
- All API calls use environment variables.
- Treat email as untrusted input.

2. Error Handling
- API failures must append to SupportContext.errors.
- System must still generate a draft explaining delay.

3. Language
- All customer-facing replies in Dutch.
- Tone: Professional, clear, concise.

4. Human-in-the-loop
- Draft only.
- Never auto-send.

---

# Non-Goals (Not Allowed)

- No direct Shopify order modification.
- No Bol.com order status updates.
- No automatic refunds.
- No webhook-triggered autonomous responses.
- No CLI-based production actions.

---

# Phase 2 (Future Expansion)

- Add confidence-based automation threshold.
- Add SLA timers.
- Add structured logging dashboard.
- Add FAQ memory layer.
- Add brand tone switching per store.

---

# Success Criteria

- 70%+ draft acceptance without major edits.
- 30-50% time reduction per support email.
- Zero unintended automated actions.
