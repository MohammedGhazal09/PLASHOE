# Core Flow Contract Check Report

Generated: 2026-06-28T17:52:08.061Z

Verdict: VALIDATED

| Status | Check | Evidence | Recommendation |
| --- | --- | --- | --- |
| PASS | Contact page calls a method exported by the contact API wrapper | Contact page call matches the wrapper export. | Use contactApi.submit(name, email, subject, message), or add a send(formData) wrapper that calls POST /api/contact. |
| PASS | Contact submission reports failures honestly | Contact catch path does not show success. | Show an error toast in the catch path and preserve form contents unless the POST succeeds. |
| PASS | Checkout routing matches checkout business rules | Checkout route protection and checkout branches are aligned. | Either remove the guest checkout branch or make /checkout public and implement a deliberate guest order flow. |
| PASS | Coupon application return shape matches checkout UI expectations | Coupon result shape matches checkout usage. | Return discount from cartStore.applyCoupon or read the updated discount value from store state in Checkout. |
| PASS | Checkout order summary treats coupon discount as a percentage | Checkout computes a discount amount from subtotal and percentage. | Render the order-summary discount as subtotal * discount / 100 and label the percentage separately. |
| PASS | Removing a coupon handles a missing cart | removeCoupon returns a successful empty-cart response before populate when no cart exists. | Return a successful empty-cart response when no cart exists, or create/load a cart before populating. |
| PASS | Core route auth boundaries match the intended storefront flow | Cart and order routers apply router.use(protect); contact POST remains public in Backend/routes/contactRoutes.js. | Keep cart and order routes protected, and keep public contact submission separate from admin contact routes. |
| PASS | Checkout has a production payment state | Payment artifacts detected: checkout redirect=true, payment state=true, provider checkout=true, webhook=true, event idempotency=true. | Keep hosted checkout redirect, independent payment state, raw-body webhook verification, and provider-event idempotency in sync. |
| PASS | Stock is enforced during cart and order workflows | Stock model and workflow enforcement appear aligned. | Validate stock in cart add/update and atomically decrement or reserve stock during order creation. |

