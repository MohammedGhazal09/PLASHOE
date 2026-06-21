# Phase 15: Product Detail Reviews and Fit Confidence - Specification

**Created:** 2026-06-20
**Ambiguity score:** 0.11 (gate: <= 0.20)
**Requirements:** 7 locked

## Goal

Shoppers can open a dedicated product detail page, evaluate richer product information, read and submit verified-purchase reviews, see fit guidance, and discover bounded related products.

## Background

The backend already exposes `GET /api/products/:id`, product list filters, and admin product CRUD. The product model currently stores basic catalog fields only: name, gender, category, single image, price, rating, sizes, stock, sale flag, and description. The frontend renders product cards and Quick View, but there is no public product detail route. Reviews do not exist in the backend or frontend, although a dormant `REACT_APP_ENABLE_REVIEWS` flag exists. Orders contain user-owned purchased products, payment status, fulfillment status, and order items, which are enough to enforce verified-purchase review submission.

## Requirements

1. **Product detail route**: A public product detail route must render a single product with decision-ready commerce content.
   - Current: No `/products/:id` frontend route or page exists; shoppers can only inspect ProductCard and Quick View surfaces.
   - Target: `/products/:id` loads a product by id, renders media, price, stock, sizes, description, materials/care when available, wishlist control, and add-to-cart.
   - Acceptance: Frontend tests prove loading, success, not-found/error, size selection, wishlist control, and add-to-cart behavior on the product detail route.

2. **Richer product content fields**: Product data must support optional detail-page fields without breaking existing catalog/admin behavior.
   - Current: `Product.js` has only one image and a plain `description`; validators and seed data do not include materials, gallery, care, or fit guidance.
   - Target: Product schema, validators, seed data, normalizer, and docs support additive optional fields for `gallery`, `materials`, `careInstructions`, and `fitGuide`.
   - Acceptance: Backend product tests and frontend normalizer tests prove existing products remain valid and richer fields round-trip/render when present.

3. **Related products**: Product detail pages must show related products from a bounded, deterministic catalog rule.
   - Current: There is no related-products endpoint or frontend related-products section.
   - Target: `GET /api/products/:id/related` returns up to four products excluding the current product, preferring same gender/category and falling back to same category or rating order.
   - Acceptance: Backend tests prove self-exclusion, limit cap, ordering/fallback behavior, and invalid product id handling; frontend tests prove related products render as product cards/links.

4. **Review listing**: Shoppers can read public approved reviews for a product with safe rendering.
   - Current: No review model, API, validator, or UI exists.
   - Target: `GET /api/products/:id/reviews` returns paginated approved reviews with rating, title, comment, fit feedback, verified-purchase marker, limited user display name, and aggregate summary.
   - Acceptance: Backend tests prove pagination, approved-only public listing, aggregate fields, and HTML/script content is returned as plain text, not executable markup.

5. **Verified-purchase review submission**: Authenticated shoppers can submit one review per product only after purchasing that product.
   - Current: Orders exist, but no review submission workflow checks orders.
   - Target: `POST /api/products/:id/reviews` is protected, validates rating/title/comment/fit feedback, requires a paid or payment-not-required non-cancelled order containing the product, and rejects duplicates.
   - Acceptance: Backend tests prove unauthenticated `401`, non-purchaser `403`, invalid payload `400`, duplicate `409`, and successful verified review creation.

6. **Rating and fit aggregation**: Product detail and catalog ratings must reflect approved review data.
   - Current: Product `rating` is manually seeded/static and there is no review count or fit-confidence summary.
   - Target: Creating an approved review updates product `rating`, `reviewCount`, `ratingDistribution`, and review-derived fit summary in a bounded aggregate.
   - Acceptance: Backend tests prove average rating, review count, rating distribution, and fit summary update after review creation; frontend tests prove the detail page displays these values.

7. **Feature activation, docs, and verification**: Product detail and reviews must be documented, tested, and locally smoke-verified.
   - Current: Product detail/review docs and focused commands are absent; `REACT_APP_ENABLE_REVIEWS` defaults disabled.
   - Target: Reviews are enabled by default with `REACT_APP_ENABLE_REVIEWS=false` retained as a frontend kill switch; API/development/testing/config docs describe the product detail, reviews, and fit contracts.
   - Acceptance: Focused backend/frontend tests, frontend build, and desktop/mobile browser smoke evidence are recorded in `15-VERIFICATION.md`.

