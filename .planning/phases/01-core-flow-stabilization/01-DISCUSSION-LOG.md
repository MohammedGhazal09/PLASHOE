# Phase 1: Core Flow Stabilization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 01-core-flow-stabilization
**Areas discussed:** Contact submission implementation, authenticated checkout implementation, coupon/store contract implementation, missing-cart coupon removal implementation, verification and checker treatment, supporting skill usage

---

## Contact Submission Implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Inline `contactApi.submit(...)` | Call the existing wrapper directly from `Contact.jsx` with the four form fields. | yes |
| Local helper inside `Contact.jsx` | Add a small helper and call that from submit handling. | |
| Add wrapper alias | Add `contactApi.send(formData)` to the wrapper. | |

**User's choice:** Approved recommendation.
**Notes:** Use the existing `contactApi.submit(name, email, subject, message)` contract. Contact failures should show backend message with generic fallback. Form data should clear only on `response.success`.

---

## Authenticated Checkout Implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Trust `ProtectedRoute` only | Remove the guest branch and rely only on routing. | |
| Add defensive redirect/error | Keep `ProtectedRoute` and add a small page-level guard for auth edge states. | yes |
| Keep auth branching | Keep the current `isAuthenticated` branch structure. | |

**User's choice:** Approved recommendation.
**Notes:** Remove only the checkout mock guest-order success branch. Do not remove broader guest cart behavior in this phase.

---

## Coupon Store Contract Implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Return `{ success, message, discount, couponCode }` | Store updates state and returns the data checkout needs. | yes |
| Return entire backend cart only | Checkout consumes the backend cart shape. | |
| Return no data | Checkout reads updated Zustand state after applying. | |

**User's choice:** Approved recommendation.
**Notes:** Treat malformed successful coupon responses with missing numeric discount as failures. Fix both coupon toast and summary display so `discount` is handled consistently as a percentage. Clear coupon input on success only.

---

## Missing-Cart Coupon Removal Implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Idempotent success with `data: null` | Return success when no cart exists without creating a cart. | yes |
| Create empty cart | Create a cart on coupon-removal request. | |
| Return `404` | Treat no cart as not found. | |

**User's choice:** Approved recommendation.
**Notes:** Frontend `removeCoupon` can keep ignoring the API response and clear local coupon state.

---

## Verification and Checker Treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Update checker only if stale | Keep checker unless correct code makes its patterns obsolete. | yes |
| Always rewrite checker | Rewrite the checker around the new code. | |
| Convert to tests now | Replace the checker with formal tests in this phase. | |

**User's choice:** Approved recommendation.
**Notes:** Commit generated checker outputs only when they semantically change from failing to passing. Completion should run the checker and frontend build if dependencies are available. Payment and inventory findings may remain as non-blocking `WARN` findings.

---

## Supporting Skill Usage

| Option | Description | Selected |
|--------|-------------|----------|
| Supporting guidance only | Use installed skills to inform implementation and planning. | yes |
| Ignore skills | Do not reference the installed skills. | |
| Required gates | Make skills mandatory checks or gates. | |

**User's choice:** Approved recommendation.
**Notes:** Installed skills are `react19-test-patterns`, `express-rest-api`, and `zustand-state-management`. They are advisory only.

## the agent's Discretion

- The planner and executor may choose exact code mechanics within the approved decisions.
- The planner and executor must not reopen the locked requirements or bring deferred work into Phase 1.

## Deferred Ideas

- Public guest checkout remains deferred outside Phase 1.
- Payment provider integration remains deferred to Phase 5.
- Inventory enforcement remains deferred to Phase 4.
- Broad automated test foundation remains deferred to Phase 2.
- API module splitting for contact/coupon wrappers remains deferred to Phase 7.
