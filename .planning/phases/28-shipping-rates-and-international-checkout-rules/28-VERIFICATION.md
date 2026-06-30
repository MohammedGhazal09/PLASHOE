# Phase 28 Verification

## Automated Checks

- `Backend`: `npm test -- order.test.js`
- `Backend`: `npm test -- order.test.js payment-state.test.js payment-webhook.test.js`
- `Frontend`: `npm test -- Checkout.test.jsx ordersApi.test.js`
- `Frontend`: `npm run build`

## Browser QA

- Hercules visual QA via fallback Playwright: passed.
- Artifact: `C:\Users\saieh\.agents\artifacts\hercules-visual-qa\20260630-064426-phase28-shipping-checkout-localhost-5174-checkout`

## Coverage

- Supported country quote: covered.
- Unsupported country: covered.
- Invalid shipping method: covered.
- Shipping-inclusive order total: covered.
- Stripe amount source from `order.total`: covered.
- Checkout UI rate loading, method selection, unsupported country, server-error, required-field validation, responsive layout, and intercepted handoff request shape: covered.

## Notes

Real Stripe hosted payment was not contacted during visual QA. The submit request was intercepted to avoid local test side effects.
