/**
 * Extract Order IDs from raw email text.
 * Handles:
 * - Shopify order numbers (#1001, 1001)
 * - Bol.com 16-digit order IDs
 * - Spaces inside numbers
 * - Multiple occurrences
 * - Forwarded email headers
 */

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
  
      // Normalize text
      const normalized = rawEmail
        .replace(/\r\n/g, "\n")
        .replace(/\n+/g, "\n")
        .replace(/Forwarded message:/gi, "")
        .replace(/Fwd:/gi, "")
        .trim();
  
      // Shopify patterns
      // Example: #1001 or Order 1001
      const shopifyRegex = /#?\s?(\d{3,6})\b/g;
  
      // Bol.com order ID pattern (16 digits)
      const bolRegex = /\b\d{16}\b/g;
  
      let match;
  
      // Extract Shopify
      while ((match = shopifyRegex.exec(normalized)) !== null) {
        const orderNumber = match[1];
        if (orderNumber && !result.shopifyOrders.includes(orderNumber)) {
          result.shopifyOrders.push(orderNumber);
        }
      }
  
      // Extract Bol
      while ((match = bolRegex.exec(normalized)) !== null) {
        const bolId = match[0];
        if (bolId && !result.bolOrders.includes(bolId)) {
          result.bolOrders.push(bolId);
        }
      }
  
      return result;
  
    } catch (error: any) {
      result.errors.push(error.message || "Unknown extraction error");
      return result;
    }
  }
  