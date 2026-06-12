# Codebase Concerns

**Analysis Date:** 2026-06-08

## Tech Debt

**Direct request-body persistence in admin and profile flows:**
- Issue: Several endpoints pass user-controlled objects directly into Mongoose create/update operations instead of mapping an allowlisted DTO.
- Files: `Backend/controllers/productController.js`, `Backend/controllers/couponController.js`, `Backend/controllers/authController.js`
- Impact: Admin writes can persist unexpected fields, and user address/profile updates can grow inconsistent shapes over time. This also makes validation behavior depend on schema defaults rather than explicit API contracts.
- Fix approach: Add request validators and explicit field mapping before `Product.create`, `Product.findByIdAndUpdate`, `Coupon.create`, `user.addresses.push`, and profile mutation. Keep accepted fields near the controller or move them into a shared validation layer.

**Large mixed-responsibility frontend pages:**
- Issue: Page components combine API calls, state orchestration, form validation, presentation, filtering, and domain mapping in one file.
- Files: `Frontend/Ecommerce-main/my-app/src/pages/Account.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Home.jsx`, `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`
- Impact: Changes to orders, checkout, auth, and cart behavior require editing large components with many implicit dependencies. This increases regression risk and makes targeted tests difficult.
- Fix approach: Extract reusable form hooks, order/cart view models, and presentation components. Keep API interactions in `Frontend/Ecommerce-main/my-app/src/api/` and store orchestration in `Frontend/Ecommerce-main/my-app/src/store/`.

**Duplicate product-loading strategies:**
- Issue: Product pages mix backend API loading with static JSON fallback logic.
- Files: `Frontend/Ecommerce-main/my-app/src/pages/Home.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Men.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Women.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Sale.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Collection.jsx`, `Frontend/Ecommerce-main/my-app/public/database/database.json`
- Impact: Product shape differences force defensive UI code such as `price.current` versus `price.new`, and behavior can differ depending on whether the backend is reachable.
- Fix approach: Centralize product normalization in one service or hook, and return a single internal product shape to `Frontend/Ecommerce-main/my-app/src/components/ProductGrid.jsx` and `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx`.

**Demo checkout path conflicts with protected routing:**
- Issue: `Checkout.jsx` includes a guest checkout branch, but `App.js` wraps `/checkout` in `ProtectedRoute`.
- Files: `Frontend/Ecommerce-main/my-app/src/App.js`, `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`
- Impact: The guest checkout behavior is unreachable through normal routing, so the UI and business rules communicate different capabilities.
- Fix approach: Either remove the guest checkout branch from `Checkout.jsx` or make `/checkout` public and enforce the intended guest-order workflow consistently.

## Known Bugs

**Contact form calls a non-existent API method and still reports success:**
- Symptoms: Submitting the contact form calls `contactApi.send(formData)`, but `contactApi` exposes `submit(name, email, subject, message)`. The catch block then shows a success toast and clears the form even when the network call fails.
- Files: `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx`, `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js`, `Backend/controllers/contactController.js`
- Trigger: Open `/contact`, submit a valid message, and the frontend attempts `contactApi.send`.
- Workaround: None in the UI; backend `POST /api/contact` works if called with the expected payload.
- Fix approach: Change `Contact.jsx` to call `contactApi.submit(formData.name, formData.email, formData.subject, formData.message)` or change `contactApi` to expose `send(formData)`. Do not show success in the catch path.

**Removing a coupon can throw when no cart exists:**
- Symptoms: `removeCoupon` checks `if (cart)` before clearing fields, but then calls `await cart.populate(...)` outside the guard.
- Files: `Backend/controllers/cartController.js`, `Backend/routes/cartRoutes.js`, `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`
- Trigger: Authenticated user sends `DELETE /api/cart/coupon` before a cart document exists.
- Workaround: Call `GET /api/cart` first to create the cart, then remove the coupon.
- Fix approach: Return a successful empty-cart response when `cart` is missing, or create a cart before populating.

