<!-- generated-by: gsd-doc-writer -->
# Development

PLASHOE is developed as two nested JavaScript apps: an Express/Mongoose backend in `Backend` and a Vite React storefront in `Frontend/Ecommerce-main/my-app`. There is no root package manifest, so install, run, build, and test commands are executed from the relevant app directory.

## Local Setup

1. Clone and enter the repository:

   ```bash
   git clone git@github.com:MohammedGhazal09/PLASHOE.git
   cd PLASHOE
   ```

2. Install backend dependencies:

   ```bash
   cd Backend
   npm install
   ```

3. Configure backend runtime values in a local ignored `.env` file. See `docs/CONFIGURATION.md` for the full variable list. The backend needs MongoDB and JWT configuration for database-backed and authenticated flows.

4. Start the backend API:

   ```bash
   npm run dev
   ```

5. In a second terminal, install frontend dependencies:

   ```bash
   cd Frontend/Ecommerce-main/my-app
   npm install
   ```

6. Configure frontend `REACT_APP_*` runtime values in a local ignored `.env` file when defaults are not enough. See `docs/CONFIGURATION.md`.

7. Start the storefront:

   ```bash
   npm start
   ```

Recommended local loop: keep the backend on `http://localhost:5000`, point the frontend API base URL at `http://localhost:5000/api`, and run the Vite dev server from `Frontend/Ecommerce-main/my-app`.

If Vite's default port `5173` is already in use, choose another port and keep `Backend/.env` `FRONTEND_URL` aligned with that exact frontend origin.

## Build Commands

### Backend

Run from `Backend`.

| Command | Description |
| --- | --- |
| `npm start` | Starts `server.js` with Node. |
| `npm run dev` | Starts `server.js` with Node watch mode for local backend development. |
| `npm run seed` | Runs `utils/seedData.js` to clear and seed products, reviews, coupons, and an environment-provided admin user in MongoDB. |
| `npm test` | Runs backend Vitest tests once. |
| `npm test -- product.test.js validation.test.js` | Runs a focused backend route/validation test target. |

The backend does not define a `lint`, `format`, or `build` script in `Backend/package.json`.

### Frontend

Run from `Frontend/Ecommerce-main/my-app`.

| Command | Description |
| --- | --- |
| `npm start` | Starts the Vite development server. |
| `npm run build` | Builds production static assets with Vite. |
| `npm test` | Runs frontend Vitest tests once. |
| `npm run test:watch` | Runs frontend Vitest tests in watch mode. |

## Code Style

- Backend source uses ES modules because `Backend/package.json` sets `"type": "module"`. Use `import`/`export`, and include `.js` extensions on relative backend imports.
- Frontend source uses React function components, JSX files for pages/components, Vite, Tailwind utility classes, Material UI theme configuration in `src/App.js`, and plain JavaScript modules.
- Tailwind is configured in `Frontend/Ecommerce-main/my-app/tailwind.config.js` with content scanning for `./src/**/*.{html,js,jsx}` and shared `primary`, `dark`, and `light` color tokens.
- No standalone Prettier, Biome, root ESLint config, or `.editorconfig` file was detected. Keep formatting consistent with nearby files and run the available frontend test/build commands before handing off changes.

## Backend Patterns

Backend resources follow a conventional Express MVC split:

```text
Backend/
├── server.js          # Express app, middleware, route mounts, health endpoint, error handler
├── config/db.js      # Mongoose connection helper
├── routes/           # HTTP method/path declarations
├── controllers/      # Request validation, model calls, response envelopes
├── models/           # Mongoose schemas, virtuals, hooks, instance methods
├── middleware/       # JWT auth and admin authorization
└── utils/            # Operational scripts such as database seeding
```

Route files should stay thin. They import controller functions, apply `protect` and `admin` where needed, and define HTTP shape. For example, `productRoutes.js` exposes public product reads and protects product create/update/delete with both `protect` and `admin`; `cartRoutes.js` and `orderRoutes.js` call `router.use(protect)` before their handlers.

