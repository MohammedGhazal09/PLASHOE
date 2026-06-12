<!-- refreshed: 2026-06-08 -->
# Architecture

**Analysis Date:** 2026-06-08

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                  React Ecommerce Frontend                    │
├──────────────────┬──────────────────┬───────────────────────┤
│   Route Shell    │   Pages          │    Shared Components   │
│  `Frontend/Ecommerce-main/my-app/src/App.js`                 │
│  `Frontend/Ecommerce-main/my-app/src/pages`                  │
│  `Frontend/Ecommerce-main/my-app/src/components`             │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│             Frontend State + API Client Layer                │
│ `Frontend/Ecommerce-main/my-app/src/store`                   │
│ `Frontend/Ecommerce-main/my-app/src/api`                     │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP JSON over `/api/*`
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express API Backend                       │
│ `Backend/server.js` → `Backend/routes` → `Backend/controllers`│
│                                  ↘ `Backend/services`         │
└────────────────────────────┬────────────────────────────────┘
                             │ Mongoose queries
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        MongoDB Data Store                    │
│ `Backend/models`                                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Backend server | Loads environment config, connects MongoDB, applies middleware, mounts API routers, exposes health check, and starts Express. | `Backend/server.js` |
| Database connector | Opens the Mongoose connection from `MONGO_URI` and logs connection failures without terminating the process. | `Backend/config/db.js` |
| Auth middleware | Validates bearer JWTs, loads `req.user`, and gates admin-only routes. | `Backend/middleware/auth.js` |
| API routers | Bind HTTP paths and methods to controller functions; use `protect` and `admin` at route or router level. | `Backend/routes/*.js` |
| Controllers | Own HTTP request/response mapping and delegate cross-model workflows to services when orchestration spans resources. | `Backend/controllers/*.js` |
| Backend services | Own cross-model domain orchestration such as transactional checkout, stock/coupon consistency, and cancellation stock restore. | `Backend/services/*.js` |
| Mongoose models | Define persisted schemas, relationships, virtuals, hooks, and document methods. | `Backend/models/*.js` |
| Frontend bootstrap | Mounts React under `#root`, wraps `App` in strict mode, and starts web-vitals reporting. | `Frontend/Ecommerce-main/my-app/src/index.js` |
| Frontend route shell | Defines browser routes, Material UI theme, protected checkout/order pages, and global toast container. | `Frontend/Ecommerce-main/my-app/src/App.js` |
| Layout | Provides shared header, cart sidebar, outlet, and footer around all routes. | `Frontend/Ecommerce-main/my-app/src/components/Layout.jsx` |
| API clients | Wrap endpoint calls by resource using the shared Axios instance. | `Frontend/Ecommerce-main/my-app/src/api/*.js` |
| Zustand stores | Own client auth and cart state with persistence to browser storage. | `Frontend/Ecommerce-main/my-app/src/store/*.js` |

## Pattern Overview

**Overall:** Split frontend/backend ecommerce application with MVC-style Express API and component/page-based React client.

**Key Characteristics:**
- Keep backend HTTP wiring in `Backend/routes/*.js`; put request logic in `Backend/controllers/*.js`; put persistence rules in `Backend/models/*.js`.
- Keep frontend page composition in `Frontend/Ecommerce-main/my-app/src/pages/*.jsx`; reuse UI pieces from `Frontend/Ecommerce-main/my-app/src/components/*.jsx`.
- Access backend APIs through `Frontend/Ecommerce-main/my-app/src/api/*.js`; do not call Axios directly from pages or components except through the shared API layer.
- Use Zustand stores in `Frontend/Ecommerce-main/my-app/src/store/*.js` for cross-route auth/cart state and local guest cart behavior.

## Layers

**Frontend Application Layer:**
- Purpose: Browser UI, routing, theme setup, route protection, and page composition.
- Location: `Frontend/Ecommerce-main/my-app/src`
- Contains: `index.js`, `App.js`, `pages`, `components`, `assets`, `index.css`, `App.css`
- Depends on: React, React Router, Material UI, Tailwind utility classes, Zustand stores, API clients.
- Used by: Browser runtime from `Frontend/Ecommerce-main/my-app/public/index.html`.