**Checkout coupon success message uses the wrong result field:**
- Symptoms: `handleApplyCoupon` displays `result.discount`, but `cartStore.applyCoupon` returns `{ success: true, message: response.message }` without a `discount` property.
- Files: `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`, `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`
- Trigger: Apply a valid coupon on the checkout page.
- Workaround: The store discount state still updates for authenticated users.
- Fix approach: Return `discount` from `cartStore.applyCoupon` or have `Checkout.jsx` read the updated store value.

**Order numbers are not collision-safe under concurrent creates:**
- Symptoms: The order pre-save hook builds `PLS-${Date.now()}-${count + 1}` from `countDocuments()`.
- Files: `Backend/models/Order.js`, `Backend/controllers/orderController.js`
- Trigger: Two orders created in the same millisecond or while the collection count is stale can receive colliding or non-sequential numbers.
- Workaround: MongoDB unique index rejects duplicates if the index is built, but the user receives a failed checkout.
- Fix approach: Use a monotonic counter collection, UUID/ULID suffix, or rely on MongoDB ObjectId plus a display sequence generated atomically.

## Security Considerations

**Authentication endpoints have no brute-force throttling:**
- Risk: Login and registration can be brute-forced or abused for account enumeration and resource exhaustion.
- Files: `Backend/routes/authRoutes.js`, `Backend/controllers/authController.js`, `Backend/server.js`
- Current mitigation: Passwords are hashed with `bcryptjs` in `Backend/models/User.js`; JWT verification exists in `Backend/middleware/auth.js`.
- Recommendations: Add rate limiting and request-size controls for `/api/auth/login`, `/api/auth/register`, `/api/contact`, and coupon validation. Keep generic auth error messages.

**JWT secret configuration is not validated at startup:**
- Risk: `jwt.sign` and `jwt.verify` depend on `process.env.JWT_SECRET`; a missing or weak secret causes runtime failures or weak token integrity.
- Files: `Backend/controllers/authController.js`, `Backend/middleware/auth.js`, `Backend/server.js`
- Current mitigation: `.env` and `.env.example` files are present, but their contents were not read.
- Recommendations: Add startup validation for `JWT_SECRET`, `MONGO_URI`, and `FRONTEND_URL`. Fail fast before `app.listen` if required secrets are missing.

**Sensitive tokens are persisted in browser local storage:**
- Risk: Zustand `persist` stores the bearer token and user object in local storage, exposing the token to any successful XSS on the frontend origin.
- Files: `Frontend/Ecommerce-main/my-app/src/store/authStore.js`, `Frontend/Ecommerce-main/my-app/src/api/axios.js`
- Current mitigation: Protected API calls require bearer tokens; no CSRF-prone cookie auth is used.
- Recommendations: Prefer short-lived access tokens with refresh rotation, or move auth to secure HttpOnly cookies with CSRF protection. At minimum, add XSS hardening and keep token lifetime short.

**Contact and profile inputs are minimally validated:**
- Risk: Unbounded text fields and user-provided address/contact data can carry spam, malformed data, or stored content that later becomes an XSS risk if rendered unsafely.
- Files: `Backend/controllers/contactController.js`, `Backend/models/ContactMessage.js`, `Backend/controllers/authController.js`, `Backend/models/User.js`
- Current mitigation: React escapes text by default in the inspected frontend components.
- Recommendations: Add length limits, trimming, email normalization, phone/address validation, spam throttling, and moderation status for contact messages.

**Hard-coded public MapTiler API key fallback:**
- Risk: A real API key appears as a frontend fallback value and is included in tile URLs.
- Files: `Frontend/Ecommerce-main/my-app/src/config/config.js`, `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx`
- Current mitigation: The key is public-facing by design if used in browser tile requests.
- Recommendations: Restrict the key by allowed domains in MapTiler, rotate it if it is intended to be private, and require `REACT_APP_MAPTILER_API_KEY` for deployed builds.

**Dependency vulnerabilities reported by production audit:**
- Risk: Backend `npm audit --omit=dev` reports 5 vulnerabilities, including high-severity `mongoose` and `path-to-regexp` advisories. Frontend `npm audit --omit=dev` reports 50 vulnerabilities, including high-severity `axios`, `react-router`, and `react-scripts` chains.
- Files: `Backend/package.json`, `Backend/package-lock.json`, `Frontend/Ecommerce-main/my-app/package.json`, `Frontend/Ecommerce-main/my-app/package-lock.json`
- Current mitigation: Lockfiles are present.
- Recommendations: Upgrade backend `express` and `mongoose`. Upgrade frontend `axios` and `react-router-dom`; plan a migration away from `react-scripts` if audit fixes require unsupported or disruptive package changes.