Controllers own request-specific workflow and response shape. Current controllers return JSON envelopes such as:

```json
{
  "success": true,
  "data": {}
}
```

List endpoints commonly add `count`, `total`, or `pages`; failures return `success: false` with a `message`. Keep this envelope consistent when adding endpoints so frontend API clients can handle responses uniformly.

Models own persistence rules. `User.js` hashes passwords in a `pre('save')` hook and exposes `matchPassword`; `Cart.js` defines `subtotal` and `total` virtuals; `Order.js` generates an `orderNumber` before save; `Coupon.js` exposes coupon validity behavior.

When adding a backend resource, use this workflow:

1. Add or update a Mongoose model in `Backend/models`.
2. Add controller functions in `Backend/controllers`.
3. Add a router in `Backend/routes`.
4. Mount the router in `Backend/server.js` under `/api`.
5. Add a frontend API module or extend an existing one in `src/api`.
6. Smoke test the route with the backend running.

## Frontend Patterns

Frontend code is organized around route pages, reusable components, API modules, and Zustand stores:

```text
Frontend/Ecommerce-main/my-app/src/
├── App.js          # Theme, router, public/protected routes, global toaster
├── api/            # Shared Axios instance and resource API wrappers
├── components/     # Layout, header/footer, product UI, cart UI, route guards
├── config/         # Frontend runtime configuration facade
├── pages/          # Route-level screens
└── store/          # Auth, cart, and wishlist Zustand stores
```

Pages should compose screens and call API/store boundaries rather than constructing raw backend requests. Product catalog pages use `useCatalogUrlQuery` for shareable URL state and `useCatalogProducts`, which calls the catalog service and `productsApi.getAll(params)` before rendering `ProductGrid`; product detail uses `productsApi.getById`, `recommendationsApi`, `backInStockApi`, `productsApi.getRelated`, and `reviewsApi`; lookbook uses `lookbookApi` plus `useCartStore`; checkout and order pages use `ordersApi`; order detail return/exchange requests use `returnsApi`; contact forms use `contactApi`; coupon validation wrappers live in `couponApi`; account flows use `useAuthStore`; cart UI uses `useCartStore`; wishlist UI uses `wishlistApi` through `useWishlistStore`.

API calls should go through `src/api/axios.js`. The shared Axios instance sets `config.api.baseUrl`, sends JSON headers, attaches `Authorization: Bearer <token>` from `useAuthStore`, and logs the user out on `401` responses.

Use Zustand for state that crosses routes or reloads:

- `authStore.js` persists `token`, `user`, and `isAuthenticated` under `auth-storage`.
- `cartStore.js` persists cart items, coupon code, and discount under `cart-storage`.
- `cartStore.js` uses local cart items for guests and backend cart synchronization for authenticated users.
- `cartStore.mergeLocalCart()` is the auth-to-checkout reconciliation boundary. It sends backend-safe MongoDB product ids to `POST /api/cart/merge`, preserves local-only fallback products for review, and blocks checkout from silently ignoring unresolved local items.
- `selectItemCount`, `selectSubtotal`, and `selectTotal` are exported selectors; prefer them over duplicating cart math inside components.
- `wishlistStore.js` persists saved products under `wishlist-storage`, keeps guest saves local, syncs backend-safe product ids through `/api/wishlist` for authenticated users, and preserves local-only catalog fallback saves without sending them to the backend.
- `selectWishlistCount` is the header count selector; prefer it over duplicating wishlist length logic.

Use page-local React state for one-screen UI concerns such as modal state, form fields, and selected product size. Catalog search/filter/sort/page state is intentionally URL-backed through `useCatalogUrlQuery` so `/collection`, `/men`, `/women`, and `/sale` can be refreshed or shared without losing discovery state. Keep catalog list loading in the service/hook boundary rather than a global Zustand store.

## Recommended Workflows

### Backend Resource Change

