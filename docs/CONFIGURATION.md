<!-- generated-by: gsd-doc-writer -->
# Configuration

PLASHOE is configured through environment variables in two nested apps:

- Backend: `Backend`, loaded with `dotenv` from `Backend/server.js` and `Backend/utils/seedData.js`.
- Frontend: `Frontend/Ecommerce-main/my-app`, read by Vite through `REACT_APP_*` variables and centralized in `Frontend/Ecommerce-main/my-app/src/config/config.js`.

Do not commit real `.env` files. The checked-in `Backend/.env.example` and `Frontend/Ecommerce-main/my-app/.env.example` files are app-specific templates: backend secrets and runtime values belong only in the backend template, and public browser build-time values belong only in the frontend template.

## Environment Variables

### Backend

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `MONGO_URI` | Required | None | MongoDB connection string used by `Backend/config/db.js` and `Backend/utils/seedData.js`. `Backend/server.js` validates this before connecting to MongoDB or opening the listener. |
| `JWT_SECRET` | Required | None | Secret used to sign login/register tokens in `Backend/controllers/authController.js` and verify bearer tokens in `Backend/middleware/auth.js`. Startup validation requires at least 32 characters. |
| `JWT_EXPIRE` | Optional | `1h` | Token lifetime passed to `jsonwebtoken.sign`. Values must match a `jsonwebtoken` duration such as `30m`, `1h`, or `2h`. |
| `FRONTEND_URL` | Required | None | CORS origin allowed by the Express server. Startup validation requires a valid `http` or `https` URL. <!-- VERIFY: production FRONTEND_URL value --> |
| `PORT` | Optional | `5000` | Port used by `app.listen` in `Backend/server.js`. Startup validation requires a positive integer from `1` to `65535` when set. |
| `PAYMENTS_ENABLED` | Optional | Enabled outside tests; disabled by default in tests | Enables Stripe-backed checkout unless set exactly to `false`. When enabled, the Stripe and payment return URL variables below are required. |
| `STRIPE_SECRET_KEY` | Required when payments enabled | None | Backend-only Stripe API secret used by `Backend/services/paymentProvider.js`. Do not expose this in frontend config. |
| `STRIPE_WEBHOOK_SECRET` | Required when payments enabled | None | Stripe webhook endpoint signing secret used to verify `POST /api/webhooks/stripe`. |
| `PAYMENT_SUCCESS_URL` | Required when payments enabled | None | Frontend return URL for successful hosted checkout redirects, usually `/checkout/success`. Must be `http` or `https`. |
| `PAYMENT_CANCEL_URL` | Required when payments enabled | None | Frontend return URL for canceled hosted checkout redirects, usually `/checkout/cancel`. Must be `http` or `https`. |

