# Phase 20 Discussion Log

## Decision: Capture intent, defer provider delivery
Recommendation accepted inline. Back-in-stock requests will persist explicit consent and contact email, but no email/SMS provider or job runner is introduced.

## Decision: Server-side reorder
Recommendation accepted inline. Reorder uses the current catalog and cart model, not historical order prices supplied by the client.

## Decision: Explainable recommendations
Recommendation accepted inline. Recommendations use category/gender/rating/catalog rules with reason text and bounded limits, not user tracking.

## Open Questions
- Which lifecycle provider should deliver back-in-stock or cart-recovery messages remains a future external-service decision.