1. Update model validation and schema behavior first.
2. Update controller behavior and response envelopes.
3. Update route protection deliberately: public, `protect`, or `protect` plus `admin`.
4. Mount new routers in `server.js`.
5. Add or update the frontend API wrapper.
6. Smoke test the endpoint with representative success and failure cases.

### Frontend Feature Change

1. Add the backend call in `src/api` first if the feature needs server data.
2. Put cross-route state in `src/store`; keep page-only state in the page component or a focused hook.
3. Add or update reusable UI in `src/components` only when more than one page needs it.
4. Wire routes in `src/App.js`; wrap authenticated screens with `ProtectedRoute`.
5. For admin screens, wrap `/admin` surfaces with `AdminRoute`; it requires `isAuthenticated` and `user.isAdmin === true`, but backend `protect` plus `admin` middleware remains the enforcement boundary.
6. Run a production build after significant UI, routing, or dependency changes.

### Admin Console

The store admin console lives at `/admin` in the frontend. It is intended for authenticated admin users and currently covers orders, returns, products, lookbook entries, coupons, and contact messages.

- Order operations use `adminApi.getOrders`, `adminApi.getOrder`, and `adminApi.updateOrderFulfillment`.
- Return/exchange operations use `adminApi.getReturns`, `adminApi.getReturn`, and `adminApi.updateReturnStatus`.
- Product operations use `adminApi.getProducts`, `adminApi.createProduct`, `adminApi.updateProduct`, and `adminApi.deleteProduct`; the product form also maintains materials, care instructions, and source-backed sustainability fields.
- Lookbook operations use `adminApi.getLookbookEntries`, `adminApi.createLookbookEntry`, `adminApi.updateLookbookEntry`, and `adminApi.deleteLookbookEntry`; entries reference product IDs for hotspots and bundle items.
- Coupon operations use `adminApi.getCoupons`, `adminApi.createCoupon`, and `adminApi.deleteCoupon`.
- Contact message operations use `adminApi.getContactMessages`, `adminApi.markContactMessageRead`, and `adminApi.deleteContactMessage`.

Do not commit admin credentials. Seed or configure admin users through backend environment-backed setup, and keep every admin API route protected server-side.

### Wishlist Saved Intent

The wishlist feature is enabled by default and can be disabled with `REACT_APP_ENABLE_WISHLIST=false`. Product cards and quick view use `WishlistButton`; the header exposes the saved count; and the account page includes the saved-products management tab.

Guests can save products locally without authentication. After login or registration, backend-safe MongoDB product ids are merged into the authenticated `/api/wishlist` document while local-only fallback product ids stay local. The account wishlist tab lets signed-in users remove saved products or move a saved product to cart after selecting an available size.

When changing wishlist behavior, verify all three surfaces together: product card/quick view toggles, the header count/link, and the account wishlist tab. The store is intentionally additive during auth merge so an API failure does not silently discard local saved intent.

### Checkout Conversion and Cart Merge

Checkout is account-required. The route guard sends unauthenticated `/checkout` visits to Account with the original checkout path in `location.state.from`. Account login/register then merges local cart items before returning the shopper to checkout. If merge fails, Account routes to Cart with review copy.

Backend cart merge is protected at `POST /api/cart/merge`. It aggregates incoming guest product/size lines, validates final quantities against current stock, ignores guest prices, and leaves the backend cart unchanged on product or stock conflicts. Frontend local-only `local-*` products cannot be merged and must remain visible until the shopper removes them.

Checkout should always use the backend cart as the source of truth for order creation. Do not send line items or totals to `ordersApi.create`; only send shipping address and optional notes. Saved address reuse comes from `authStore.user.addresses`, with checkout preferring the default address and optionally calling `authStore.addAddress()` when the shopper chooses to save a submitted address.

### Returns and Exchanges

Returns and exchanges are request workflows, not live refund execution. Customer order detail uses `returnsApi` to list existing requests and submit a new request only for delivered orders in an eligible payment state. The backend `ReturnRequest` model stores the request number, item quantities, eligibility snapshot, refund intent, and status history.

