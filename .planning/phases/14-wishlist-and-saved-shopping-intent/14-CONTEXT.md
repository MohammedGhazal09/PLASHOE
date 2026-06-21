# Phase 14: wishlist-and-saved-shopping-intent - Context

**Gathered:** 2026-06-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 14 delivers customer wishlist persistence and saved-shopping-intent flows across backend APIs, frontend state, product browsing surfaces, account, and header navigation. It does not create the full product detail page, notifications, sharing, analytics, or new cart/checkout semantics.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**6 requirements are locked.** See `14-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `14-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Backend wishlist persistence model and protected API routes for list/add/remove.
- Frontend `wishlistApi` wrapper and wishlist store with authenticated backend sync plus guest local persistence.
- Safe local-to-authenticated reconciliation after login/register.
- Product card and Quick View save/unsave controls.
- Header wishlist count/link and Account Wishlist list/remove/move-to-cart view.
- Focused backend API tests, frontend API/store/component tests, docs, and verification.

**Out of scope (from SPEC.md):**
- Full product detail route creation - Phase 15 owns product detail pages; Phase 14 only prepares reusable wishlist controls.
- Wishlist sharing, public saved lists, collaborative lists, and email reminders - these are retention/social features beyond saved shopping intent.
- Price-drop, back-in-stock, or personalized recommendation notifications - Phase 20 owns lifecycle commerce and personalization.
- Wishlist analytics dashboards - outside the Phase 14 shopper-facing goal.
- Native mobile or cross-browser E2E test matrix - focused unit/integration/browser smoke is enough for this phase.
- Changing checkout/cart stock rules - move-to-cart must use existing cart behavior rather than weakening prior checkout guarantees.

</spec_lock>

<decisions>
## Implementation Decisions

### Backend Wishlist Contract
- **D-01:** Use one `Wishlist` document per user with `user` unique and `items: [{ product, addedAt }]`. This mirrors the existing one-cart-per-user pattern and keeps per-user list operations simple.
- **D-02:** Mount wishlist routes at `/api/wishlist` with `router.use(protect)`.
- **D-03:** Implement `GET /api/wishlist` with bounded pagination parameters `page` and `limit` using the shared envelope shape `{ success, count, total, page, limit, pages, data }`.
- **D-04:** Implement `POST /api/wishlist/items` with body `{ productId }`; duplicate product ids are idempotent and return the current wishlist rather than a conflict.
- **D-05:** Implement `DELETE /api/wishlist/items/:productId`; deleting a missing product id is a safe no-op for the user's wishlist and returns the current wishlist.
- **D-06:** Populate wishlist products with the fields needed by ProductCard/Account: `_id`, `name`, `image`, `price`, `sizes`, `stock`, `category`, `gender`, and `isOnSale`.
- **D-07:** Validate route body/query/params with strict Zod schemas in `Backend/validators/wishlist.js`; invalid ObjectIds return validation errors before controller logic.
- **D-08:** If a valid product id does not exist, add returns `404` and remove returns the current wishlist unchanged.

### Frontend API and Store
- **D-09:** Add `Frontend/Ecommerce-main/my-app/src/api/wishlistApi.js` with `getWishlist(params)`, `addItem(productId)`, and `removeItem(productId)`.
- **D-10:** Add `Frontend/Ecommerce-main/my-app/src/store/wishlistStore.js` using Zustand `persist`, following the cart store style.
- **D-11:** Store normalized wishlist items with `{ productId, name, image, price, sizes, stock, category, gender, addedAt, source, raw }`.
- **D-12:** Expose selectors/actions for item count, `isSaved(productId)`, `syncWishlist`, `toggleWishlist(product)`, `addItem(product)`, `removeItem(productId)`, and `mergeLocalWishlist`.
- **D-13:** Treat Mongo ObjectIds as backend-syncable. Product ids that are missing or start with `local-` remain local-only and never call protected wishlist APIs.
- **D-14:** Preserve local guest wishlist items in browser storage until a successful authenticated merge; failed merge keeps local items available for retry.
- **D-15:** On login/register success, merge local backend-syncable wishlist items into the backend, then sync the backend list. Local-only fallback catalog items remain local with explicit copy.

### Guest and Auth Policy
- **D-16:** Guest saves are allowed, local, and explicit. UI copy should say saved items are on this device and sign-in keeps them across devices.
- **D-17:** Authenticated saves use backend APIs when the product has a backend-safe id; otherwise the item remains local-only and shows a non-blocking message.
- **D-18:** Merge behavior is automatic and additive after login/register. It never deletes existing backend items and never clears local items before successful merge.

### Storefront and Account Surfaces
- **D-19:** Add a reusable `WishlistButton` component that renders an accessible save/unsave control with heart icon and text/aria label.
- **D-20:** Product cards and Quick View should use `WishlistButton` and reflect current saved state.
- **D-21:** Header should show a wishlist link/icon with count when `config.features.wishlist` is true.
- **D-22:** Account Wishlist should render saved product rows/cards with image, name, price, stock/status where available, remove action, size selector, and move-to-cart action.
- **D-23:** Move-to-cart uses existing `useCartStore().addItem(product, 1, size)`, then removes the wishlist item only after add succeeds.
- **D-24:** Default move-to-cart size is the first available product size, matching the Phase 7 ProductCard/QuickView selection fix; users can change size before moving.

### Feature Flag and Documentation
- **D-25:** Change the wishlist feature default to enabled after Phase 14 while preserving `REACT_APP_ENABLE_WISHLIST=false` as a frontend kill switch.
- **D-26:** The backend wishlist API remains available to authenticated callers regardless of frontend flag state.
- **D-27:** Update `docs/API.md`, `docs/DEVELOPMENT.md`, `docs/TESTING.md`, and `docs/CONFIGURATION.md`.