**Frontend State Layer:**
- Purpose: Persist auth token/user state, cart contents, guest cart behavior, backend cart synchronization, and computed cart totals.
- Location: `Frontend/Ecommerce-main/my-app/src/store`
- Contains: `Frontend/Ecommerce-main/my-app/src/store/authStore.js`, `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`
- Depends on: `zustand`, `zustand/middleware`, API clients in `Frontend/Ecommerce-main/my-app/src/api`.
- Used by: `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx`, cart UI components, checkout, account, and product cards.

**Frontend API Layer:**
- Purpose: Centralize HTTP base URL, JSON headers, JWT attachment, 401 handling, and resource-specific endpoint methods.
- Location: `Frontend/Ecommerce-main/my-app/src/api`
- Contains: `axios.js`, `authApi.js`, `productsApi.js`, `cartApi.js`, `ordersApi.js`
- Depends on: `axios`, `Frontend/Ecommerce-main/my-app/src/config/config.js`, `Frontend/Ecommerce-main/my-app/src/store/authStore.js`.
- Used by: Zustand stores and pages such as `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Account.jsx`, and product listing pages.

**Backend HTTP Layer:**
- Purpose: Express app setup, CORS, JSON parsing, route mounting, health checks, and final error middleware.
- Location: `Backend/server.js`
- Contains: Express app creation and all `/api/*` route mounts.
- Depends on: `Backend/config/db.js`, `Backend/routes/*.js`, `cors`, `dotenv`, `express`.
- Used by: `node Backend/server.js` or `npm start` from `Backend`.

**Backend Routing Layer:**
- Purpose: Map public, authenticated, and admin HTTP endpoints to controller functions.
- Location: `Backend/routes`
- Contains: `authRoutes.js`, `productRoutes.js`, `cartRoutes.js`, `orderRoutes.js`, `couponRoutes.js`, `contactRoutes.js`
- Depends on: `express`, `Backend/controllers/*.js`, `Backend/middleware/auth.js`.
- Used by: `Backend/server.js`.

**Backend Controller Layer:**
- Purpose: Map validated HTTP requests to resource behavior, call models or services, and return `{ success, data, message }` JSON responses.
- Location: `Backend/controllers`
- Contains: Auth, product, cart, order, coupon, and contact controllers.
- Depends on: Mongoose models in `Backend/models` and JWT helpers in `Backend/controllers/authController.js`.
- Used by: Routers in `Backend/routes`.

**Backend Service Layer:**
- Purpose: Encapsulate cross-model workflows that need one transaction or shared domain rules.
- Location: `Backend/services`
- Contains: `Backend/services/checkoutService.js`
- Depends on: Mongoose models in `Backend/models`.
- Used by: `Backend/controllers/orderController.js`.

**Backend Persistence Layer:**
- Purpose: Define MongoDB document schemas, schema hooks, virtual fields, and model methods.
- Location: `Backend/models`
- Contains: `User.js`, `Product.js`, `Cart.js`, `Order.js`, `Coupon.js`, `ContactMessage.js`
- Depends on: `mongoose`; `User.js` also depends on `bcryptjs`.
- Used by: Controllers, auth middleware, and `Backend/utils/seedData.js`.

## Data Flow

### Primary Product Browsing Path

1. React route renders a page such as `Frontend/Ecommerce-main/my-app/src/pages/Collection.jsx`, `Men.jsx`, `Women.jsx`, `Sale.jsx`, or `Home.jsx`.
2. The page calls `productsApi` from `Frontend/Ecommerce-main/my-app/src/api/productsApi.js`.
3. `productsApi` uses the shared Axios instance from `Frontend/Ecommerce-main/my-app/src/api/axios.js`, which reads `config.api.baseUrl` from `Frontend/Ecommerce-main/my-app/src/config/config.js`.
4. Express receives the request through `Backend/server.js` under `/api/products`.
5. `Backend/routes/productRoutes.js` maps the path to `Backend/controllers/productController.js`.
6. `Backend/controllers/productController.js` queries `Backend/models/Product.js` and returns JSON to the frontend.
7. Product pages render product grids/cards from `Frontend/Ecommerce-main/my-app/src/components/ProductGrid.jsx` and `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx`.