Eligibility is enforced server-side in `returnRequestService.js`: order status must be `delivered`, `deliveredAt` must be set, `paymentStatus` must be `paid` or `not_required`, the order must be within `RETURN_WINDOW_DAYS` (default 30), and requested quantities cannot exceed the original order quantity minus active RMA quantities. Keep these checks on the backend even if frontend copy hides ineligible forms.

Admin return operations live in the `/admin` Returns section. Admins can approve, reject, receive, and resolve requests with notes. Resolving a return may record a manual refund amount on the RMA `refundIntent`, but it must not call Stripe or mutate `Order.paymentStatus`, `refundAmount`, or `refundRecords`; Stripe webhook reconciliation remains the only automated provider refund state source.

### Product Detail and Reviews

The product detail route lives at `/products/:id`. Product cards link their image and name to this route while keeping wishlist, quick view, and cart actions independent. `ProductDetail.jsx` reuses the product normalizer, cart store, wishlist button, related `ProductCard` grid, and local fallback catalog path.

Reviews are enabled by default and can be disabled with `REACT_APP_ENABLE_REVIEWS=false`. Public review listing uses `reviewsApi.getReviews(productId)`. Review submission uses `reviewsApi.createReview(productId, payload)` and depends on backend verified-purchase eligibility; the frontend should distinguish sign-in, unverified purchase, duplicate review, and validation failures.

When changing product detail behavior, verify the backend related/review endpoints, normalizer rich fields, ProductCard navigation, `/products/:id` route rendering, add-to-cart, fit guidance, review empty/list/form states, and bounded related products together.

### Product Sustainability Content

Product records can include `materials`, `careInstructions`, and a nested `sustainability` object for summary, source, impact metrics, certifications, manufacturing, and durability details. Keep environmental claims product-scoped and source-backed: summaries need a source, impact metrics need a source per metric, and manufacturing or durability groups need their own source when populated.

The product detail UI renders sustainability content only when the normalized product contains those fields; otherwise it uses conservative fallback copy. Do not add static impact totals or broad sustainability claims to story or marketing surfaces unless the supporting fields exist and are maintained.

### Retention Lifecycle Commerce

Back-in-stock requests are opt-in intent records, not active provider delivery. `POST /api/back-in-stock` stores product, size, email, consent, and pending status only when the product is currently unavailable. Do not add email/SMS provider secrets, background jobs, or contact-list exports without a later provider-selection phase.

Buy-again uses `POST /api/orders/:id/reorder`. Keep this server-side so current catalog price, size, stock, and product-deletion checks are enforced before the cart changes. The frontend should sync/open the cart after a successful reorder response rather than constructing cart lines from historical order data.

Recommendations use `GET /api/recommendations` and must remain bounded and explainable. The current rule set uses catalog context such as product category, gender, rating, and stock; it does not use behavioral tracking or cross-session personalization data.

### Shoppable Lookbook

Lookbook entries live in `Backend/models/LookbookEntry.js` and are managed through `/api/admin/lookbook`. Public reads use `/api/lookbook` and return active entries only. Each entry can include scene image metadata, hotspot coordinates, and optional bundle items. Admin writes must keep product references valid through `productId` fields; products remain authoritative for current price, stock, image, and supported sizes.

The storefront `/lookbook` page uses `lookbookApi.getEntries()` and then sends individual or bundle item adds through `useCartStore.addItem`. Keep bundle behavior on the existing cart path unless a later phase adds bundle-specific pricing or promotions.

### Catalog Discovery

Catalog list APIs support bounded text search and filters for category, gender, sale state, size, price range, minimum rating, sort, page, and limit. Search requests use the backend text index; do not replace them with unbounded regex scans. The convenience routes `/api/products/men`, `/api/products/women`, and `/api/products/sale` still force their route filter after query validation.

The storefront keeps discovery state in the URL. `/collection?q=trail&size=41&minPrice=80&sort=price-asc&page=2` should restore the same controls and request params on reload. Route-forced filters such as men's gender or sale-only pages are applied to API calls but omitted from the shareable query string.

