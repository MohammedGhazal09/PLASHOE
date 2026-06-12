# Project: PLASHOE

**Initialized:** 2026-06-12
**Type:** Split ecommerce application with Express/Mongoose backend and Create React App frontend.

## Core Value

PLASHOE should become a production-ready ecommerce storefront where customers can browse shoes, manage a cart, complete checkout, and track orders while operators can securely manage fulfillment.

## Current Reality

The codebase already has a working ecommerce skeleton:

- Backend API in `Backend` with auth, products, cart, orders, coupons, contact, and health routes.
- Frontend app in `Frontend/Ecommerce-main/my-app` with storefront pages, cart, account, checkout, contact, and order detail screens.
- Project documentation under `docs/`.
- Codebase map under `.planning/codebase/`.
- Spike findings under `.planning/spikes/001-core-flow-contract-check/`.

The project lacks production readiness around tests, security, checkout integrity, payment processing, admin fulfillment, CI/CD, and observability.

## Planning Sources

- `.planning/codebase/CONCERNS.md`
- `.planning/codebase/TESTING.md`
- `docs/API.md`
- `docs/TESTING.md`
- `.planning/spikes/001-core-flow-contract-check/results.json`

## Recommendation

Do the work in dependency order: stabilize the current purchase flow first, add tests around it, then harden security and checkout integrity before payment/admin/deployment expansion.