### Authenticated Checkout Path

1. `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx` requires `useAuthStore().isAuthenticated` before rendering `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`.
2. `Checkout.jsx` syncs cart state through `useCartStore().syncCart` from `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`.
3. `cartStore.js` calls `cartApi.getCart()` from `Frontend/Ecommerce-main/my-app/src/api/cartApi.js`.
4. `axios.js` attaches `Authorization: Bearer <token>` from `Frontend/Ecommerce-main/my-app/src/store/authStore.js`.
5. `Backend/routes/cartRoutes.js` applies `router.use(protect)` before cart handlers.
6. `Backend/middleware/auth.js` verifies JWT with `JWT_SECRET`, loads the `User` document, and sets `req.user`.
7. `Backend/controllers/cartController.js` loads or mutates `Backend/models/Cart.js`, populating related product details from `Backend/models/Product.js`.
8. On order submit, `Checkout.jsx` generates an `Idempotency-Key` and calls `ordersApi.create(orderData, idempotencyKey)` from `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js`.
9. `Backend/routes/orderRoutes.js` applies `protect`, then `Backend/controllers/orderController.js` delegates checkout to `Backend/services/checkoutService.js`.
10. `checkoutService.js` runs order creation, stock decrement, coupon usage increment, and cart clearing in one Mongoose transaction. Exact retries return the existing order; stale idempotency-key reuse and stock/coupon conflicts return structured `409` responses.

### Authentication Path

1. Account UI in `Frontend/Ecommerce-main/my-app/src/pages/Account.jsx` calls `useAuthStore().login` or `useAuthStore().register`.
2. `Frontend/Ecommerce-main/my-app/src/store/authStore.js` calls `authApi` methods from `Frontend/Ecommerce-main/my-app/src/api/authApi.js`.
3. `Backend/routes/authRoutes.js` maps `/register`, `/login`, `/me`, `/profile`, and address endpoints.
4. `Backend/controllers/authController.js` creates or verifies users with `Backend/models/User.js`, signs JWTs with `JWT_SECRET`, and returns user data plus token.
5. `authStore.js` persists `token`, `user`, and `isAuthenticated` under the `auth-storage` key.

**State Management:**
- Server state is persisted in MongoDB through Mongoose models in `Backend/models`.
- Client auth state is persisted in Zustand via `Frontend/Ecommerce-main/my-app/src/store/authStore.js`.
- Client cart state is persisted in Zustand via `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`; authenticated users sync to backend carts, while guests use local `local-*` item IDs.
- Route state uses React Router in `Frontend/Ecommerce-main/my-app/src/App.js` and `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx`.

## Key Abstractions

**Resource Routers:**
- Purpose: Keep endpoint declarations small and map resource paths to controllers.
- Examples: `Backend/routes/productRoutes.js`, `Backend/routes/cartRoutes.js`, `Backend/routes/orderRoutes.js`
- Pattern: `express.Router()` with public routes first, then protected/admin routes or `router.use(protect)` for whole-resource protection.

**Controllers:**
- Purpose: Own API use cases and response contracts for each resource.
- Examples: `Backend/controllers/cartController.js`, `Backend/controllers/orderController.js`, `Backend/controllers/authController.js`
- Pattern: Named async exports with inline `try/catch`, explicit status codes, and JSON `{ success, data, message }` responses.

**Services:**
- Purpose: Own multi-model domain workflows that should not live inside route files or large controllers.
- Examples: `Backend/services/checkoutService.js`
- Pattern: Export focused async functions, pass Mongoose sessions explicitly, and throw errors with `statusCode` plus optional `errors` arrays for controller/global error handling.