### Verification

Use the commands that exist in this repository:

```bash
cd Backend
npm run dev
```

Then smoke test:

```bash
curl http://localhost:5000/api/health
```

For frontend changes:

```bash
cd Frontend/Ecommerce-main/my-app
npm test
npm run build
```

For backend changes:

```bash
cd Backend
npm test
```

Use focused targets while iterating, then run the broader regression commands before handoff when the change crosses backend/frontend boundaries.

## High-Risk Areas

- `Backend/utils/seedData.js` deletes existing products, reviews, coupons, and users before inserting seed data. Run it only against a database that is safe to reset.
- The seed script requires `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` and refuses non-local MongoDB URIs unless `ALLOW_NON_LOCAL_SEED=true` is set for disposable data.
- `Backend/config/db.js` logs MongoDB connection errors but does not stop the server. A running `/api/health` endpoint does not prove database-backed routes are working.
- `JWT_SECRET` is required by auth token signing and verification. Missing or inconsistent values break login, registration token creation, and protected routes.
- CORS is controlled by `FRONTEND_URL` in `Backend/server.js`, with credentials enabled. Keep the backend CORS origin aligned with the actual frontend origin.
- Admin authorization only exists where routes explicitly add `admin`. New mutation or management routes need protection reviewed route by route.
- `src/api/axios.js` imports `useAuthStore`, while `authStore.js` calls `authApi`, which uses the shared Axios instance. Be careful changing auth initialization or interceptor behavior because this coupling can create circular timing problems.
- Guest cart and authenticated cart behavior diverge. Guest items use local IDs, while authenticated items use backend cart item IDs. Test login, add, update quantity, remove, coupon, checkout, and logout flows when changing cart code.
- Guest cart merge failures must not drop local items. Checkout must block payment start while unresolved local items remain in authenticated cart state.
- Guest wishlist and authenticated wishlist behavior also diverge. Guest saves are local product ids; authenticated sync only sends backend-safe ObjectIds to `/api/wishlist`; login/register merge failures must not drop local saves.
- Product catalog fallback lives in `src/services/catalog/catalogService.js` and should trigger only on backend request failure. Valid empty backend catalog responses should stay empty. Product detail may use local fallback products for `local-*` ids from fallback catalog cards, but backend ObjectIds should use the API detail and related-product contracts.
- `Contact.jsx` imports `contactApi` from `src/api/contactApi.js` and calls `contactApi.submit(name, email, subject, message)`. Treat contact form changes carefully and verify the form against the API wrapper.
- `ordersApi.js` is order-only. Keep contact and coupon calls in `contactApi.js` and `couponApi.js` so resource ownership remains clear.
- `Order.js` builds order numbers from `Date.now()` plus `countDocuments()`. This is simple, but concurrent order creation can still be a sensitive area because `orderNumber` is unique.
- Contact information appears both in frontend configuration defaults and hard-coded `Contact.jsx` display text. Keep these in sync when changing public business details.

## Branch Conventions

The default local branch is `main`. No branch naming convention was found in repository files, and no `.github` pull request template was detected.

Recommended convention until the project documents one:

- `feature/<short-description>` for new features
- `fix/<short-description>` for bug fixes
- `docs/<short-description>` for documentation-only changes
- `chore/<short-description>` for dependency, tooling, or cleanup work

## PR Process

No repository PR template or CI workflow was detected. Use this lightweight process for changes:

- Keep backend and frontend changes scoped to the smallest resource, page, component, API module, or store needed.
- Describe which app paths changed, for example `Backend/routes` or `Frontend/Ecommerce-main/my-app/src/store`.
- Include the exact commands run, such as `npm run build`, `npm test`, or the backend health check.
- Note any database seeding, migrations, or manual data setup used during testing.
- For auth, cart, checkout, order, and admin-route changes, include manual smoke-test notes because automated coverage is currently minimal.
