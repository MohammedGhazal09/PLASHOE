# Coding Conventions

**Analysis Date:** 2026-06-08

## Naming Patterns

**Files:**
- Backend modules use lower camelCase filenames grouped by responsibility: `Backend/controllers/authController.js`, `Backend/routes/productRoutes.js`, `Backend/middleware/auth.js`, `Backend/config/db.js`.
- Backend Mongoose model files use PascalCase singular entity names: `Backend/models/User.js`, `Backend/models/Product.js`, `Backend/models/Order.js`, `Backend/models/Cart.js`.
- Frontend React components and pages use PascalCase `.jsx` filenames: `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/OrderDetail.jsx`.
- Frontend API and store modules use lower camelCase `.js` filenames: `Frontend/Ecommerce-main/my-app/src/api/productsApi.js`, `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`, `Frontend/Ecommerce-main/my-app/src/store/authStore.js`.
- Barrel files are named `index.js`: `Frontend/Ecommerce-main/my-app/src/components/index.js`, `Frontend/Ecommerce-main/my-app/src/pages/index.js`.

**Functions:**
- Backend controller handlers use lower camelCase named exports: `register`, `login`, `getProducts`, `createOrder` in `Backend/controllers/authController.js`, `Backend/controllers/productController.js`, and `Backend/controllers/orderController.js`.
- Backend route middleware uses lower camelCase named exports: `protect` and `admin` in `Backend/middleware/auth.js`.
- Frontend components use PascalCase default exports: `ProductCard` in `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx`, `Cart` in `Frontend/Ecommerce-main/my-app/src/pages/Cart.jsx`, `App` in `Frontend/Ecommerce-main/my-app/src/App.js`.
- Frontend event handlers and local helpers use lower camelCase names with intent prefixes: `handleAddToCart`, `renderStars`, `getItemPrice`, `getItemDetails` in `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx` and `Frontend/Ecommerce-main/my-app/src/pages/Cart.jsx`.
- Zustand store actions use imperative lower camelCase names: `addItem`, `removeItem`, `syncCart`, `applyCoupon`, `fetchUser` in `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` and `Frontend/Ecommerce-main/my-app/src/store/authStore.js`.

**Variables:**
- Backend request data is destructured from `req.body`, `req.query`, and `req.params` close to usage: `Backend/controllers/authController.js`, `Backend/controllers/productController.js`, `Backend/controllers/orderController.js`.
- Backend response variables use entity names (`user`, `product`, `order`, `cart`) and collection plurals (`products`, `orders`, `categories`) in `Backend/controllers/productController.js` and `Backend/controllers/orderController.js`.
- Frontend hook state uses `[value, setValue]` naming: `selectedSize`/`setSelectedSize` and `isHovered`/`setIsHovered` in `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx`.
- Frontend Zustand selectors use `select` prefixes for computed state: `selectItemCount`, `selectSubtotal`, `selectTotal` in `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`.

**Types:**
- Not applicable: this codebase uses JavaScript and JSX, not TypeScript. Mongoose schema shape is defined through `new mongoose.Schema(...)` in `Backend/models/User.js` and related model files.

## Code Style

**Formatting:**
- No Prettier, Biome, or standalone formatter config detected in the repo root, `Backend`, or `Frontend/Ecommerce-main/my-app`.
- Use 2-space indentation for JavaScript and JSX to match `Backend/server.js`, `Backend/controllers/productController.js`, `Frontend/Ecommerce-main/my-app/src/App.js`, and `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`.
- Use semicolons in application code, matching `Backend/controllers/authController.js`, `Frontend/Ecommerce-main/my-app/src/App.js`, and `Frontend/Ecommerce-main/my-app/src/api/productsApi.js`.
- Prefer single quotes in backend and frontend source files: `Backend/controllers/authController.js`, `Frontend/Ecommerce-main/my-app/src/api/axios.js`, `Frontend/Ecommerce-main/my-app/src/store/authStore.js`. `Backend/server.js` uses double quotes, so new backend code should prefer the dominant single-quote style in controllers, models, routes, and middleware.
- Keep JSX class strings inline for Tailwind utility styling, as in `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx` and `Frontend/Ecommerce-main/my-app/src/pages/Cart.jsx`.

**Linting:**
- Backend has no ESLint config or lint script in `Backend/package.json`.
- Frontend uses Create React App's embedded ESLint config through `eslintConfig.extends: ["react-app", "react-app/jest"]` in `Frontend/Ecommerce-main/my-app/package.json`.
- No explicit lint command is defined; use `npm run build` in `Frontend/Ecommerce-main/my-app` for CRA compilation and lint feedback when changing frontend code.

## Import Organization

**Order:**
1. External packages first: `express`, `jsonwebtoken`, `mongoose`, `react`, `react-router-dom`, `zustand` in `Backend/routes/authRoutes.js`, `Backend/models/User.js`, and `Frontend/Ecommerce-main/my-app/src/App.js`.
2. Internal modules next: controllers, middleware, API modules, stores, components, and pages in `Backend/server.js`, `Frontend/Ecommerce-main/my-app/src/api/axios.js`, and `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx`.
3. Side-effect styles last in React entry and app files: `Frontend/Ecommerce-main/my-app/src/index.js` imports `./index.css`, and `Frontend/Ecommerce-main/my-app/src/App.js` imports `./App.css`.