**Mongoose Models:**
- Purpose: Persist domain entities and encapsulate schema-level behavior.
- Examples: `Backend/models/User.js`, `Backend/models/Product.js`, `Backend/models/Cart.js`, `Backend/models/Order.js`
- Pattern: `new mongoose.Schema(...)`, virtuals for derived values, hooks for password hashing/order numbers, and model exports.

**Shared Axios Instance:**
- Purpose: Standardize base URL, auth header injection, and unauthorized logout.
- Examples: `Frontend/Ecommerce-main/my-app/src/api/axios.js`, `Frontend/Ecommerce-main/my-app/src/api/authApi.js`
- Pattern: Resource API modules import `api` and return `data` from endpoint calls.

**Zustand Stores:**
- Purpose: Share auth and cart state across routes/components with persisted browser storage.
- Examples: `Frontend/Ecommerce-main/my-app/src/store/authStore.js`, `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`
- Pattern: `create(persist((set, get) => ({ ...actions })))`; export selectors for computed cart values.

**Route Guards:**
- Purpose: Redirect unauthenticated users before protected page rendering.
- Examples: `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx`, `Frontend/Ecommerce-main/my-app/src/App.js`
- Pattern: Wrap protected route elements in `<ProtectedRoute>`.

## Entry Points

**Backend API Server:**
- Location: `Backend/server.js`
- Triggers: `npm start`, `npm run dev`, or `node server.js` from `Backend`
- Responsibilities: Load `.env`, connect MongoDB, apply middleware, mount `/api/auth`, `/api/products`, `/api/cart`, `/api/orders`, `/api/coupons`, `/api/contact`, expose `/api/health`, and listen on `PORT`.

**Backend Seeder:**
- Location: `Backend/utils/seedData.js`
- Triggers: `npm run seed` from `Backend`
- Responsibilities: Connect to MongoDB and seed product/coupon/user data using `Backend/models/Product.js`, `Backend/models/Coupon.js`, and `Backend/models/User.js`.

**Frontend React Bootstrap:**
- Location: `Frontend/Ecommerce-main/my-app/src/index.js`
- Triggers: CRA runtime loaded by `Frontend/Ecommerce-main/my-app/public/index.html`
- Responsibilities: Create React root and render `App`.

**Frontend Router:**
- Location: `Frontend/Ecommerce-main/my-app/src/App.js`
- Triggers: Browser navigation under the React app.
- Responsibilities: Define all route paths, shared layout nesting, protected route wrappers, Material UI theme, and toast setup.

**Frontend HTTP Client:**
- Location: `Frontend/Ecommerce-main/my-app/src/api/axios.js`
- Triggers: Any resource API call from stores or pages.
- Responsibilities: Use `REACT_APP_API_URL` through `config.api.baseUrl`, add bearer token, and logout on `401`.

## Architectural Constraints

- **Threading:** Backend uses the single-threaded Node.js event loop in `Backend/server.js`; no worker threads or background queues are detected.
- **Global state:** Frontend shared state lives in Zustand singleton stores in `Frontend/Ecommerce-main/my-app/src/store/authStore.js` and `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`. Backend shares the Express app instance in `Backend/server.js` and Mongoose connection state from `Backend/config/db.js`.
- **Circular imports:** No explicit circular import chain is visible in the route-controller-model layers. The frontend API client imports `useAuthStore` from `Frontend/Ecommerce-main/my-app/src/store/authStore.js`, while `authStore.js` imports `authApi`; this is a tight coupling between auth state and HTTP setup and should be modified cautiously.
- **Module system:** Backend uses ES modules because `Backend/package.json` sets `"type": "module"`. Use `.js` extension in relative backend imports, matching files such as `Backend/server.js`.
- **Environment:** Backend reads `FRONTEND_URL`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, and `PORT` via `dotenv` in `Backend/server.js`. Frontend reads CRA-style `REACT_APP_*` values through `Frontend/Ecommerce-main/my-app/src/config/config.js`.
- **API prefix:** Backend routes are mounted under `/api/*` in `Backend/server.js`; frontend API modules call paths relative to `config.api.baseUrl`, whose default already includes `/api`.

