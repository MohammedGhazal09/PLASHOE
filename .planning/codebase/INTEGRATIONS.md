# External Integrations

**Analysis Date:** 2026-06-08

## APIs & External Services

**Backend API consumed by frontend:**
- PLASHOE Express API - Frontend data access for auth, products, cart, orders, coupons, and contact messages.
  - SDK/Client: `axios` via `Frontend/Ecommerce-main/my-app/src/api/axios.js`.
  - Auth: Bearer token from `Frontend/Ecommerce-main/my-app/src/store/authStore.js`, attached in `Frontend/Ecommerce-main/my-app/src/api/axios.js`.
  - Base URL: `REACT_APP_API_URL` via `Frontend/Ecommerce-main/my-app/src/config/config.js`.
  - Backend routes: `Backend/server.js`, `Backend/routes/authRoutes.js`, `Backend/routes/productRoutes.js`, `Backend/routes/cartRoutes.js`, `Backend/routes/orderRoutes.js`, `Backend/routes/couponRoutes.js`, `Backend/routes/contactRoutes.js`.

**Maps:**
- MapTiler raster tile API - Displays the contact page map in `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx`.
  - SDK/Client: `leaflet` from `Frontend/Ecommerce-main/my-app/package.json`.
  - Auth: `REACT_APP_MAPTILER_API_KEY` via `Frontend/Ecommerce-main/my-app/src/config/config.js`.
- OpenStreetMap - Used as attribution/source with MapTiler tiles in `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx`.
  - SDK/Client: `leaflet`.
  - Auth: Not applicable.

**External images/CDN:**
- Unsplash image CDN - Customer/testimonial image URLs on the home page.
  - SDK/Client: direct image URLs built from `config.external.unsplashBase` in `Frontend/Ecommerce-main/my-app/src/pages/Home.jsx`.
  - Auth: Not detected; base URL configured with `REACT_APP_UNSPLASH_BASE_URL` in `Frontend/Ecommerce-main/my-app/src/config/config.js`.

**Social links:**
- Facebook, Instagram, Twitter/X, Pinterest - Public outbound links configured in `Frontend/Ecommerce-main/my-app/src/config/config.js`.
  - SDK/Client: Not applicable.
  - Auth: Not applicable.

## Data Storage

**Databases:**
- MongoDB-compatible database.
  - Connection: `MONGO_URI` read in `Backend/config/db.js` and `Backend/utils/seedData.js`.
  - Client: `mongoose` in `Backend/package.json`.
  - Models: `Backend/models/User.js`, `Backend/models/Product.js`, `Backend/models/Cart.js`, `Backend/models/Order.js`, `Backend/models/Coupon.js`, `Backend/models/ContactMessage.js`.
  - Transactional checkout requires a replica set or Atlas-compatible topology. Local tests use `MongoMemoryReplSet` with `wiredTiger` in `Backend/test/setup.js`.

**File Storage:**
- Local/static repository assets only.
  - Frontend product data is read from `Frontend/Ecommerce-main/my-app/public/database/database.json` by pages such as `Frontend/Ecommerce-main/my-app/src/pages/Home.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Collection.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Men.jsx`, `Frontend/Ecommerce-main/my-app/src/pages/Women.jsx`, and `Frontend/Ecommerce-main/my-app/src/pages/Sale.jsx`.
  - Static images are served from `Frontend/Ecommerce-main/my-app/public/database/**` and referenced through `process.env.PUBLIC_URL` in `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx`, `Frontend/Ecommerce-main/my-app/src/components/QuickViewModal.jsx`, and `Frontend/Ecommerce-main/my-app/src/components/CartSidebar.jsx`.
  - No S3, Cloudinary, Firebase Storage, or upload provider detected.

**Caching:**
- No server-side cache service detected.
- Browser persistence uses Zustand `persist` middleware in `Frontend/Ecommerce-main/my-app/src/store/authStore.js` and `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`.
- Cart persistence is versioned and migrated through `normalizeCartItem` in `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`.

## Authentication & Identity

