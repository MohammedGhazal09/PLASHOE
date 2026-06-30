# Phase 28 Spec: Shipping Rates and International Checkout Rules

## Objective

Checkout totals and order records must use server-owned shipping methods, shipping rates, and country availability rules.

## Scope

- Add backend shipping country/method rules for checkout.
- Expose protected shipping options for the authenticated checkout cart.
- Persist selected method, shipping price, normalized country, and final total on orders.
- Charge Stripe from the shipping-inclusive backend order total.
- Update checkout UI to show eligible methods and block unsupported countries before payment handoff.

## Acceptance Criteria

- Backend computes shipping availability, shipping price, and final total from server-owned rules.
- Checkout UI displays eligible shipping methods and unavailable-country errors.
- Order creation accepts `shippingMethodId` only; it rejects client-supplied shipping prices and totals.
- Tests cover supported/unsupported countries, method selection, Stripe amount source, and order persistence.

## Recommendation

Keep rates in backend config until business rules require an admin-managed rate table. Do not expose client-submitted shipping prices.
