import { SupportContext } from "./build_context";
import { OrderData } from "./fetch_order_data";

export function generateDraft(
  context: SupportContext,
  orderData: OrderData | null
): string {

  if (!context.order_id) {
    return `
Beste klant,

Dank voor je bericht. Kun je ons je bestelnummer sturen zodat we je verder kunnen helpen?

Met vriendelijke groet,
Klantenservice
`.trim();
  }

  if (!orderData) {
    return `
Beste klant,

Dank voor je bericht over bestelling ${context.order_id}.

We controleren dit momenteel handmatig en komen zo snel mogelijk bij je terug.

Met vriendelijke groet,
Klantenservice
`.trim();
  }

  // STATUS intent
  if (context.intent === "status") {
    return `
Beste klant,

Je bestelling ${context.order_id} heeft momenteel de status: ${orderData.status}.

Track & trace:
${orderData.tracking_url ?? "Nog niet beschikbaar."}

Met vriendelijke groet,
Klantenservice
`.trim();
  }

  // REFUND intent
  if (context.intent === "refund") {
    return `
Beste klant,

We hebben je verzoek tot terugbetaling ontvangen voor bestelling ${context.order_id}.

Onze administratie zal dit beoordelen. Je ontvangt binnen enkele werkdagen een update.

Met vriendelijke groet,
Klantenservice
`.trim();
  }

  // RETURN intent
  if (context.intent === "return") {
    return `
Beste klant,

Je kunt bestelling ${context.order_id} retourneren.

Huidige retourstatus:
${orderData.return_status ?? "Geen retour geregistreerd."}

Met vriendelijke groet,
Klantenservice
`.trim();
  }

  // COMPLAINT intent
  if (context.intent === "complaint") {
    return `
Beste klant,

Wat vervelend om te horen dat er een probleem is met bestelling ${context.order_id}.

Kun je ons eventueel een foto sturen van het probleem? Dan lossen we dit zo snel mogelijk voor je op.

Met vriendelijke groet,
Klantenservice
`.trim();
  }

  // Default fallback
  return `
Beste klant,

Dank voor je bericht over bestelling ${context.order_id}.

We hebben je vraag ontvangen en komen zo snel mogelijk bij je terug.

Met vriendelijke groet,
Klantenservice
`.trim();
}