**Path Aliases:**
- No JavaScript path aliases detected. Use relative imports such as `../models/User.js`, `../api/cartApi`, `./components/Layout`, and `./pages` in `Backend/middleware/auth.js`, `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`, and `Frontend/Ecommerce-main/my-app/src/App.js`.

## Error Handling

**Patterns:**
- Backend async controllers wrap database work in `try`/`catch` and return JSON responses shaped as `{ success: false, message: error.message }`: `Backend/controllers/authController.js`, `Backend/controllers/productController.js`, `Backend/controllers/orderController.js`.
- Backend missing-resource and authorization failures return early with appropriate status codes before normal success responses: `Backend/controllers/productController.js`, `Backend/controllers/orderController.js`, `Backend/middleware/auth.js`.
- Backend global Express error handling exists at the end of `Backend/server.js`, but most controller errors are handled locally instead of calling `next(error)`.
- Frontend axios response errors are passed through with `Promise.reject(error)` and 401 responses trigger logout in `Frontend/Ecommerce-main/my-app/src/api/axios.js`.
- Frontend stores catch API errors, persist a user-facing `error` string, clear `isLoading`, and return `{ success: false, message }` from actions in `Frontend/Ecommerce-main/my-app/src/store/authStore.js` and `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`.
- Frontend pages that load product lists fall back to local/public JSON data after API failure: `Frontend/Ecommerce-main/my-app/src/pages/Home.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Men.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Women.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Sale.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Collection.jsx`.

## Logging

**Framework:** console

**Patterns:**
- Backend startup and database connection status use `console.log`, `console.error`, and `console.warn` in `Backend/server.js` and `Backend/config/db.js`.
- Backend seed scripts use console output and process exits in `Backend/utils/seedData.js`.
- Frontend logging is limited to exceptional flow diagnostics in catch blocks, such as `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Account.jsx`, and `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`.
- User-facing frontend failures should use returned action messages or toast notifications, following `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx` and `Frontend/Ecommerce-main/my-app/src/store/authStore.js`.

## Comments

**When to Comment:**
- Backend controllers use route metadata comments with `@desc` and `@route`; use this pattern for new route handlers in `Backend/controllers/authController.js`, `Backend/controllers/productController.js`, and `Backend/controllers/orderController.js`.
- Backend middleware/model comments briefly describe lifecycle behavior or authorization purpose: `Backend/middleware/auth.js`, `Backend/models/User.js`.
- Frontend comments are used sparingly to label non-obvious logic such as cart compatibility helpers, API interceptors, and store action groups in `Frontend/Ecommerce-main/my-app/src/pages/Cart.jsx`, `Frontend/Ecommerce-main/my-app/src/api/axios.js`, and `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`.

**JSDoc/TSDoc:**
- Full JSDoc/TSDoc blocks are not used. Keep comments concise and localized unless documenting route metadata in backend controllers.

## Function Design

**Size:** Backend controller functions are medium-sized and own request validation, model calls, and response formatting in one handler, as in `Backend/controllers/orderController.js`. Frontend components may contain local rendering helpers and event handlers beside JSX, as in `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx` and `Frontend/Ecommerce-main/my-app/src/pages/Cart.jsx`.

**Parameters:** Backend handlers use Express `(req, res)` or `(req, res, next)` signatures in `Backend/controllers/authController.js` and `Backend/middleware/auth.js`. Frontend components accept a single props object via destructuring, as in `ProductCard({ product, onQuickView })` in `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx`.

**Return Values:** Backend controllers return Express responses with `success`, optional `message`, `data`, and count/pagination fields in `Backend/controllers/productController.js` and `Backend/controllers/orderController.js`. Frontend API wrappers return unwrapped `data` from axios responses in `Frontend/Ecommerce-main/my-app/src/api/productsApi.js`; store actions return `{ success: true }` or `{ success: false, message }` for UI handling in `Frontend/Ecommerce-main/my-app/src/store/authStore.js`.

## Module Design

**Exports:** Backend controllers, middleware, and config helpers use named exports or default exports by module responsibility: named controller exports in `Backend/controllers/authController.js`, named middleware exports in `Backend/middleware/auth.js`, default model exports in `Backend/models/User.js`, and default route exports in `Backend/routes/authRoutes.js`. Frontend components use default exports, while stores and API client objects use named exports in `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` and `Frontend/Ecommerce-main/my-app/src/api/productsApi.js`.

**Barrel Files:** Frontend uses barrel files for components and pages. Add new shared components to `Frontend/Ecommerce-main/my-app/src/components/index.js` and new pages to `Frontend/Ecommerce-main/my-app/src/pages/index.js` when they need grouped imports from `Frontend/Ecommerce-main/my-app/src/App.js`.

---

*Convention analysis: 2026-06-08*
