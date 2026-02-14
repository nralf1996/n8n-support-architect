export interface ExtractionResult {
  shopifyOrders: string[];
  bolOrders: string[];
  errors: string[];
}

export function extractOrderIds(rawEmail: string): ExtractionResult {
  const result: ExtractionResult = {
    shopifyOrders: [],
    bolOrders: [],
    errors: [],
  };

  try {
    if (!rawEmail || typeof rawEmail !== "string") {
      result.errors.push("Invalid email input");
      return result;
    }

    const normalized = rawEmail
      .replace(/\r\n/g, "\n")
      .replace(/\n+/g, "\n")
      .replace(/Forwarded message:/gi, "")
      .replace(/Fwd:/gi, "")
      .trim();

    let match: RegExpExecArray | null;

    // -----------------------------
    // 1️⃣ BOL NUMERIC (16 digits)
    // -----------------------------
    const bolNumericRegex = /\b\d{16}\b/g;

    while ((match = bolNumericRegex.exec(normalized)) !== null) {
      const bolId = match[0];

      if (!result.bolOrders.includes(bolId)) {
        result.bolOrders.push(bolId);
      }
    }

    // --------------------------------------------------
    // 2️⃣ BOL ALPHANUMERIC (must contain at least 1 letter)
    // Context words supported
    // --------------------------------------------------
    const bolAlphaRegex =
      /(bestelling|bestelnummer|ordernummer|order)\s+([A-Z0-9]*[A-Z][A-Z0-9]{6,})/gi;

    while ((match = bolAlphaRegex.exec(normalized)) !== null) {
      const bolId = match[2];

      if (!result.bolOrders.includes(bolId)) {
        result.bolOrders.push(bolId);
      }
    }

    // -----------------------------
    // 3️⃣ SHOPIFY (short numeric)
    // -----------------------------
    const shopifyRegex =
  /(bestelling|order|ordernummer|bestelnummer|referentie|reference)\s*#?\s*(\d{3,6})\b/gi;


    while ((match = shopifyRegex.exec(normalized)) !== null) {
      const orderNumber = match[2];

      // Safety: ignore if part of bol ID
      const partOfBol = result.bolOrders.some((bolId) =>
        bolId.includes(orderNumber)
      );

      if (!partOfBol && !result.shopifyOrders.includes(orderNumber)) {
        result.shopifyOrders.push(orderNumber);
      }
    }

    return result;

  } catch (error: any) {
    result.errors.push(error.message || "Unknown extraction error");
    return result;
  }
}
