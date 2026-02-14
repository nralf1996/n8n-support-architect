"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchOrderDataMock = fetchOrderDataMock;
function fetchOrderDataMock(context) {
    if (!context.order_id) {
        return { context, order_data: null };
    }
    // Fake Shopify example
    if (context.source === "shopify") {
        return {
            context,
            order_data: {
                status: "verzonden",
                tracking_url: "https://track.shopify.com/ABC123",
                return_status: null,
                items: [
                    { title: "Ergonomisch Kussen", quantity: 1 }
                ]
            }
        };
    }
    // Fake Bol example
    if (context.source === "bol") {
        return {
            context,
            order_data: {
                status: "in behandeling",
                tracking_url: null,
                return_status: "geen retour aangemeld",
                items: [
                    { title: "YAR Snorkel Masker", quantity: 1 }
                ]
            }
        };
    }
    return { context, order_data: null };
}
