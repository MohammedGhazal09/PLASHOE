# Phase 1: Core Flow Stabilization - Specification

**Created:** 2026-06-12
**Ambiguity score:** 0.09 (gate: <= 0.20)
**Requirements:** 6 locked

## Goal

The existing storefront contact, checkout, coupon, and cart flows change from the five known spike 001 contract failures to zero `FAIL` findings while keeping Phase 1 limited to the current authenticated purchase path.

## Background

Spike 001 validated five concrete core-flow failures. `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx` calls `contactApi.send(formData)`, but the wrapper in `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js` exports `contactApi.submit(name, email, subject, message)`. The same contact page currently reports success and clears the form even from the catch path.

Checkout is protected in routing, but `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx` still contains an unreachable guest checkout branch that clears the local cart and reports a mock order success. Coupon application also has a frontend contract mismatch: `Checkout.jsx` reads `result.discount`, while `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` updates discount state but returns only `success` and `message`.

On the backend, `Backend/controllers/cartController.js` can dereference a missing cart in `removeCoupon` by calling `cart.populate(...)` after `Cart.findOne(...)` returns null. Payment integration and inventory enforcement are known warnings from the spike, but they are intentionally deferred to later phases.

## Requirements

1. **Contact API wrapper call**: The contact page must call an API wrapper method that actually exists.
   - Current: `Contact.jsx` calls `contactApi.send(formData)`, but `ordersApi.js` exports `contactApi.submit(name, email, subject, message)`.
   - Target: Contact submission calls the existing `contactApi.submit(...)` contract using the form's name, email, subject, and message values.
   - Acceptance: A source check confirms `Contact.jsx` no longer calls `contactApi.send`, and the contact form submission path calls `contactApi.submit` with the expected four contact fields.

2. **Contact submission honesty**: The contact page must only report success after the backend accepts the message.
   - Current: The contact submission catch path shows a success toast and clears the form even when the API call fails.
   - Target: Success toast and form clearing occur only after a successful backend response; failed or thrown submissions show an error and preserve the user's entered form data.
   - Acceptance: A verifier can force the contact API call to reject and observe an error message with the form contents preserved; no catch-path success toast remains.

3. **Authenticated checkout policy**: Checkout must behave as an authenticated-only flow.
   - Current: `/checkout` is protected by routing, but `Checkout.jsx` still contains a guest/mock order branch that is unreachable through normal navigation.
   - Target: `/checkout` remains protected, and checkout submission assumes an authenticated user instead of maintaining a mock guest order path.
   - Acceptance: The checkout route remains under `ProtectedRoute`, and `Checkout.jsx` no longer contains an active guest order success branch that clears cart state without calling the order API.

4. **Coupon application result contract**: Coupon application must return the discount information the checkout UI needs.
   - Current: `Checkout.jsx` displays `result.discount`, but `cartStore.applyCoupon` does not return `discount`.
   - Target: `cartStore.applyCoupon` returns a success result that includes `discount` and `couponCode` while still updating store state from the backend response.
   - Acceptance: Applying a valid coupon produces a success result with a numeric discount and displays accurate percent-off feedback instead of `undefined% off`.

5. **Missing-cart coupon removal**: Removing a coupon must be safe when no cart document exists.
   - Current: `removeCoupon` can call `cart.populate(...)` when `cart` is null and throw for an authenticated user with no cart.
   - Target: `DELETE /api/cart/coupon` is idempotent for a missing cart and returns a successful response without creating a cart solely for coupon removal.
   - Acceptance: Calling `DELETE /api/cart/coupon` as an authenticated user with no cart returns a successful response such as `{ "success": true, "message": "Coupon removed", "data": null }` and does not throw.

6. **Contract checker gate**: The focused spike checker must verify that Phase 1 failures are resolved.
   - Current: `.planning/spikes/001-core-flow-contract-check/results.json` records five `FAIL` findings for the core flow contracts.
   - Target: The checker remains runnable and reports zero `FAIL` findings for the Phase 1 contract defects. Existing payment and inventory `WARN` findings may remain.
   - Acceptance: `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` completes and reports no `FAIL` findings.

## Boundaries

**In scope:**
- Fix the contact page to call the existing contact API wrapper.
- Fix contact submission success/error behavior so failures are honest and preserve user input.
- Keep checkout authenticated-only and remove or disable the active guest/mock order submission path.
- Align coupon application return data between checkout UI and cart store.
- Make backend coupon removal idempotent when the authenticated user has no cart.
- Update the focused contract checker only if needed to keep the Phase 1 acceptance gate accurate.

