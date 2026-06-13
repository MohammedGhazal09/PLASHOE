<!-- generated-by: gsd-doc-writer -->
# Development

PLASHOE is developed as two nested JavaScript apps: an Express/Mongoose backend in `Backend` and a Create React App storefront in `Frontend/Ecommerce-main/my-app`. There is no root package manifest, so install, run, build, and test commands are executed from the relevant app directory.

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

Recommended local loop: keep the backend on `http://localhost:5000`, point the frontend API base URL at `http://localhost:5000/api`, and run the CRA dev server from `Frontend/Ecommerce-main/my-app`.

## Build Commands

### Backend

Run from `Backend`.

| Command | Description |
| --- | --- |
| `npm start` | Starts `server.js` with Node. |
| `npm run dev` | Starts `server.js` with Node watch mode for local backend development. |
| `npm run seed` | Runs `utils/seedData.js` to clear and seed products, coupons, and an admin user in MongoDB. |
| `npm test` | Runs backend Vitest tests once. |
| `npm test -- product.test.js validation.test.js` | Runs a focused backend route/validation test target. |

The backend does not define a `lint`, `format`, or `build` script in `Backend/package.json`.

### Frontend

Run from `Frontend/Ecommerce-main/my-app`.

| Command | Description |
| --- | --- |
| `npm start` | Starts the Create React App development server. |
| `npm run build` | Builds production static assets with `react-scripts build`. |
| `npm test` | Runs the CRA/Jest test runner in watch mode. |
| `npm test -- --watchAll=false` | Runs frontend tests once, which is better for CI-style local verification. |
| `npm run eject` | Ejects the CRA configuration. Treat as one-way and avoid unless the project intentionally leaves CRA defaults. |

## Code Style

- Backend source uses ES modules because `Backend/package.json` sets `"type": "module"`. Use `import`/`export`, and include `.js` extensions on relative backend imports.
- Frontend source uses React function components, JSX files for pages/components, CRA's built-in ESLint configuration, Tailwind utility classes, Material UI theme configuration in `src/App.js`, and plain JavaScript modules.
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
└── store/          # Auth and cart Zustand stores
```

Pages should compose screens and call API/store boundaries rather than constructing raw backend requests. Product catalog pages use `useCatalogProducts`, which calls the catalog service and `productsApi.getAll(params)` before rendering `ProductGrid`; checkout and order pages use `ordersApi`; contact forms use `contactApi`; coupon validation wrappers live in `couponApi`; account flows use `useAuthStore`; cart UI uses `useCartStore`.

API calls should go through `src/api/axios.js`. The shared Axios instance sets `config.api.baseUrl`, sends JSON headers, attaches `Authorization: Bearer <token>` from `useAuthStore`, and logs the user out on `401` responses.

Use Zustand for state that crosses routes or reloads:

- `authStore.js` persists `token`, `user`, and `isAuthenticated` under `auth-storage`.
- `cartStore.js` persists cart items, coupon code, and discount under `cart-storage`.
- `cartStore.js` uses local cart items for guests and backend cart synchronization for authenticated users.
- `selectItemCount`, `selectSubtotal`, and `selectTotal` are exported selectors; prefer them over duplicating cart math inside components.

Use page-local React state for one-screen UI concerns such as filters, modal state, form fields, and selected product size. Keep catalog list loading in the service/hook boundary rather than a global Zustand store.

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
5. Run a production build after significant UI, routing, or dependency changes.

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
npm test -- --watchAll=false
npm run build
```

For backend changes:

```bash
cd Backend
npm test
```

Use focused targets while iterating, then run the broader regression commands before handoff when the change crosses backend/frontend boundaries.

## High-Risk Areas

- `Backend/utils/seedData.js` deletes existing products, coupons, and users before inserting seed data. Run it only against a database that is safe to reset.
- The seed script creates a hard-coded admin account. Change seeded credentials before using seeded data anywhere beyond local development.
- `Backend/config/db.js` logs MongoDB connection errors but does not stop the server. A running `/api/health` endpoint does not prove database-backed routes are working.
- `JWT_SECRET` is required by auth token signing and verification. Missing or inconsistent values break login, registration token creation, and protected routes.
- CORS is controlled by `FRONTEND_URL` in `Backend/server.js`, with credentials enabled. Keep the backend CORS origin aligned with the actual frontend origin.
- Admin authorization only exists where routes explicitly add `admin`. New mutation or management routes need protection reviewed route by route.
- `src/api/axios.js` imports `useAuthStore`, while `authStore.js` calls `authApi`, which uses the shared Axios instance. Be careful changing auth initialization or interceptor behavior because this coupling can create circular timing problems.
- Guest cart and authenticated cart behavior diverge. Guest items use local IDs, while authenticated items use backend cart item IDs. Test login, add, update quantity, remove, coupon, checkout, and logout flows when changing cart code.
- Product catalog fallback lives in `src/services/catalog/catalogService.js` and should trigger only on backend request failure. Valid empty backend catalog responses should stay empty.
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
- Include the exact commands run, such as `npm run build`, `npm test -- --watchAll=false`, or the backend health check.
- Note any database seeding, migrations, or manual data setup used during testing.
- For auth, cart, checkout, order, and admin-route changes, include manual smoke-test notes because automated coverage is currently minimal.
