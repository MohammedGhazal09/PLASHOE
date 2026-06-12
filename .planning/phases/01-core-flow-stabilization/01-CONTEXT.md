# Phase 1: Core Flow Stabilization - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 stabilizes the current authenticated storefront contact, checkout, coupon, and cart contracts so the validated spike 001 failures move from five `FAIL` findings to zero `FAIL` findings. This phase changes only the existing core-flow behavior described in `01-SPEC.md`; new checkout capabilities, broad testing infrastructure, and architecture cleanup remain outside this phase.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**6 requirements are locked.** See `01-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `01-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Fix the contact page to call the existing contact API wrapper.
- Fix contact submission success/error behavior so failures are honest and preserve user input.
- Keep checkout authenticated-only and remove or disable the active guest/mock order submission path.
- Align coupon application return data between checkout UI and cart store.
- Make backend coupon removal idempotent when the authenticated user has no cart.
- Update the focused contract checker only if needed to keep the Phase 1 acceptance gate accurate.

**Out of scope (from SPEC.md):**
- Public guest checkout - deliberately excluded because the current backend order/cart APIs are authenticated and a real guest flow needs separate requirements.
- Real payment provider integration - deferred to Phase 5 because Phase 1 only stabilizes existing contracts.
- Inventory enforcement and stock decrementing - deferred to Phase 4 because it changes checkout data integrity, not the current contract mismatches.
- Broad automated test foundation - deferred to Phase 2; Phase 1 keeps the spike checker as the focused gate.
- API module splitting for contact/coupon wrappers - deferred to Phase 7 to avoid architecture churn while fixing the immediate wrapper mismatch.
- Route, auth, database schema, or dependency upgrades - excluded to preserve the current application contract and keep the phase narrow.
- Visual redesign or checkout UX expansion - excluded because this phase is about behavioral correctness, not presentation changes.

</spec_lock>

<decisions>
## Implementation Decisions

### Contact Submission
- **D-01:** `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx` should call `contactApi.submit(formData.name, formData.email, formData.subject, formData.message)` inline rather than adding a new wrapper alias or helper.
- **D-02:** Contact submission failures should show the backend message when available, with a generic fallback.
- **D-03:** Contact form fields should clear only after `response.success`; failed or thrown submissions must preserve the user's entered data.

### Authenticated Checkout
- **D-04:** `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx` should remove the mock guest-order success path while leaving guest cart behavior elsewhere untouched.
- **D-05:** Checkout should keep `ProtectedRoute` as the primary auth boundary and also include a small defensive unauthenticated guard in the page logic for hydration or direct-render edge cases.

### Coupon Application
- **D-06:** `useCartStore().applyCoupon` should return `{ success, message, discount, couponCode }` on success while still updating `couponCode` and `discount` in Zustand state from the backend cart response.
- **D-07:** If the backend response claims success but does not include a numeric discount, the store should treat the operation as a failure with a clear fallback message.
- **D-08:** Phase 1 should fix both the coupon success toast and the order-summary discount row so the UI consistently treats `discount` as a percentage, not a dollar amount.
- **D-09:** The checkout coupon input should clear on successful application only; failed coupon attempts should leave the code editable.

### Coupon Removal
- **D-10:** `Backend/controllers/cartController.js` should make `DELETE /api/cart/coupon` idempotent when no cart exists by returning success with `data: null`, without creating a cart solely for coupon removal.
- **D-11:** `useCartStore().removeCoupon` can keep ignoring the backend response and simply clear local `couponCode` and `discount` state after the API call attempt.

### Verification
- **D-12:** The static checker at `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs` should be changed only if its current source patterns become stale after the correct implementation changes.
- **D-13:** Updated `.planning/spikes/001-core-flow-contract-check/results.json` and `contract-report.md` should be committed only when the result semantically changes from failing to passing, not for timestamp-only reruns.
- **D-14:** Completion verification should require the spike checker and, if frontend dependencies are available, the frontend CRA build. If the build cannot run, the blocker or missing dependency should be reported explicitly.
- **D-15:** Payment and inventory findings may remain visible as `WARN`; they are non-blocking for Phase 1.

### Supporting Skill Guidance
- **D-16:** Use installed skills only as supporting guidance, not as mandatory gates: `react19-test-patterns`, `express-rest-api`, and `zustand-state-management`.