### Testing and Verification
- **D-28:** Add backend tests for auth rejection, add/list/remove, duplicate add, missing product, and validation failures.
- **D-29:** Add frontend API wrapper tests for wishlist endpoint mapping.
- **D-30:** Add wishlist store tests for guest local behavior, authenticated sync, merge success/failure, local-only item handling, and move-to-cart removal ordering.
- **D-31:** Add UI tests for ProductCard or WishlistButton, Quick View save state, Header count/link, and Account Wishlist remove/move behavior.
- **D-32:** Run focused backend wishlist tests, focused frontend wishlist tests, existing affected product/account/header tests, and frontend production build.

### the agent's Discretion
- Exact component extraction boundaries are left to the implementer as long as `WishlistButton`, `wishlistApi`, and `wishlistStore` remain clear public surfaces.
- Exact success/toast wording can follow existing PLASHOE tone, but guest-local and merge-failure copy must be explicit.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Requirements
- `.planning/phases/14-wishlist-and-saved-shopping-intent/14-SPEC.md` - Locked requirements, boundaries, constraints, and acceptance criteria.

### Roadmap and Requirements
- `.planning/ROADMAP.md` - Phase 14 goal, success criteria, and plan candidates.
- `.planning/REQUIREMENTS.md` - V2-WISH-01, V2-WISH-02, and V2-WISH-03.
- `.planning/STATE.md` - Current phase state and project-level continuation context.

### Backend Patterns
- `Backend/app.js` - API route mounting, JSON parser policy, and health/readiness routes.
- `Backend/models/Cart.js` - One document per authenticated user pattern.
- `Backend/routes/cartRoutes.js` - Protected resource router pattern.
- `Backend/controllers/cartController.js` - Authenticated resource controller response shape and cart mutation behavior.
- `Backend/validators/shared.js` - ObjectId, strict object, and pagination helper patterns to reuse.
- `Backend/test/cart.test.js` - Backend route test style for protected ecommerce resources.
- `Backend/test/helpers/factories.js` - Test user/product factory pattern.

### Frontend Patterns
- `Frontend/Ecommerce-main/my-app/src/config/config.js` - Feature flag defaults and public config surface.
- `Frontend/Ecommerce-main/my-app/src/api/axios.js` - Shared API client and bearer token behavior.
- `Frontend/Ecommerce-main/my-app/src/api/cartApi.js` - Resource API wrapper pattern.
- `Frontend/Ecommerce-main/my-app/src/store/authStore.js` - Login/register persistence and reconciliation hook point.
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` - Authenticated backend sync plus guest local persistence pattern.
- `Frontend/Ecommerce-main/my-app/src/services/catalog/normalizeProduct.js` - Product id/image/price normalization contract.
- `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx` - Product card add-to-cart surface where wishlist control connects.
- `Frontend/Ecommerce-main/my-app/src/components/QuickViewModal.jsx` - Quick View add-to-cart surface where wishlist control connects.
- `Frontend/Ecommerce-main/my-app/src/components/Header.jsx` - Header count/link integration point.
- `Frontend/Ecommerce-main/my-app/src/pages/Account.jsx` - Existing Wishlist tab placeholder and login/register flow.

### Documentation
- `docs/API.md` - API contract documentation target.
- `docs/DEVELOPMENT.md` - Development pattern documentation target.
- `docs/TESTING.md` - Test command and coverage documentation target.
- `docs/CONFIGURATION.md` - Wishlist feature flag documentation target.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `cartStore.js`: Closest match for dual guest/auth persistence behavior.
- `normalizeProduct.js`: Source of truth for product ids and UI-ready product fields.
- `ProductCard.jsx` and `QuickViewModal.jsx`: Existing purchase-intent controls and selected-size behavior.
- `Account.jsx`: Contains the dormant Wishlist tab and login/register flow where reconciliation can be triggered.
- `Header.jsx`: Existing global customer navigation and icon pattern.
- `Backend/test/helpers/factories.js`: Product/user factories can support wishlist tests.

### Established Patterns
- Backend route files stay thin; controller/model/validator files own behavior and boundaries.
- Backend protected resources apply `protect` at router level when all endpoints require auth.
- Frontend API wrappers call the shared Axios instance and return response `data`.
- Zustand stores own cross-route state and browser persistence.
- Frontend tests mock resource API modules and store actions directly.

### Integration Points
- Mount backend wishlist routes under `/api/wishlist` in `Backend/app.js`.
- Add `wishlistApi.js` under the existing API layer.
- Add `wishlistStore.js` under the existing store layer.
- Add save/unsave UI to ProductCard and QuickView.
- Add wishlist count/link to Header.
- Replace Account Wishlist placeholder with saved product list and move-to-cart flow.

</code_context>

<specifics>
## Specific Ideas

- Use heart iconography for save/unsave controls, matching the existing Account Wishlist icon.
- Keep wishlist item display compact and ecommerce-focused: image, name, price, stock/status, size selector, remove, and move-to-cart.
- Keep guest copy explicit but short: saved on this device; sign in to keep it across devices.

</specifics>

<deferred>
## Deferred Ideas

- Product detail route integration is deferred to Phase 15, but Phase 14 should leave a reusable wishlist control ready for that page.
- Price-drop/back-in-stock emails and lifecycle campaigns are deferred to Phase 20.
- Wishlist sharing or public lists are deferred outside the current roadmap scope.

</deferred>

---

*Phase: 14-wishlist-and-saved-shopping-intent*
*Context gathered: 2026-06-20*