**Auth Provider:**
- Custom email/password authentication.
  - Implementation: `Backend/controllers/authController.js` registers/logs in users, `Backend/models/User.js` hashes passwords with `bcryptjs`, and `Backend/middleware/auth.js` validates JWT bearer tokens with `jsonwebtoken`.
  - Token issue: `JWT_SECRET` and `JWT_EXPIRE` in `Backend/controllers/authController.js`.
  - Token verification: `JWT_SECRET` in `Backend/middleware/auth.js`.
  - Admin authorization: `admin` middleware in `Backend/middleware/auth.js` checks `req.user.isAdmin`.
  - Frontend persistence: `Frontend/Ecommerce-main/my-app/src/store/authStore.js` stores token and user state under `auth-storage`.
  - Request attachment: `Frontend/Ecommerce-main/my-app/src/api/axios.js` sends `Authorization: Bearer <token>`.

## Monitoring & Observability

**Error Tracking:**
- None detected.

**Logs:**
- Backend uses `console.log`, `console.error`, and `console.warn` in `Backend/server.js`, `Backend/config/db.js`, and `Backend/utils/seedData.js`.
- Frontend uses console logging for selected client errors, including checkout failures in `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx` and cart clearing failures in `Frontend/Ecommerce-main/my-app/src/store/cartStore.js`.

## CI/CD & Deployment

**Hosting:**
- Not detected in repository configuration.
- Backend is started with `npm start` from `Backend/package.json`.
- Frontend production assets are built with `npm run build` from `Frontend/Ecommerce-main/my-app/package.json`.

**CI Pipeline:**
- None detected; no GitHub Actions, GitLab CI, CircleCI, or similar pipeline files found during stack scan.

## Environment Configuration

**Required env vars:**
- Backend:
  - `MONGO_URI` - MongoDB connection string used by `Backend/config/db.js`.
  - `JWT_SECRET` - JWT signing and verification secret used by `Backend/controllers/authController.js` and `Backend/middleware/auth.js`.
  - `JWT_EXPIRE` - Optional token lifetime used by `Backend/controllers/authController.js`.
  - `FRONTEND_URL` - Optional CORS allowed origin used by `Backend/server.js`.
  - `PORT` - Optional backend listen port used by `Backend/server.js`.
- Frontend:
  - `REACT_APP_API_URL` - Backend API base URL used by `Frontend/Ecommerce-main/my-app/src/config/config.js`.
  - `REACT_APP_MAPTILER_API_KEY` - MapTiler key used by `Frontend/Ecommerce-main/my-app/src/config/config.js` and `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx`.
  - `REACT_APP_UNSPLASH_BASE_URL` - Optional Unsplash base URL used by `Frontend/Ecommerce-main/my-app/src/config/config.js`.
  - `REACT_APP_MAP_CENTER_LAT`, `REACT_APP_MAP_CENTER_LNG`, `REACT_APP_MAP_ZOOM` - Optional map defaults used by `Frontend/Ecommerce-main/my-app/src/config/config.js`.
  - `REACT_APP_FACEBOOK_URL`, `REACT_APP_INSTAGRAM_URL`, `REACT_APP_TWITTER_URL`, `REACT_APP_PINTEREST_URL` - Optional social links used by `Frontend/Ecommerce-main/my-app/src/config/config.js`.
  - `REACT_APP_COMPANY_EMAIL`, `REACT_APP_COMPANY_PHONE`, `REACT_APP_COMPANY_ADDRESS` - Optional company metadata used by `Frontend/Ecommerce-main/my-app/src/config/config.js`.
  - `REACT_APP_ENABLE_GUEST_CHECKOUT`, `REACT_APP_ENABLE_WISHLIST`, `REACT_APP_ENABLE_REVIEWS` - Feature flags used by `Frontend/Ecommerce-main/my-app/src/config/config.js`.

**Secrets location:**
- Local `.env` files exist at `Backend/.env` and `Frontend/Ecommerce-main/my-app/.env`; contents are not read or documented.
- Environment templates exist at `Backend/.env.example` and `Frontend/Ecommerce-main/my-app/.env.example`.

## Webhooks & Callbacks

**Incoming:**
- None detected. `Backend/server.js` exposes REST API endpoints only.

**Outgoing:**
- None detected. The app performs browser-side calls to MapTiler tile URLs in `Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx` and Unsplash image URLs in `Frontend/Ecommerce-main/my-app/src/pages/Home.jsx`, but no server-side outgoing webhook or callback integration is present.

---

*Integration audit: 2026-06-08*