### the agent's Discretion
- The planner and executor may choose exact code mechanics within the locked decisions above, but must not reopen the Phase 1 scope or convert deferred work into Phase 1 tasks.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Phase Scope
- `.planning/phases/01-core-flow-stabilization/01-SPEC.md` - Locked requirements, boundaries, constraints, and acceptance criteria.
- `.planning/ROADMAP.md` - Phase ordering and Phase 1 canonical refs/success criteria.
- `.planning/REQUIREMENTS.md` - `CORE-01` through `CORE-05` traceability.
- `.planning/STATE.md` - Current phase focus and known project risks.

### Spike Evidence and Gate
- `.planning/spikes/001-core-flow-contract-check/results.json` - Current validated failure, pass, and warning evidence.
- `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs` - Runnable static checker and acceptance gate.
- `.planning/spikes/001-core-flow-contract-check/README.md` - Checker purpose, run command, and expected baseline output.

### Codebase Maps and API Contract
- `.planning/codebase/CONCERNS.md` - Known bugs and fragile areas driving Phase 1.
- `.planning/codebase/ARCHITECTURE.md` - Existing frontend/API/store/backend layering and route guard patterns.
- `.planning/codebase/STACK.md` - Runtime, framework, package, and verification context.
- `.planning/codebase/CONVENTIONS.md` - Local formatting, error handling, API module, store action, and controller conventions.
- `docs/API.md` - Public API route, auth, wrapper, request, and response-envelope reference.

### Source Files Expected to Change or Be Checked
- `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx` - Contact API call and toast/form clearing behavior.
- `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx` - Authenticated checkout path, coupon feedback, and summary display.
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` - Coupon result contract and local coupon clearing behavior.
- `Backend/controllers/cartController.js` - Missing-cart coupon removal response.
- `Frontend/Ecommerce-main/my-app/src/App.js` - Confirms `/checkout` remains protected.
- `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx` - Existing route-auth behavior.
- `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js` - Existing `contactApi.submit` contract.
- `Frontend/Ecommerce-main/my-app/src/api/cartApi.js` - Existing cart coupon API wrapper calls.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `contactApi.submit` in `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js`: already posts to `/contact` with the exact four fields Phase 1 needs.
- `cartApi.applyCoupon` and `cartApi.removeCoupon` in `Frontend/Ecommerce-main/my-app/src/api/cartApi.js`: already wrap authenticated cart coupon endpoints.
- `ProtectedRoute` in `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx`: already redirects unauthenticated users to `/account` with return location state.
- `useCartStore` selectors `selectSubtotal` and `selectTotal`: already calculate total by treating `discount` as a percentage.
- Existing `react-hot-toast` usage: contact and checkout already surface user-facing success/error outcomes through toast notifications.

### Established Patterns
- Frontend pages call resource API wrappers and stores instead of raw Axios.
- Zustand store actions return small `{ success, message }` style results for page handlers.
- Backend controllers return `{ success, message, data }` response envelopes from local `try/catch` blocks.
- Backend cart/order routes are authenticated with `router.use(protect)`.
- Source formatting uses 2-space indentation, semicolons, and mostly single quotes.

### Integration Points
- Contact submission connects `Contact.jsx` to `contactApi.submit`.
- Coupon application connects `Checkout.jsx` to `cartStore.applyCoupon`, which calls `cartApi.applyCoupon`.
- Coupon removal connects `cartStore.removeCoupon` to `cartApi.removeCoupon` and `Backend/controllers/cartController.js`.
- Verification connects all Phase 1 changed files to `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs`.

</code_context>

<specifics>
## Specific Ideas

- User approved all recommendations from the one-shot implementation questionnaire on 2026-06-12.
- Keep implementation small and local. Do not split API modules, add dependencies, or build a new test framework in Phase 1.
- The generated checker outputs may be committed after fixes only when they show the meaningful transition to zero `FAIL` findings.

</specifics>

<deferred>
## Deferred Ideas

- Public guest checkout remains deferred outside Phase 1.
- Payment provider integration remains deferred to Phase 5.
- Inventory enforcement remains deferred to Phase 4.
- Broad automated test foundation remains deferred to Phase 2.
- API module splitting for contact/coupon wrappers remains deferred to Phase 7.

</deferred>

---

*Phase: 01-core-flow-stabilization*
*Context gathered: 2026-06-12*