### Frontend

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `REACT_APP_API_URL` | Optional | `http://localhost:5000/api` | Backend API base URL used by frontend API calls. Set this to the deployed staging or production backend `/api` base URL before running the static build. Because Vite embeds this at build time, rebuild after changing it. <!-- VERIFY: production REACT_APP_API_URL value --> |
| `REACT_APP_NAME` | Optional | `PLASHOE` | Display name exposed through the frontend config object. |
| `REACT_APP_DESCRIPTION` | Optional | `Sustainable Footwear for a Better Tomorrow` | Display description exposed through the frontend config object. |
| `REACT_APP_UNSPLASH_BASE_URL` | Optional | `https://images.unsplash.com` | Base URL configured for Unsplash image assets. |
| `REACT_APP_MAPTILER_API_KEY` | Optional in code, required for MapTiler tiles | Empty string | Public browser key used by the contact map. When missing, the contact page falls back to OpenStreetMap tiles. For production MapTiler usage, provide a domain-restricted public key at build time. <!-- VERIFY: production MapTiler API key is configured outside source control --> |
| `REACT_APP_MAP_CENTER_LAT` | Optional | `24.7136` | Default map center latitude, parsed with `parseFloat`. |
| `REACT_APP_MAP_CENTER_LNG` | Optional | `46.6753` | Default map center longitude, parsed with `parseFloat`. |
| `REACT_APP_MAP_ZOOM` | Optional | `14` | Default map zoom level, parsed with `parseInt`. |
| `REACT_APP_FACEBOOK_URL` | Optional | `https://facebook.com/plashoe` | Facebook URL exposed through the frontend config object. <!-- VERIFY: public Facebook URL is owned and current --> |
| `REACT_APP_INSTAGRAM_URL` | Optional | `https://instagram.com/plashoe` | Instagram URL exposed through the frontend config object. <!-- VERIFY: public Instagram URL is owned and current --> |
| `REACT_APP_TWITTER_URL` | Optional | `https://twitter.com/plashoe` | Twitter/X URL exposed through the frontend config object. <!-- VERIFY: public Twitter/X URL is owned and current --> |
| `REACT_APP_PINTEREST_URL` | Optional | `https://pinterest.com/plashoe` | Pinterest URL exposed through the frontend config object. <!-- VERIFY: public Pinterest URL is owned and current --> |
| `REACT_APP_COMPANY_EMAIL` | Optional | `info@plashoe.com` | Company contact email shown by the frontend. <!-- VERIFY: public company email is valid --> |
| `REACT_APP_COMPANY_PHONE` | Optional | `+1 (555) 123-4567` | Company contact phone shown by the frontend. <!-- VERIFY: public company phone is valid --> |
| `REACT_APP_COMPANY_ADDRESS` | Optional | `123 Eco Street, Green City, CA 90210` | Company contact address shown by the frontend. <!-- VERIFY: public company address is valid --> |
| `REACT_APP_ENABLE_GUEST_CHECKOUT` | Optional | `false` when unset | Enables guest checkout only when the value is exactly `true`. |
| `REACT_APP_ENABLE_WISHLIST` | Optional | `false` when unset | Enables wishlist functionality only when the value is exactly `true`. |
| `REACT_APP_ENABLE_REVIEWS` | Optional | `false` when unset | Enables reviews only when the value is exactly `true`. |

## Config File Format

Create one `.env` file per app root when running locally:

```bash
Backend/.env
Frontend/Ecommerce-main/my-app/.env
```

Backend `.env` format:

```bash
MONGO_URI=<mongodb-connection-string>
JWT_SECRET=<32-plus-character-random-secret>
JWT_EXPIRE=1h
FRONTEND_URL=http://localhost:5173
PORT=5000
PAYMENTS_ENABLED=false
STRIPE_SECRET_KEY=<stripe-secret-key-from-dashboard>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-signing-secret>
PAYMENT_SUCCESS_URL=http://localhost:5173/checkout/success
PAYMENT_CANCEL_URL=http://localhost:5173/checkout/cancel
```

Frontend `.env` format:

```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=PLASHOE
REACT_APP_DESCRIPTION=Sustainable Footwear for a Better Tomorrow
REACT_APP_UNSPLASH_BASE_URL=https://images.unsplash.com
REACT_APP_MAPTILER_API_KEY=<public-maptiler-browser-key>
REACT_APP_MAP_CENTER_LAT=24.7136
REACT_APP_MAP_CENTER_LNG=46.6753
REACT_APP_MAP_ZOOM=14
REACT_APP_ENABLE_GUEST_CHECKOUT=true
REACT_APP_ENABLE_WISHLIST=false
REACT_APP_ENABLE_REVIEWS=true
```

This Vite app is configured to expose custom browser variables that start with `REACT_APP_`. Restart the frontend dev server after changing local `.env` values, and rebuild hosted staging or production bundles after changing deployment `REACT_APP_*` values. Static public assets are resolved through Vite's base URL behavior.

## Required vs Optional Settings