## Anti-Patterns

### Bypassing Resource API Modules

**What happens:** Calling `axios` directly from pages or components duplicates base URL, auth, and error behavior.
**Why it's wrong:** `Frontend/Ecommerce-main/my-app/src/api/axios.js` already centralizes token injection and 401 logout; bypassing it creates inconsistent auth handling.
**Do this instead:** Add methods to a resource API module such as `Frontend/Ecommerce-main/my-app/src/api/productsApi.js` or `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js` and call that module from pages/stores.

### Putting Business Logic in Routers

**What happens:** Adding validation, database queries, or checkout logic directly in `Backend/routes/*.js` makes routes hard to test and reuse.
**Why it's wrong:** Current route files such as `Backend/routes/cartRoutes.js` only declare paths and middleware; controllers own behavior.
**Do this instead:** Add controller functions in `Backend/controllers/*.js`, then wire them in `Backend/routes/*.js`.

### Skipping Auth Middleware on Protected Resources

**What happens:** Protected resources can accidentally expose user data if a route is added without `protect`.
**Why it's wrong:** Cart and order routes rely on `req.user` from `Backend/middleware/auth.js`.
**Do this instead:** For whole protected resources, use `router.use(protect)` as in `Backend/routes/cartRoutes.js` and `Backend/routes/orderRoutes.js`; for mixed resources, add `protect` and `admin` per route as in `Backend/routes/productRoutes.js`.

### Adding Persistent Rules Outside Models

**What happens:** Password hashing, order number generation, and derived totals spread into controllers.
**Why it's wrong:** Schema hooks and virtuals already establish where persistence behavior belongs.
**Do this instead:** Keep schema-level rules in files like `Backend/models/User.js`, `Backend/models/Order.js`, and `Backend/models/Cart.js`; keep request-specific orchestration in controllers.

## Error Handling

**Strategy:** Controllers return explicit JSON error responses inside `try/catch`; Express has a final fallback error handler in `Backend/server.js`; frontend stores/pages convert API errors into state or toast messages.

**Patterns:**
- Backend validation failures return `400`, auth failures return `401`, authorization failures return `403`, missing records return `404`, state conflicts return `409`, and unexpected errors generally return `500`.
- Structured domain conflicts can include an `errors` array; `Backend/middleware/security.js` preserves that array for non-500 errors routed through the global handler.
- `Backend/server.js` final error middleware logs `err.stack` and returns `{ success: false, message }`.
- `Frontend/Ecommerce-main/my-app/src/api/axios.js` logs out on `401` by calling `useAuthStore.getState().logout()`.
- UI workflows show user-facing failures through `react-hot-toast` in pages such as `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`.

## Cross-Cutting Concerns

**Logging:** Backend uses `console.log`, `console.warn`, and `console.error` in `Backend/server.js` and `Backend/config/db.js`; frontend uses `console.error` for selected failures in files such as `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`.

**Validation:** Backend performs inline request validation in controllers such as `Backend/controllers/orderController.js` and Mongoose schema validation in `Backend/models/*.js`. Frontend performs form validation in pages such as `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`.

**Authentication:** JWT authentication uses `jsonwebtoken` in `Backend/controllers/authController.js` and `Backend/middleware/auth.js`. Frontend stores the token in `Frontend/Ecommerce-main/my-app/src/store/authStore.js` and sends it through `Frontend/Ecommerce-main/my-app/src/api/axios.js`.

**Authorization:** Admin-only backend actions use `admin` middleware from `Backend/middleware/auth.js`, applied in routes such as `Backend/routes/productRoutes.js`, `Backend/routes/couponRoutes.js`, and `Backend/routes/contactRoutes.js`.

**Configuration:** Frontend configuration belongs in `Frontend/Ecommerce-main/my-app/src/config/config.js`; backend configuration is read through environment variables in `Backend/server.js`, `Backend/config/db.js`, and JWT-related files.

---

*Architecture analysis: 2026-06-08*