## Performance Bottlenecks

**Product pagination allows unbounded limits:**
- Problem: `getProducts` casts `limit` and `page` from query params without a maximum cap.
- Files: `Backend/controllers/productController.js`
- Cause: `Product.find(query).limit(Number(limit)).skip(skip)` trusts client-provided pagination values.
- Improvement path: Clamp `limit` to a small maximum such as 100, validate positive integers, and reject negative or non-numeric pagination values.

**Category and filtered product queries lack explicit indexes:**
- Problem: Product filters and sorts query `gender`, `category`, `isOnSale`, `rating`, `createdAt`, and `price.current`, but the schema does not define supporting indexes.
- Files: `Backend/models/Product.js`, `Backend/controllers/productController.js`
- Cause: Mongoose schema defines fields but no query indexes for catalog browsing.
- Improvement path: Add compound indexes matching common query paths, such as `{ gender: 1, category: 1 }`, `{ isOnSale: 1 }`, and sort-supporting indexes for rating/newest where needed.

**Admin list endpoints return entire collections:**
- Problem: Admin endpoints load all coupons and contact messages into memory and return them in one response.
- Files: `Backend/controllers/couponController.js`, `Backend/controllers/contactController.js`
- Cause: `Coupon.find().sort(...)` and `ContactMessage.find().sort(...)` have no pagination.
- Improvement path: Add page/limit params, response metadata, and descending createdAt indexes.

**Frontend filters run client-side over full product arrays:**
- Problem: `ProductGrid` filters and sorts in the browser over whatever full product set was loaded.
- Files: `Frontend/Ecommerce-main/my-app/src/components/ProductGrid.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Home.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Collection.jsx`
- Cause: Product filtering is not consistently delegated to the backend API.
- Improvement path: Use backend query params for catalog pages and keep client filtering only for small static fallback datasets.

## Fragile Areas

**Cart state mixes backend and local item shapes:**
- Files: `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`, `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`, `Frontend/Ecommerce-main/my-app/src/components/CartSidebar.jsx`
- Why fragile: Items may be local guest objects or populated backend cart subdocuments. UI code compensates with fallback helpers for `_id`, `product._id`, `priceAtAdd`, `price.current`, and local IDs.
- Safe modification: Normalize cart items at store boundaries and expose one stable view model to components.
- Test coverage: No cart store tests detected; only the default CRA `Frontend/Ecommerce-main/my-app/src/App.test.js` exists.

**Order creation is not transactional:**
- Files: `Backend/controllers/orderController.js`, `Backend/models/Order.js`, `Backend/models/Cart.js`, `Backend/models/Coupon.js`
- Why fragile: Order creation, coupon usage increment, and cart clearing are separate writes. A failure after creating the order can leave coupon usage or cart state inconsistent.
- Safe modification: Use a Mongoose session transaction for checkout, or implement idempotent order creation with explicit recovery steps.
- Test coverage: No backend test files or test script detected in `Backend/package.json`.

**Inventory is modeled but not enforced:**
- Files: `Backend/models/Product.js`, `Backend/controllers/cartController.js`, `Backend/controllers/orderController.js`
- Why fragile: Products have `stock`, but cart additions and order creation do not decrement or reserve stock.
- Safe modification: Validate requested quantity against stock during cart add/update and atomically decrement stock during checkout.
- Test coverage: No backend tests cover stock limits or concurrent checkout.

**Frontend API module naming is misleading:**
- Files: `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js`, `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx`
- Why fragile: `ordersApi.js` also exports `contactApi` and `couponApi`, which increases import confusion and contributed to the contact form bug.
- Safe modification: Split `contactApi` into `Frontend/Ecommerce-main/my-app/src/api/contactApi.js` and `couponApi` into `Frontend/Ecommerce-main/my-app/src/api/couponApi.js`.
- Test coverage: No API wrapper tests detected.

