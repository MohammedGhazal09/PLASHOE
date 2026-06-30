# Phase 28 Context

## Existing Flow

- `Backend/services/checkoutService.js` owns cart checkout, idempotency, inventory, coupon usage, order creation, and final order total.
- `Backend/services/paymentService.js` starts Stripe Checkout from the persisted `order.total`.
- `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx` previously hardcoded shipping as free.

## Implementation Notes

- Shipping rules now live in `Backend/config/shippingRules.js`.
- `POST /api/orders/shipping-options` returns server rates for the current authenticated cart and selected country.
- `POST /api/orders` accepts `shippingMethodId`, not price or total.
- Orders persist `shippingMethod`, `shippingMethodName`, `shippingPrice`, and `shippingCountryCode`.

## Constraints

- Work executed inline with no subagents.
- Real Stripe provider calls were not used in browser QA; the browser submit was intercepted for bounded local evidence.
