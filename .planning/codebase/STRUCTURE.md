# Codebase Structure

**Analysis Date:** 2026-06-08

## Directory Layout

```text
PLASHOE/
├── .planning/                         # GSD planning and codebase mapping documents
│   └── codebase/                      # Generated codebase reference docs
├── Backend/                           # Express API and MongoDB persistence app
│   ├── config/                        # Database connection configuration
│   ├── controllers/                   # Request handlers and domain workflows
│   ├── middleware/                    # Express middleware for auth/authorization
│   ├── models/                        # Mongoose schemas and model behavior
│   ├── routes/                        # Express routers mounted under `/api/*`
│   ├── utils/                         # Backend utility scripts such as seeding
│   ├── package.json                   # Backend package metadata and scripts
│   ├── package-lock.json              # Backend npm lockfile
│   └── server.js                      # Backend API entry point
└── Frontend/
    └── Ecommerce-main/
        └── my-app/                    # React frontend app
            ├── public/                # Static CRA public assets and local product data/images
            │   └── database/          # Static product JSON and shoe image assets
            ├── src/                   # React source
            │   ├── api/               # Axios instance and endpoint clients
            │   ├── assets/            # Imported frontend media assets
            │   ├── components/        # Reusable React components and layout pieces
            │   ├── config/            # Frontend configuration facade
            │   ├── pages/             # Route-level React pages
            │   └── store/             # Zustand state stores
            ├── package.json           # Frontend package metadata and CRA scripts
            ├── package-lock.json      # Frontend npm lockfile
            └── tailwind.config.js     # Tailwind content/theme configuration
```

## Directory Purposes

**`.planning`:**
- Purpose: Project planning artifacts and generated codebase maps.
- Contains: Markdown reference docs under `.planning/codebase`.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`

**`Backend`:**
- Purpose: Node/Express API server for the PLASHOE ecommerce backend.
- Contains: Express entry point, route modules, controllers, auth middleware, Mongoose models, database config, seed script, package files.
- Key files: `Backend/server.js`, `Backend/package.json`, `Backend/config/db.js`

**`Backend/config`:**
- Purpose: Backend infrastructure configuration.
- Contains: MongoDB connection helper.
- Key files: `Backend/config/db.js`

**`Backend/controllers`:**
- Purpose: Implement API use cases and shape JSON responses.
- Contains: One controller file per API resource.
- Key files: `Backend/controllers/authController.js`, `Backend/controllers/productController.js`, `Backend/controllers/cartController.js`, `Backend/controllers/orderController.js`, `Backend/controllers/couponController.js`, `Backend/controllers/contactController.js`

**`Backend/middleware`:**
- Purpose: Express middleware shared by route modules.
- Contains: JWT route protection and admin authorization.
- Key files: `Backend/middleware/auth.js`

**`Backend/models`:**
- Purpose: MongoDB schema definitions and persistence behavior.
- Contains: Mongoose models for users, products, carts, orders, coupons, and contact messages.
- Key files: `Backend/models/User.js`, `Backend/models/Product.js`, `Backend/models/Cart.js`, `Backend/models/Order.js`, `Backend/models/Coupon.js`, `Backend/models/ContactMessage.js`

**`Backend/routes`:**
- Purpose: Define HTTP resource paths and attach middleware/controllers.
- Contains: Express router files named by API resource.
- Key files: `Backend/routes/authRoutes.js`, `Backend/routes/productRoutes.js`, `Backend/routes/cartRoutes.js`, `Backend/routes/orderRoutes.js`, `Backend/routes/couponRoutes.js`, `Backend/routes/contactRoutes.js`

**`Backend/utils`:**
- Purpose: Operational utility scripts for backend data.
- Contains: Seed data script.
- Key files: `Backend/utils/seedData.js`

**`Frontend/Ecommerce-main`:**
- Purpose: Wrapper directory containing the actual React app under a nested `my-app` folder.
- Contains: `Frontend/Ecommerce-main/my-app`
- Key files: `Frontend/Ecommerce-main/my-app/package.json`

**`Frontend/Ecommerce-main/my-app`:**
- Purpose: CRA-based React ecommerce frontend.
- Contains: Public assets, React source, package files, Tailwind config.
- Key files: `Frontend/Ecommerce-main/my-app/package.json`, `Frontend/Ecommerce-main/my-app/public/index.html`, `Frontend/Ecommerce-main/my-app/src/index.js`, `Frontend/Ecommerce-main/my-app/src/App.js`

**`Frontend/Ecommerce-main/my-app/public`:**
- Purpose: Static files served directly by the frontend build.
- Contains: CRA HTML shell, manifest/icons, robots file, and static product database/images.
- Key files: `Frontend/Ecommerce-main/my-app/public/index.html`, `Frontend/Ecommerce-main/my-app/public/database/database.json`

**`Frontend/Ecommerce-main/my-app/public/database`:**
- Purpose: Static local product/image dataset used by the frontend as public assets.
- Contains: Product JSON plus `Female`, `Male`, and `salesImgs` image folders.
- Key files: `Frontend/Ecommerce-main/my-app/public/database/database.json`, `Frontend/Ecommerce-main/my-app/public/database/Female/*.jpg`, `Frontend/Ecommerce-main/my-app/public/database/Male/*.jpg`, `Frontend/Ecommerce-main/my-app/public/database/salesImgs/*.jpg`

**`Frontend/Ecommerce-main/my-app/src/api`:**
- Purpose: Frontend backend integration layer.
- Contains: Shared Axios instance and resource-specific clients.
- Key files: `Frontend/Ecommerce-main/my-app/src/api/axios.js`, `Frontend/Ecommerce-main/my-app/src/api/authApi.js`, `Frontend/Ecommerce-main/my-app/src/api/productsApi.js`, `Frontend/Ecommerce-main/my-app/src/api/cartApi.js`, `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js`

**`Frontend/Ecommerce-main/my-app/src/assets`:**
- Purpose: Imported media assets bundled into React components/pages.
- Contains: Images and one audio file under `src/assets/images`.
- Key files: `Frontend/Ecommerce-main/my-app/src/assets/images/homePage.jpg`, `Frontend/Ecommerce-main/my-app/src/assets/images/site-logo.png`, `Frontend/Ecommerce-main/my-app/src/assets/images/loginCheckout.mp3`

**`Frontend/Ecommerce-main/my-app/src/components`:**
- Purpose: Reusable UI components, route guard, layout, cart sidebar, product display, and tracking widgets.
- Contains: `.jsx` component files and an index barrel.
- Key files: `Frontend/Ecommerce-main/my-app/src/components/Layout.jsx`, `Frontend/Ecommerce-main/my-app/src/components/Header.jsx`, `Frontend/Ecommerce-main/my-app/src/components/Footer.jsx`, `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx`, `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx`, `Frontend/Ecommerce-main/my-app/src/components/ProductGrid.jsx`, `Frontend/Ecommerce-main/my-app/src/components/CartSidebar.jsx`

**`Frontend/Ecommerce-main/my-app/src/config`:**
- Purpose: Frontend access point for CRA environment variables and application constants.
- Contains: Central config object.
- Key files: `Frontend/Ecommerce-main/my-app/src/config/config.js`

**`Frontend/Ecommerce-main/my-app/src/pages`:**
- Purpose: Route-level screens rendered by React Router.
- Contains: Public ecommerce pages and protected account/order/checkout pages.
- Key files: `Frontend/Ecommerce-main/my-app/src/pages/Home.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Collection.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Men.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Women.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Sale.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Cart.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Account.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/OrderDetail.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/index.js`

**`Frontend/Ecommerce-main/my-app/src/store`:**
- Purpose: Cross-route client state.
- Contains: Zustand stores with persistence and cart selectors.
- Key files: `Frontend/Ecommerce-main/my-app/src/store/authStore.js`, `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`

## Key File Locations

**Entry Points:**
- `Backend/server.js`: Backend Express API entry point.
- `Backend/utils/seedData.js`: Backend database seeding script.
- `Frontend/Ecommerce-main/my-app/src/index.js`: React bootstrap entry point.
- `Frontend/Ecommerce-main/my-app/src/App.js`: Frontend router/theme entry point.
- `Frontend/Ecommerce-main/my-app/public/index.html`: Browser HTML shell for CRA.

**Configuration:**
- `Backend/package.json`: Backend scripts and ES module setting.
- `Backend/config/db.js`: MongoDB connection setup.
- `Frontend/Ecommerce-main/my-app/package.json`: Frontend scripts and dependencies.
- `Frontend/Ecommerce-main/my-app/src/config/config.js`: Frontend environment/configuration facade.
- `Frontend/Ecommerce-main/my-app/tailwind.config.js`: Tailwind configuration.

**Core Backend Logic:**
- `Backend/routes/*.js`: Add or modify API paths here.
- `Backend/controllers/*.js`: Add or modify API behavior here.
- `Backend/models/*.js`: Add or modify persisted entities and schema behavior here.
- `Backend/middleware/auth.js`: Modify authentication and admin authorization here.

**Core Frontend Logic:**
- `Frontend/Ecommerce-main/my-app/src/App.js`: Add or modify route definitions here.
- `Frontend/Ecommerce-main/my-app/src/pages/*.jsx`: Add route-level screens here.
- `Frontend/Ecommerce-main/my-app/src/components/*.jsx`: Add reusable UI pieces here.
- `Frontend/Ecommerce-main/my-app/src/api/*.js`: Add backend endpoint clients here.
- `Frontend/Ecommerce-main/my-app/src/store/*.js`: Add shared client state here.

**Testing:**
- `Frontend/Ecommerce-main/my-app/src/App.test.js`: Existing CRA test file.
- `Frontend/Ecommerce-main/my-app/src/setupTests.js`: Jest DOM setup.
- Backend test files are not detected under `Backend`.

**Static Assets:**
- `Frontend/Ecommerce-main/my-app/src/assets/images`: Imported frontend images.
- `Frontend/Ecommerce-main/my-app/public/database`: Public static product data and images.

## Naming Conventions

**Files:**
- Backend route files use lower camel resource names plus `Routes.js`: `Backend/routes/productRoutes.js`, `Backend/routes/orderRoutes.js`.
- Backend controller files use lower camel resource names plus `Controller.js`: `Backend/controllers/cartController.js`, `Backend/controllers/authController.js`.
- Backend model files use PascalCase singular entity names: `Backend/models/User.js`, `Backend/models/Product.js`, `Backend/models/Order.js`.
- Frontend route pages use PascalCase `.jsx`: `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/OurStory.jsx`.
- Frontend shared components use PascalCase `.jsx`: `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx`, `Frontend/Ecommerce-main/my-app/src/components/ProtectedRoute.jsx`.
- Frontend stores use lower camel domain names plus `Store.js`: `Frontend/Ecommerce-main/my-app/src/store/authStore.js`, `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`.
- Frontend API clients use lower camel domain names plus `Api.js`: `Frontend/Ecommerce-main/my-app/src/api/productsApi.js`, `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js`.
- Barrel files are named `index.js`: `Frontend/Ecommerce-main/my-app/src/pages/index.js`, `Frontend/Ecommerce-main/my-app/src/components/index.js`.

**Directories:**
- Backend top-level layer directories use lowercase plural names: `Backend/controllers`, `Backend/models`, `Backend/routes`.
- Frontend source layer directories use lowercase names: `Frontend/Ecommerce-main/my-app/src/components`, `Frontend/Ecommerce-main/my-app/src/pages`, `Frontend/Ecommerce-main/my-app/src/store`.
- Static product image category folders under `public/database` use current dataset names: `Frontend/Ecommerce-main/my-app/public/database/Female`, `Frontend/Ecommerce-main/my-app/public/database/Male`, `Frontend/Ecommerce-main/my-app/public/database/salesImgs`.

## Where to Add New Code

**New Backend API Resource:**
- Model: Add a Mongoose model in `Backend/models/<Entity>.js`.
- Controller: Add request handlers in `Backend/controllers/<resource>Controller.js`.
- Routes: Add an Express router in `Backend/routes/<resource>Routes.js`.
- Server mount: Mount the router in `Backend/server.js` under `/api/<resource>`.
- Auth: Use `protect` and `admin` from `Backend/middleware/auth.js` as needed.

**New Backend Endpoint on Existing Resource:**
- Route declaration: Add path/method in the relevant `Backend/routes/*Routes.js`.
- Behavior: Add named controller export in the matching `Backend/controllers/*Controller.js`.
- Persistence changes: Update the relevant schema in `Backend/models/*.js`.

**New Frontend Page:**
- Page component: Add `Frontend/Ecommerce-main/my-app/src/pages/<PageName>.jsx`.
- Barrel export: Export it from `Frontend/Ecommerce-main/my-app/src/pages/index.js`.
- Route: Add a `<Route>` in `Frontend/Ecommerce-main/my-app/src/App.js`.
- Shared navigation: Update `Frontend/Ecommerce-main/my-app/src/components/Header.jsx` or `Footer.jsx` if the page should be navigable.

**New Frontend Component:**
- Implementation: Add `Frontend/Ecommerce-main/my-app/src/components/<ComponentName>.jsx`.
- Barrel export: Export it from `Frontend/Ecommerce-main/my-app/src/components/index.js` when it should be imported as part of the shared component set.
- Styling: Follow existing component-local JSX plus Tailwind/MUI usage from files such as `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx`.

**New Backend Integration Call from Frontend:**
- API method: Add or extend a module in `Frontend/Ecommerce-main/my-app/src/api/*.js`.
- HTTP behavior: Reuse `Frontend/Ecommerce-main/my-app/src/api/axios.js`; do not create a separate Axios instance unless a different external service requires it.
- State orchestration: Put cross-route state updates in `Frontend/Ecommerce-main/my-app/src/store/*.js`; keep one-page state in the page component.

**New Shared State:**
- Store: Add `Frontend/Ecommerce-main/my-app/src/store/<domain>Store.js`.
- Persistence: Use `zustand/middleware` `persist` only for state that must survive reloads, matching `authStore.js` and `cartStore.js`.
- Selectors: Export selector functions for computed values used by many components, matching `selectSubtotal` and `selectTotal` in `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`.

**New Static Media:**
- Imported React media: Place in `Frontend/Ecommerce-main/my-app/src/assets/images`.
- Public URL media or static product database images: Place in `Frontend/Ecommerce-main/my-app/public/database` or another explicit folder under `Frontend/Ecommerce-main/my-app/public`.

**Utilities:**
- Backend scripts: Add operational scripts under `Backend/utils`.
- Frontend helpers: Prefer a new focused folder under `Frontend/Ecommerce-main/my-app/src` only when multiple files need shared helpers; otherwise keep helper functions near the page/component that owns them.

## Special Directories

**`.planning/codebase`:**
- Purpose: Generated architecture, structure, stack, quality, and concern maps for GSD workflows.
- Generated: Yes
- Committed: Project-dependent; files are intended for orchestrator/planner consumption.

**`Backend`:**
- Purpose: Standalone backend npm package.
- Generated: No
- Committed: Yes

**`Frontend/Ecommerce-main/my-app`:**
- Purpose: Standalone frontend npm package nested inside `Frontend/Ecommerce-main`.
- Generated: No
- Committed: Yes

**`Frontend/Ecommerce-main/my-app/public/database`:**
- Purpose: Static local ecommerce dataset and product image assets.
- Generated: No
- Committed: Yes

**`Frontend/Ecommerce-main/my-app/src/assets/images`:**
- Purpose: Bundled UI images/audio imported by React source.
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-06-08*
