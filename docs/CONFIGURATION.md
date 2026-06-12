<!-- generated-by: gsd-doc-writer -->
# Configuration

PLASHOE is configured through environment variables in two nested apps:

- Backend: `Backend`, loaded with `dotenv` from `Backend/server.js` and `Backend/utils/seedData.js`.
- Frontend: `Frontend/Ecommerce-main/my-app`, read by Create React App through `REACT_APP_*` variables and centralized in `Frontend/Ecommerce-main/my-app/src/config/config.js`.

Do not commit real `.env` files. The checked-in `Backend/.env.example` and `Frontend/Ecommerce-main/my-app/.env.example` files are currently identical and list the frontend template values, so backend variables below are documented from backend source references.

## Environment Variables

### Backend

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `MONGO_URI` | Required for database-backed features | None | MongoDB connection string used by `Backend/config/db.js` and `Backend/utils/seedData.js`. Missing or invalid values are caught and logged, but product, user, cart, order, coupon, and contact persistence will not work correctly without a database connection. |
| `JWT_SECRET` | Required for authentication | None | Secret used to sign login/register tokens in `Backend/controllers/authController.js` and verify bearer tokens in `Backend/middleware/auth.js`. Missing values break token signing and protected-route verification. |
| `JWT_EXPIRE` | Optional | `7d` | Token lifetime passed to `jsonwebtoken.sign`. |
| `FRONTEND_URL` | Optional | `http://localhost:5173` | CORS origin allowed by the Express server. Set this to the deployed frontend origin in production. <!-- VERIFY: production FRONTEND_URL value --> |
| `PORT` | Optional | `5000` | Port used by `app.listen` in `Backend/server.js`. |

### Frontend

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `REACT_APP_API_URL` | Optional | `http://localhost:5000/api` | Backend API base URL used by frontend API calls. Set this to the deployed backend API base URL for production. <!-- VERIFY: production REACT_APP_API_URL value --> |
| `REACT_APP_NAME` | Optional | `PLASHOE` | Display name exposed through the frontend config object. |
| `REACT_APP_DESCRIPTION` | Optional | `Sustainable Footwear for a Better Tomorrow` | Display description exposed through the frontend config object. |
| `REACT_APP_UNSPLASH_BASE_URL` | Optional | `https://images.unsplash.com` | Base URL configured for Unsplash image assets. |
| `REACT_APP_MAPTILER_API_KEY` | Optional in code, required for your MapTiler account | Source fallback value | MapTiler API key used by the map configuration. Replace the source fallback with an environment-specific key before production use. <!-- VERIFY: production MapTiler API key is configured outside source control --> |
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
| `PUBLIC_URL` | Optional | Create React App default | Public asset base path used by Create React App and referenced by product image/database fetch paths. |

## Config File Format

Create one `.env` file per app root when running locally:

```bash
Backend/.env
Frontend/Ecommerce-main/my-app/.env
```

Backend `.env` format:

```bash
MONGO_URI=mongodb://localhost:27017/plashoe
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
PORT=5000
```

Frontend `.env` format:

```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=PLASHOE
REACT_APP_DESCRIPTION=Sustainable Footwear for a Better Tomorrow
REACT_APP_UNSPLASH_BASE_URL=https://images.unsplash.com
REACT_APP_MAPTILER_API_KEY=replace-with-your-maptiler-key
REACT_APP_MAP_CENTER_LAT=24.7136
REACT_APP_MAP_CENTER_LNG=46.6753
REACT_APP_MAP_ZOOM=14
REACT_APP_ENABLE_GUEST_CHECKOUT=true
REACT_APP_ENABLE_WISHLIST=false
REACT_APP_ENABLE_REVIEWS=true
```

Create React App only exposes custom browser variables that start with `REACT_APP_`. Restart the frontend dev server after changing `.env` values.

## Required vs Optional Settings

No source-level startup validation is present for missing environment variables.

- `MONGO_URI` is needed for database-backed backend features. `connectDB()` catches connection errors and allows the Express process to continue, but most API features depend on MongoDB models.
- `JWT_SECRET` is needed for authentication. Register and login responses call `jwt.sign`, and protected routes call `jwt.verify`.
- `PORT`, `FRONTEND_URL`, and `JWT_EXPIRE` have runtime defaults.
- Frontend display, external URL, map, and feature-flag variables all have fallback behavior in `Frontend/Ecommerce-main/my-app/src/config/config.js`.
- Boolean feature flags are enabled only by the exact string `true`; missing values are treated as disabled.

## Defaults

| Setting | Default | Defined in |
| --- | --- | --- |
| `PORT` | `5000` | `Backend/server.js` |
| `FRONTEND_URL` | `http://localhost:5173` | `Backend/server.js` |
| `JWT_EXPIRE` | `7d` | `Backend/controllers/authController.js` |
| `REACT_APP_API_URL` | `http://localhost:5000/api` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_NAME` | `PLASHOE` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_DESCRIPTION` | `Sustainable Footwear for a Better Tomorrow` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_UNSPLASH_BASE_URL` | `https://images.unsplash.com` | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
| `REACT_APP_MAPTILER_API_KEY` | Hard-coded fallback value in source; override per environment | `Frontend/Ecommerce-main/my-app/src/config/config.js` |
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
- Production frontend: configure `REACT_APP_API_URL` and any public display, map, social, company, and feature-flag values before running `npm run build`. <!-- VERIFY: production frontend build environment is configured in the hosting platform -->