- Backend startup validation is implemented in `Backend/config/env.js` and is called from `Backend/server.js` before `connectDB()` and `app.listen(...)`.
- `MONGO_URI`, `JWT_SECRET`, and `FRONTEND_URL` are required for backend startup.
- Template placeholders such as `<mongodb-connection-string>` and `<32-plus-character-random-secret>` are rejected outside tests. Replace all placeholder values before running a hosted environment.
- `PAYMENTS_ENABLED` defaults to enabled outside tests when unset. The local template sets it to `false` so developers can start without Stripe setup; set it to `true` only after adding real Stripe secrets and return URLs.
- When payments are enabled, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYMENT_SUCCESS_URL`, and `PAYMENT_CANCEL_URL` are required and validated at startup.
- `JWT_SECRET` must be at least 32 characters, JWT verification allows HS256 only, and the default token lifetime is `1h`.
- `PORT` and `JWT_EXPIRE` are optional but validated when present.
- Frontend display, external URL, map, and feature-flag variables have fallback behavior in `Frontend/Ecommerce-main/my-app/src/config/config.js`. Checked-in social/contact/company defaults are examples for local and staging verification unless the business owner explicitly approves them as final public values.
- Auth persistence uses browser `sessionStorage` through the `auth-storage` Zustand key. Bearer tokens remain XSS-sensitive while the tab/session is alive; the current compensating controls are the shorter JWT lifetime, logout-on-401 behavior, and no localStorage persistence.
- `REACT_APP_MAPTILER_API_KEY` is browser-visible and must be treated as a public, domain-restricted key, not a server secret.
- Boolean feature flags are enabled only by the exact string `true`; missing values are treated as disabled.

## Defaults

| Setting | Default | Defined in |
| --- | --- | --- |
| `PORT` | `5000` | `Backend/config/env.js` |
| `FRONTEND_URL` | Required for startup | `Backend/config/env.js` |
| `JWT_EXPIRE` | `1h` | `Backend/config/security.js` |
| `REACT_APP_API_URL` | `http://localhost:5000/api` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_NAME` | `PLASHOE` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_DESCRIPTION` | `Sustainable Footwear for a Better Tomorrow` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_UNSPLASH_BASE_URL` | `https://images.unsplash.com` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_MAPTILER_API_KEY` | Empty string; contact map falls back to OpenStreetMap tiles | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_MAP_CENTER_LAT` | `24.7136` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_MAP_CENTER_LNG` | `46.6753` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_MAP_ZOOM` | `14` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_FACEBOOK_URL` | `https://facebook.com/plashoe` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_INSTAGRAM_URL` | `https://instagram.com/plashoe` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_TWITTER_URL` | `https://twitter.com/plashoe` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_PINTEREST_URL` | `https://pinterest.com/plashoe` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_COMPANY_EMAIL` | `info@plashoe.com` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_COMPANY_PHONE` | `+1 (555) 123-4567` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_COMPANY_ADDRESS` | `123 Eco Street, Green City, CA 90210` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_ENABLE_GUEST_CHECKOUT` | `false` when unset | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_ENABLE_WISHLIST` | `false` when unset | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_ENABLE_REVIEWS` | `false` when unset | `Frontend/Ecommerce-main/my-app/src/config/config.js` |

## Per-Environment Overrides

No `.env.development`, `.env.production`, or `.env.test` files are checked in. Use deployment platform environment settings or local ignored `.env` files per app root:

- Local backend: `Backend/.env`
- Local frontend: `Frontend/Ecommerce-main/my-app/.env`
- Production backend: configure `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `FRONTEND_URL`, and `PORT` in the backend host secret/config manager. <!-- VERIFY: production backend environment is configured in the hosting platform -->
- Production payment setup: configure backend-only Stripe secret variables and public frontend return URLs in the backend host secret/config manager. Create a Stripe webhook endpoint that points to `/api/webhooks/stripe`. <!-- VERIFY: production Stripe endpoint and return URLs are configured -->
- Staging frontend: configure `REACT_APP_API_URL` to the staging backend `/api` base URL and mark any public social/contact/company placeholders as staging-only before running `npm run build`.
- Production frontend: configure `REACT_APP_API_URL` and any public display, map, social, company, and feature-flag values before running `npm run build`. If MapTiler tiles are used, set `REACT_APP_MAPTILER_API_KEY` to a domain-restricted public key. <!-- VERIFY: production frontend build environment is configured in the hosting platform -->

For release preparation and smoke checks, follow [DEPLOYMENT.md](DEPLOYMENT.md).
