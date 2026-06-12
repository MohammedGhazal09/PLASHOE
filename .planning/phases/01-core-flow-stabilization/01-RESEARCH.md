# Phase 1 Research: Core Flow Stabilization

**Date:** 2026-06-12
**Phase:** 01-core-flow-stabilization
**Research mode:** Local codebase and planning artifacts

## Research Complete

This phase does not need external product or library research. The failures are local source-contract mismatches already validated by spike 001, and the useful research is to trace each failure to the narrowest existing code surface.

## Sources Reviewed

- `.planning/phases/01-core-flow-stabilization/01-SPEC.md`
- `.planning/phases/01-core-flow-stabilization/01-CONTEXT.md`
- `.planning/spikes/001-core-flow-contract-check/results.json`
- `.planning/spikes/001-core-flow-contract-check/check-contracts.mjs`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONVENTIONS.md`
- `.planning/codebase/CONCERNS.md`
- `docs/API.md`
- `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx`
- `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js`
- `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`
- `Frontend/Ecommerce-main/my-app/src/api/cartApi.js`
- `Frontend/Ecommerce-main/my-app/src/App.js`
- `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx`
- `Backend/controllers/cartController.js`

## Skills Used

`find-skills` was used to identify and select three helper skills. The current marketplace search results for ecommerce/react/express/zustand were low-signal, so the recommendation is to use the already-installed, higher-signal skills instead of installing unrelated skills:

1. `express-rest-api` - guidance for keeping `cartController.removeCoupon` inside the existing Express controller/envelope style.
2. `zustand-state-management` - guidance for returning meaningful async action results while updating store state in `cartStore.applyCoupon`.
3. `react19-test-patterns` - advisory guidance for React-side verification discipline. The app is React 18/CRA, so this skill is useful only for test/build caution, not React 19 migration.

Recommendation: keep these skills advisory only, matching D-16. Do not add dependency or framework work to Phase 1 because the locked spec excludes it.

## Findings and Recommendations

### 1. Contact Submission

Finding: `Contact.jsx` imports `contactApi` from `ordersApi.js`, but calls `contactApi.send(formData)`. The wrapper exports `submit(name, email, subject, message)`. The catch path also shows a success toast and clears form data.

Recommendation: change only the page submit handler. Call `contactApi.submit(formData.name, formData.email, formData.subject, formData.message)`, keep success toast/reset inside `response.success`, and make the catch path show an error while preserving `formData`.

Plans: 01-01 owns the source edit; 01-03 smoke-checks banned patterns.

### 2. Authenticated Checkout Policy

Finding: `/checkout` is already under `ProtectedRoute`, but `Checkout.jsx` still contains an active guest/mock order branch that can clear the cart and show success without using the order API if the page is direct-rendered or the guard is bypassed.

Recommendation: keep `ProtectedRoute` as the primary boundary, remove the mock guest submission branch, and add a small defensive unauthenticated guard in `handleSubmit`.

Plans: 01-01 owns the source edit; 01-03 confirms the route guard remains in `App.js`.

### 3. Coupon Application Contract

Finding: `Checkout.jsx` expects `result.discount`, but `cartStore.applyCoupon` returns only `{ success, message }` after updating state. `selectTotal` already treats `discount` as a percentage, while the summary row displays `-$${discount.toFixed(2)}`, which presents the percentage as dollars.

Recommendation: update `applyCoupon` to validate and return `{ success, message, discount, couponCode }`, clear the coupon input only on success, and render the summary discount as the computed amount from `subtotal * discount / 100` with percentage context.

Plans: 01-01 owns the source edit; 01-02 may strengthen the checker around the summary row if the current gate would miss this explicit Phase 1 truth.

### 4. Missing-Cart Coupon Removal

Finding: `removeCoupon` calls `Cart.findOne(...)`, conditionally clears an existing cart, then unconditionally calls `cart.populate(...)`. When no cart exists, this is a null dereference.

Recommendation: return `{ success: true, message: 'Coupon removed', data: null }` immediately for a missing cart. Do not create a cart only to remove a coupon.

Plans: 01-01 owns the backend controller edit; 01-02 validates the checker result.

### 5. Checker and Evidence

Finding: The checker is useful because it runs without MongoDB, frontend dependencies, or a browser. It currently writes timestamped `results.json` and `contract-report.md` on each run, so careless reruns can create timestamp-only churn.

Recommendation: keep the checker as the Phase 1 gate. Update `check-contracts.mjs` only if the correct implementation makes existing source patterns stale or if an explicit Phase 1 acceptance detail needs a focused assertion. Commit generated outputs only when they show the semantic transition to zero `FAIL` findings.

Plans: 01-02 owns checker/evidence alignment; 01-03 repeats the checker gate.

### 6. Frontend Build Verification

Finding: Backend has no committed test script for this phase. Frontend has CRA scripts in `Frontend/Ecommerce-main/my-app/package.json`. Phase 1 context says the checker is mandatory and frontend build should run if dependencies are available.

Recommendation: require the checker for completion. Run `npm run build` in the frontend app when dependencies are present; if dependencies are missing and install cannot run cleanly, record the exact blocker instead of silently skipping.

Plans: 01-03 owns final smoke/build evidence.

## Plan Shape Recommendation

Use three plans matching the roadmap placeholders:

1. `01-01` - Source contract fixes across contact, checkout, cart store, and cart controller.
2. `01-02` - Contract checker and generated evidence alignment.
3. `01-03` - Final source smoke, checker, and frontend build verification.

This keeps implementation first, evidence second, and completion verification last. It also avoids making a single large plan that mixes code fixes, checker edits, and final readiness reporting.

## Open Risks

- The checker is pattern-based and can miss behavior that real tests would catch. Phase 2 should convert or supplement these contracts with automated tests.
- The frontend build may require dependency installation if `node_modules` is absent. That is an environment concern, not a reason to mark Phase 1 complete without a stated result.
- Payment and inventory warnings will remain by design; they should not be promoted into Phase 1 work.

## Final Recommendation

Proceed with the three-plan Phase 1 split above. Keep source edits minimal, preserve current auth and response-envelope conventions, update checker evidence only for semantic result changes, and make final verification command-based.