## Scaling Limits

**Single-process Express server:**
- Current capacity: One Node.js process started by `Backend/server.js`.
- Limit: CPU-bound bursts, slow database calls, or heavy JSON bodies can block the event loop for all users.
- Scaling path: Add request limits, production process management, horizontal scaling, health/readiness checks, and database connection pool tuning.

**MongoDB document cart model:**
- Current capacity: One cart document per user with an embedded `items` array.
- Limit: Very large carts grow a single document and make updates rewrite embedded array state.
- Scaling path: Keep current model for small retail carts; for high-volume or bulk ordering, move cart items into separate documents or enforce strict item count limits.

**Static fallback catalog:**
- Current capacity: Product fallback data lives in `Frontend/Ecommerce-main/my-app/public/database/database.json` and ships with the frontend.
- Limit: Catalog changes require frontend asset changes and redeploys when the backend is unavailable.
- Scaling path: Treat backend products as the source of truth and keep static fallback only for demos or remove it from production builds.

## Dependencies at Risk

**react-scripts:**
- Risk: The frontend is built on `react-scripts` 5.0.1, which carries many transitive audit findings and is difficult to modernize incrementally.
- Impact: Security fixes may require moving away from Create React App tooling rather than a simple patch upgrade.
- Migration plan: Move to Vite or another maintained React build setup, then re-run build, test, and audit.

**axios:**
- Risk: `Frontend/Ecommerce-main/my-app/package.json` pins `axios` with a version range that audited to a high-severity vulnerable installed version.
- Impact: All frontend API calls use `Frontend/Ecommerce-main/my-app/src/api/axios.js`.
- Migration plan: Upgrade `axios`, regenerate `Frontend/Ecommerce-main/my-app/package-lock.json`, and verify auth interceptor behavior.

**mongoose:**
- Risk: `Backend/package.json` uses `mongoose` in an audited vulnerable range.
- Impact: All backend persistence models depend on Mongoose: `Backend/models/User.js`, `Backend/models/Product.js`, `Backend/models/Cart.js`, `Backend/models/Order.js`, `Backend/models/Coupon.js`, `Backend/models/ContactMessage.js`.
- Migration plan: Upgrade Mongoose, enable filter sanitization where appropriate, and regression test controller queries.

## Missing Critical Features

**Payment integration:**
- Problem: Checkout explicitly states that no real payment is processed, while orders are auto-confirmed as `processing`.
- Blocks: Production ecommerce checkout, fraud controls, payment reconciliation, refunds, and payment failure handling.

**Admin order management endpoints:**
- Problem: Orders have tracking fields and statuses, but routes only let users create, list, read, and cancel their own orders.
- Blocks: Admin fulfillment workflows for shipping, delivery updates, tracking history, and status transitions.

**Password reset and email verification:**
- Problem: Auth supports register/login/profile only.
- Blocks: Account recovery, verified customer communication, and stronger account lifecycle controls.

## Test Coverage Gaps

**Backend controllers and auth middleware:**
- What's not tested: Registration, login, JWT protection, admin checks, cart operations, coupon use, order creation, and authorization boundaries.
- Files: `Backend/controllers/authController.js`, `Backend/controllers/cartController.js`, `Backend/controllers/orderController.js`, `Backend/middleware/auth.js`
- Risk: Security and checkout regressions can ship unnoticed.
- Priority: High

**Frontend checkout/contact/account flows:**
- What's not tested: Contact submission, checkout validation, coupon application, protected route behavior, login/register, and order rendering.
- Files: `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Account.jsx`, `Frontend/Ecommerce-main/my-app/src/App.test.js`
- Risk: Existing defects such as the contact API mismatch and coupon success message mismatch are not caught.
- Priority: High

**State stores:**
- What's not tested: Auth persistence/logout, cart synchronization, local versus backend cart behavior, and coupon removal.
- Files: `Frontend/Ecommerce-main/my-app/src/store/authStore.js`, `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`
- Risk: Session and cart state bugs affect core purchase flows.
- Priority: Medium

---

*Concerns audit: 2026-06-08*
