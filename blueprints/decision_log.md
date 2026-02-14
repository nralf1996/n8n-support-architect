# Architecture Decisions

## 1. Email First

Reason:
Shopify and Bol.com customer questions arrive via email.
Email is the single source of truth.

---

## 2. Regex Before AI

Reason:
Order ID extraction should be deterministic.
AI is only used as fallback, not primary extractor.

---

## 3. HTTP Nodes for API Calls

Reason:
n8n HTTP Nodes:
- Handle authentication securely
- Provide visual debugging
- Separate network logic from code logic

Code Nodes should not perform API calls.

---

## 4. AI Restricted to Drafting

Reason:
AI should not make business decisions.
It should only generate structured draft text.

---

## 5. Human-in-the-loop Mandatory

Reason:
Customer support carries financial and legal risk.
All emails must be reviewed before sending.

---

## 6. Error Handling Strategy

If API call fails:
- Append error to SupportContext.errors
- Still generate a draft explaining delay
- Never crash workflow

---

## 7. Deterministic Over Autonomous

Reason:
Predictable systems are easier to debug.
Avoid autonomous decision-making.
