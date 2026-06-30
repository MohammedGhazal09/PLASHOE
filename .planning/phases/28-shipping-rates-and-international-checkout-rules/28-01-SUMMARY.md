# Plan 28-01 Summary

Added `Backend/config/shippingRules.js`, shipping quote resolution in `checkoutService`, order shipping fields, `shippingMethodId` validation, and `POST /api/orders/shipping-options`.

Backend checkout now computes the final total as discounted merchandise total plus selected server shipping price.