## Boundaries

**In scope:**
- Public product detail route and page for `/products/:id`.
- Additive product fields for richer detail content.
- Related-products backend endpoint and frontend rendering.
- Review model, protected verified-purchase submission, public listing, and rating/fit aggregation.
- Product detail review form/list UI with safe validation and rendering.
- Fit guidance at the product decision point.
- Focused backend/frontend tests, docs, build, browser smoke, and verification artifacts.

**Out of scope:**
- Review photo/video uploads - file upload/storage is a separate capability.
- Review helpful votes, comments, Q&A, or moderation dashboard - later community/admin scope.
- Personalized recommendations - Phase 20 owns lifecycle/personalization.
- Advanced catalog search/faceting - Phase 16 owns discovery/search.
- Changing checkout/payment/fulfillment rules - Phase 15 only reads orders for verified-purchase checks.
- Full rich-text review rendering - plain text only for safety.

## Constraints

- Do all work inline and do not use subagents.
- Keep existing product list, cart, checkout, wishlist, and admin behavior backward-compatible.
- New product fields must be optional and additive so existing seed/admin/test data stays valid.
- Review content must be boundary-validated, length-bounded, plain-text rendered, and never injected as HTML.
- Verified-purchase checks must use existing authenticated user and order ownership/payment state.
- Related products must be bounded by a hard maximum of 4 on the detail page and 8 at the API boundary.
- Public review listing must expose only limited user display fields, not email, address, token, or private order data.

## Acceptance Criteria

- [ ] `/products/:id` frontend route renders product media, price, stock, sizes, description, materials/care, wishlist, add-to-cart, reviews, fit guidance, and related products.
- [ ] Product schema/validators/normalizer support optional `gallery`, `materials`, `careInstructions`, and `fitGuide` fields.
- [ ] `GET /api/products/:id/related` returns bounded self-excluding related products with deterministic fallback behavior.
- [ ] `GET /api/products/:id/reviews` returns paginated approved review list and aggregate summary.
- [ ] `POST /api/products/:id/reviews` requires auth, verified purchase, valid content, and one review per user/product.
- [ ] Approved review creation updates product rating, review count, rating distribution, and fit summary.
- [ ] Review content is stored/rendered as plain text and rejects unsafe/oversized payloads.
- [ ] `REACT_APP_ENABLE_REVIEWS` defaults enabled and can be disabled with exact `false`.
- [ ] Focused backend/frontend tests, frontend build, docs, UI review, and verification artifacts are complete.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.92 | 0.75 | PASS | Product detail, reviews, fit, and related products are measurable deliverables. |
| Boundary Clarity | 0.91 | 0.70 | PASS | Uploads, votes, Q&A, moderation dashboards, personalization, and search are excluded. |
| Constraint Clarity | 0.86 | 0.65 | PASS | Verified purchase, plain text safety, bounded related products, and additive schema constraints are explicit. |
| Acceptance Criteria | 0.88 | 0.70 | PASS | API, UI, aggregation, docs, tests, build, and smoke checks are pass/fail. |
| **Ambiguity** | 0.11 | <=0.20 | PASS | Gate passed. |

## Interview Log

Auto-selected recommended answers per the project workflow instruction to auto-approve defensible recommendations after grey-area questions.

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | What exists today? | Basic products, orders, wishlist controls, and Quick View exist; product detail route and reviews do not. |
| 1 | Researcher | What source verifies purchases? | Existing orders are the verified-purchase source. |
| 2 | Simplifier | Minimum viable product detail? | Dedicated route, richer fields, fit guidance, reviews, related products, add-to-cart, wishlist. |
| 3 | Boundary Keeper | What review features are excluded? | No uploads, votes, Q&A, rich text, or moderation dashboard in Phase 15. |
| 4 | Failure Analyst | What makes reviews unsafe? | Unbounded content, HTML rendering, private user/order data leakage, duplicate/unverified reviews. |
| 5 | Seed Closer | How should the dormant reviews flag behave? | Reviews default enabled after Phase 15, with `REACT_APP_ENABLE_REVIEWS=false` as a kill switch. |

---

*Phase: 15-product-detail-reviews-and-fit-confidence*
*Spec created: 2026-06-20*
*Next step: $gsd-discuss-phase 15 - implementation decisions (how to build what is specified above)*
