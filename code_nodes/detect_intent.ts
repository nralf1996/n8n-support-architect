export type Intent =
  | "status"
  | "refund"
  | "return"
  | "complaint"
  | "other";

export function detectIntent(text: string): Intent {
  const lower = text.toLowerCase();

  // STATUS
  if (
    lower.includes("waar is mijn") ||
    lower.includes("nog niet ontvangen") ||
    lower.includes("vertraagd") ||
    lower.includes("track") ||
    lower.includes("tracking")
  ) {
    return "status";
  }

  // REFUND
  if (
    lower.includes("geld terug") ||
    lower.includes("refund") ||
    lower.includes("terugbetaling")
  ) {
    return "refund";
  }

  // RETURN
  if (
    lower.includes("retour") ||
    lower.includes("terugsturen") ||
    lower.includes("return")
  ) {
    return "return";
  }

  // COMPLAINT
  if (
    lower.includes("kapot") ||
    lower.includes("beschadigd") ||
    lower.includes("defect") ||
    lower.includes("werkt niet")
  ) {
    return "complaint";
  }

  return "other";
}
