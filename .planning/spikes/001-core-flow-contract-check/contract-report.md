# Core Flow Contract Check Report

Generated: 2026-06-12T10:36:48.611Z

Verdict: VALIDATED

| Status | Check | Evidence | Recommendation |
| --- | --- | --- | --- |
| FAIL | Contact page calls a method exported by the contact API wrapper | Contact page calls contactApi.send at Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx:60; wrapper exports submit at Frontend/Ecommerce-main/my-app/src/api/ordersApi.js:26. | Use contactApi.submit(name, email, subject, message), or add a send(formData) wrapper that calls POST /api/contact. |
| FAIL | Contact submission reports failures honestly | Catch block shows toast.success in Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx:68. | Show an error toast in the catch path and preserve form contents unless the POST succeeds. |
| FAIL | Checkout routing matches checkout business rules | Route is protected in Frontend/Ecommerce-main/my-app/src/App.js:74, but guest checkout branch exists in Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx:125. | Either remove the guest checkout branch or make /checkout public and implement a deliberate guest order flow. |
| FAIL | Coupon application return shape matches checkout UI expectations | Checkout reads result.discount at Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx:68, but cartStore applyCoupon returns success/message without discount at Frontend/Ecommerce-main/my-app/src/store/cartStore.js:71. | Return discount from cartStore.applyCoupon or read the updated discount value from store state in Checkout. |
| FAIL | Removing a coupon handles a missing cart | removeCoupon starts at Backend/controllers/cartController.js:256 and can call cart.populate at Backend/controllers/cartController.js:266 after a missing cart. | Return a successful empty-cart response when no cart exists, or create/load a cart before populating. |
| WARN | Checkout has a production payment state | Checkout announces demo payment behavior in Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx:281; orders are created without a payment provider. | Add a payment provider contract before production: payment intent creation, confirmation, failure handling, order payment status, and refund path. |
| WARN | Stock is enforced during cart and order workflows | Product stock exists in Backend/models/Product.js:36, but cart/order controllers do not consistently validate or decrement it. | Validate stock in cart add/update and atomically decrement or reserve stock during order creation. |
| PASS | Core route auth boundaries match the intended storefront flow | Cart and order routers apply router.use(protect); contact POST remains public in Backend/routes/contactRoutes.js. | Keep cart and order routes protected, and keep public contact submission separate from admin contact routes. |

