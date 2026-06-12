---
spike: 001
name: core-flow-contract-check
type: standard
validates: "Given the current PLASHOE source, when a static contract checker scans the storefront purchase path, then it identifies route/API/UI mismatches without needing MongoDB or browser setup."
verdict: VALIDATED
related: []
tags: [reliability, checkout, api-contracts, testing]
---

# Spike 001: Core Flow Contract Check

## What This Validates

Given the current PLASHOE source, when a static contract checker scans the storefront purchase path, then it identifies route/API/UI mismatches without needing MongoDB, frontend dependencies, or a browser session.

## Research

No external research was needed. This is a pure source-code contract spike based on:

- `docs/API.md`
- `.planning/codebase/CONCERNS.md`
- `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx`
- `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`
- `Backend/controllers/cartController.js`
- `Backend/routes/*.js`

| Approach | Tool/Library | Pros | Cons | Status |
|---|---|---|---|---|
| Static source contract script | Node.js standard library | Runs without installing dependencies, no database required, catches naming and routing mismatches fast | Pattern-based, not a replacement for tests | Chosen |
| Backend integration tests | Vitest/Supertest | Higher confidence for API behavior | Requires test dependencies and app refactor | Recommended next |
| Browser E2E test | Playwright/Cypress | Validates actual customer flow | Heavier setup and depends on seeded data | Later |

Chosen approach: a Node.js standard-library script because the repo currently has no backend test runner and frontend dependencies may not be installed in a fresh checkout.

## How To Run

From the repository root:

```bash
node .planning/spikes/001-core-flow-contract-check/check-contracts.mjs
```

The script writes:

- `.planning/spikes/001-core-flow-contract-check/results.json`
- `.planning/spikes/001-core-flow-contract-check/contract-report.md`

## What To Expect

The script prints a JSON count summary to stdout and writes detailed results. A successful spike run does not mean the application has no defects; it means the checker ran and produced actionable findings.

Expected current result:

```json
{"FAIL":5,"PASS":1,"WARN":2}
```

## Investigation Trail

1. Started from the codebase map concerns, especially contact submission, coupon handling, unreachable guest checkout, and missing test coverage.
2. Chose static source checks because they can run without installing packages or connecting MongoDB.
3. Checked frontend wrapper/page contracts, backend route auth boundaries, cart controller null handling, payment readiness, and inventory enforcement.
4. Confirmed the script detects five concrete failures and two production-readiness warnings in the current checkout.

## Results

Verdict: VALIDATED.

The approach is useful as a cheap pre-test safety net. It caught:

- Contact form calls `contactApi.send`, but the wrapper exports `submit`.
- Contact form reports success in its catch path.
- `/checkout` is protected while `Checkout.jsx` still contains a guest checkout branch.
- Checkout expects `result.discount`, but `cartStore.applyCoupon` does not return that field.
- `removeCoupon` can dereference a missing cart.
- Payment is explicitly demo-only.
- Stock exists in the product model but is not enforced through cart/order workflows.

Signal for the build: turn these checks into either real tests or code fixes before adding larger ecommerce features.
