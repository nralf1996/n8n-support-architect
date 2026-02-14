"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSupportContext = buildSupportContext;
const extract_order_1 = require("./extract_order");
const detect_intent_1 = require("./detect_intent");
function detectPlatform(email, extraction) {
    const sender = email.from.toLowerCase();
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();
    if (sender.includes("bol.com"))
        return "bol";
    if (subject.includes("via bol.com"))
        return "bol";
    if (body.includes("bol.com") || body.includes(" bol "))
        return "bol";
    if (extraction.bolOrders.length > 0)
        return "bol";
    if (extraction.shopifyOrders.length > 0)
        return "shopify";
    return "unknown";
}
function buildSupportContext(email) {
    const errors = [];
    const combinedText = `${email.subject}\n${email.body}`;
    const normalized = combinedText
        .replace(/\r\n/g, "\n")
        .replace(/\n+/g, "\n")
        .trim();
    const extraction = (0, extract_order_1.extractOrderIds)(normalized);
    const platform = detectPlatform(email, extraction);
    let order_id = null;
    if (platform === "bol" && extraction.bolOrders.length > 0) {
        order_id = extraction.bolOrders[0];
    }
    if (platform === "shopify" && extraction.shopifyOrders.length > 0) {
        order_id = extraction.shopifyOrders[0];
    }
    const intent = (0, detect_intent_1.detectIntent)(normalized);
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
