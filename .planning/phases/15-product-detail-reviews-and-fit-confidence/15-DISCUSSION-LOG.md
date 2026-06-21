# Phase 15: Product Detail Reviews and Fit Confidence - Discussion Log

> Audit trail only. Do not use as input to planning, research, or execution work.
> Decisions are captured in CONTEXT.md; this log preserves the alternatives considered.

**Date:** 2026-06-20
**Phase:** 15-product-detail-reviews-and-fit-confidence
**Areas discussed:** product detail route, rich product fields, review API, verified purchase, aggregation, fit guidance, related products, feature flag

---

## Product Detail Route

| Option | Description | Selected |
|--------|-------------|----------|
| `/products/:id` | Canonical public route aligned with API resource naming | yes |
| `/product/:id` | Singular route, shorter but less consistent with REST naming | |
| Quick View only | Extend modal instead of adding route | |

**User's choice:** Auto-approved recommendation.
**Notes:** Dedicated route is required by Phase 15 and keeps deep links/shareability possible.

---

## Rich Product Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Add optional fields | Add `gallery`, `materials`, `careInstructions`, and `fitGuide` without requiring them | yes |
| Replace product schema | Make rich fields mandatory for all products | |
| Frontend-only fallback | Avoid backend schema changes | |

**User's choice:** Auto-approved recommendation.
**Notes:** Additive optional fields preserve existing catalog/admin behavior.

---

## Review API Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Product subresources | `GET/POST /api/products/:id/reviews` | yes |
| Top-level reviews | `/api/reviews?productId=...` and `/api/reviews` | |
| Frontend-only testimonials | No persisted product reviews | |

**User's choice:** Auto-approved recommendation.
**Notes:** Product subresources make ownership and docs clearer for this phase.

---

## Verified Purchase Rule

| Option | Description | Selected |
|--------|-------------|----------|
| Paid/not-required non-cancelled order | User has an owned order containing product and payment state proves purchase | yes |
| Delivered-only order | Require fulfillment delivered before review | |
| Any order attempt | Allow pending/payment-failed attempts | |

**User's choice:** Auto-approved recommendation.
**Notes:** Existing order/payment state can prove purchase without weakening checkout rules.

---

## Review Safety

| Option | Description | Selected |
|--------|-------------|----------|
| Plain text and validation | Strict fields, bounded lengths, no HTML rendering | yes |
| Rich text comments | Allow formatted review bodies | |
| Admin moderation first | Block public reviews until moderation UI exists | |

**User's choice:** Auto-approved recommendation.
**Notes:** This satisfies abuse-safe rendering without adding an admin moderation surface.

---

## Related Products

| Option | Description | Selected |
|--------|-------------|----------|
| Deterministic catalog rule | Same gender/category first, fallback to same category/rating, bounded | yes |
| Personalized recommendations | Use user behavior or history | |
| Manual merchandising | Admin-curated related product ids | |

**User's choice:** Auto-approved recommendation.
**Notes:** Deterministic bounded rules are testable and avoid Phase 20 personalization.

---

## Feature Flag

| Option | Description | Selected |
|--------|-------------|----------|
| Enabled by default with false kill switch | Reviews show unless `REACT_APP_ENABLE_REVIEWS=false` | yes |
| Disabled by default | Require explicit `true` to show reviews | |
| Remove flag | Always show reviews | |

**User's choice:** Auto-approved recommendation.
**Notes:** Phase 15 makes reviews a shipped feature while preserving a rollback switch.

---

## the agent's Discretion

- Internal helper names, component boundaries, exact fallback fit copy, and test-file split.

## Deferred Ideas

- Review moderation dashboard.
- Review media uploads.
- Helpful votes, review comments, and Q&A.
- Personalized recommendations.
