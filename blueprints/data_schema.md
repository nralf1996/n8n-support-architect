# SupportContext Schema

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

---

# Gmail Input Schema

Incoming Gmail Trigger object:

{
  from: string,
  subject: string,
  body: string,
  threadId: string,
  messageId: string,
  date: string
}

---

# Shopify API Response (Simplified)

{
  id: string,
  order_number: string,
  financial_status: string,
  fulfillment_status: string,
  tracking_url: string,
  line_items: [
    {
      title: string,
      quantity: number
    }
  ]
}

---

# Bol.com API Response (Simplified)

{
  orderId: string,
  shipmentStatus: string,
  returnStatus: string,
  trackingCode: string,
  items: [
    {
      title: string,
      quantity: number
    }
  ]
}
