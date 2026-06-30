# Phase 28 Discussion Log

## Decisions

- Use a backend config for country rules and method prices instead of duplicating rates in the frontend.
- Keep the existing `standard` and `express` method ids so fulfillment code remains compatible.
- Add a protected shipping-options endpoint because the frontend must show eligible methods before payment.
- Normalize supported country aliases to canonical country names before order persistence.
- Intercept browser payment handoff during QA to avoid real provider side effects.

## Recommendations

- Add admin-managed shipping rates only after rate ownership, audit requirements, and fulfillment regions are specified.
- Keep unsupported countries explicit in tests so new markets require deliberate backend changes.
- If rates become weight- or carrier-dependent, extend the backend quote response without allowing client-submitted prices.

## Risks

- Local browser QA proves UI flow and request shape, not live Stripe provider delivery.
- The checkout page still depends on authenticated cart sync before rates can be quoted.