**Out of scope:**
- Public guest checkout - deliberately excluded because the current backend order/cart APIs are authenticated and a real guest flow needs separate requirements.
- Real payment provider integration - deferred to Phase 5 because Phase 1 only stabilizes existing contracts.
- Inventory enforcement and stock decrementing - deferred to Phase 4 because it changes checkout data integrity, not the current contract mismatches.
- Broad automated test foundation - deferred to Phase 2; Phase 1 keeps the spike checker as the focused gate.
- API module splitting for contact/coupon wrappers - deferred to Phase 7 to avoid architecture churn while fixing the immediate wrapper mismatch.
- Route, auth, database schema, or dependency upgrades - excluded to preserve the current application contract and keep the phase narrow.
- Visual redesign or checkout UX expansion - excluded because this phase is about behavioral correctness, not presentation changes.

## Constraints

- Preserve existing backend route paths and auth boundaries: cart and order routes stay bearer-token protected, and public contact submission remains separate from admin contact routes.
- Preserve the current response-envelope style (`success`, `message`, and `data`) unless the specific missing-cart coupon response needs `data: null`.
- Do not add database migrations, new collections, or new runtime dependencies for Phase 1.
- Keep frontend visual style and existing toast mechanism; only correct misleading success/error behavior.
- Treat payment-production-readiness and inventory-enforcement warnings as allowed known warnings after this phase.
- Leave unrelated local work, including `Backend/.env.example`, untouched.

## Acceptance Criteria

- [ ] Contact submission no longer references `contactApi.send` and calls `contactApi.submit` with name, email, subject, and message.
- [ ] Contact submission shows success and clears form data only on backend success; failed submissions show an error and preserve entered data.
- [ ] `/checkout` remains authenticated-only and the checkout page no longer contains an active mock guest-order submission path.
- [ ] Applying a valid coupon returns a success result with a numeric discount and checkout displays accurate percent-off feedback.
- [ ] `DELETE /api/cart/coupon` succeeds without throwing when the authenticated user has no cart.
- [ ] `node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs` reports zero `FAIL` findings.
- [ ] Payment and inventory findings, if still present, remain `WARN` and are not treated as Phase 1 blockers.

## Ambiguity Report

| Dimension           | Score | Min   | Status | Notes |
|---------------------|-------|-------|--------|-------|
| Goal Clarity        | 0.94  | 0.75  | met    | Goal is tied to five spike failures and zero checker `FAIL` findings. |
| Boundary Clarity    | 0.93  | 0.70  | met    | Guest checkout, payments, inventory, broad tests, and refactors are explicitly excluded. |
| Constraint Clarity  | 0.84  | 0.65  | met    | Existing auth, routes, response envelopes, dependencies, and UI style are preserved. |
| Acceptance Criteria | 0.90  | 0.70  | met    | Seven pass/fail criteria define the verification gate. |
| **Ambiguity**       | 0.09  | <=0.20| met    | Gate passed after user approved all recommendations. |

Status: `met` = dimension satisfies the minimum.

## Interview Log

| Round | Perspective      | Question summary | Decision locked |
|-------|------------------|------------------|-----------------|
| 1     | Researcher       | Should Phase 1 fix only spike 001 failures or broaden the whole checkout/contact experience? | Limit Phase 1 to the five spike failures plus focused smoke/contract verification. |
| 1     | Researcher       | Which contact API contract should be used? | Use the existing `contactApi.submit(name, email, subject, message)` wrapper. |
| 2     | Simplifier       | What is the minimum viable checkout policy for this phase? | Keep checkout authenticated-only and remove the active guest/mock submission path. |
| 2     | Simplifier       | Should formal automated tests be required now? | Keep broad automated test work for Phase 2 and use the spike checker as the Phase 1 gate. |
| 3     | Boundary Keeper  | Which adjacent problems are excluded? | Exclude public guest checkout, payments, inventory enforcement, API module splitting, route/auth/schema changes, dependency work, and visual redesign. |
| 4     | Failure Analyst  | What outcomes should cause rejection? | False contact success, `undefined% off`, missing-cart remove-coupon throw, active mock guest order path, or any checker `FAIL`. |
| 5     | Seed Closer      | How should coupon and missing-cart contracts resolve? | Return coupon discount/couponCode from the store result; make missing-cart coupon removal an idempotent success with `data: null`. |

---

*Phase: 01-core-flow-stabilization*
*Spec created: 2026-06-12*
*Next step: $gsd-discuss-phase 1 - implementation decisions (how to build what is specified above)*
