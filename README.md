<!-- generated-by: gsd-doc-writer -->
# PLASHOE

PLASHOE is a split ecommerce application for sustainable footwear, with an Express/MongoDB backend API and a Vite React frontend storefront.

## Installation

This repository does not have a root package manifest. Install dependencies separately in the backend and frontend app directories.

```bash
git clone git@github.com:MohammedGhazal09/PLASHOE.git
cd PLASHOE

cd Backend
npm install

cd ../Frontend/Ecommerce-main/my-app
npm install
```

## Quick Start

1. Configure the backend runtime variables:

   Required: `MONGO_URI`, `JWT_SECRET`

   Optional: `JWT_EXPIRE`, `FRONTEND_URL`, `PORT`, `MONGO_SERVER_SELECTION_TIMEOUT_MS`

   For the local Vite frontend, set `FRONTEND_URL` to `http://localhost:5173`. The backend listens on `PORT` or `5000` by default.

2. Start the backend API:

   ```bash
   cd Backend
   npm run dev
   ```

3. Configure the frontend runtime variables:

   Common: `REACT_APP_API_URL`, `REACT_APP_MAPTILER_API_KEY`

   Optional: `REACT_APP_NAME`, `REACT_APP_DESCRIPTION`, `REACT_APP_UNSPLASH_BASE_URL`, `REACT_APP_MAP_CENTER_LAT`, `REACT_APP_MAP_CENTER_LNG`, `REACT_APP_MAP_ZOOM`, `REACT_APP_FACEBOOK_URL`, `REACT_APP_INSTAGRAM_URL`, `REACT_APP_TWITTER_URL`, `REACT_APP_PINTEREST_URL`, `REACT_APP_COMPANY_EMAIL`, `REACT_APP_COMPANY_PHONE`, `REACT_APP_COMPANY_ADDRESS`, `REACT_APP_ENABLE_GUEST_CHECKOUT`, `REACT_APP_ENABLE_WISHLIST`, `REACT_APP_ENABLE_REVIEWS`

   If unset, `REACT_APP_API_URL` defaults to `http://localhost:5000/api`.

4. Start the frontend:

   ```bash
   cd Frontend/Ecommerce-main/my-app
   npm start
   ```

## Run Commands

### Backend

Run from `Backend`.

```bash
npm start      # Start server.js
npm run dev    # Start server.js with Node watch mode
npm run seed   # Seed database data from utils/seedData.js
```

Backend automated tests use Vitest. Run them from `Backend` with `npm test` or `npm run test:watch`. To smoke test a running backend:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "message": "PLASHOE API is running"
}
```

### Frontend

Run from `Frontend/Ecommerce-main/my-app`.

```bash
npm start                    # Start the Vite dev server
npm run build                # Build production static assets
npm test                     # Run frontend Vitest tests once
npm run test:watch           # Run frontend Vitest tests in watch mode
```

## Usage Examples

### Check API Health

```bash
curl http://localhost:5000/api/health
```

Returns the backend health JSON when the Express server is running.

### Fetch Products

```bash
curl http://localhost:5000/api/products
```

Returns product data from MongoDB through `Backend/routes/productRoutes.js` and `Backend/controllers/productController.js`.

### Run the Storefront Against the Local API

```bash
cd Backend
npm run dev

cd ../Frontend/Ecommerce-main/my-app
npm start
```

Open the frontend dev server and use the public routes for `/`, `/men`, `/women`, `/collection`, `/sale`, `/cart`, `/account`, `/contact`, `/lookbook`, and `/ourstory`. Checkout and order detail routes are protected by the frontend auth guard and backend JWT middleware.

## Project Structure

```text
PLASHOE/
├── Backend/                           # Express API, routes, controllers, Mongoose models, auth middleware
└── Frontend/
    └── Ecommerce-main/
        └── my-app/                    # Vite React storefront, pages, components, API clients, Zustand stores
```

Key backend files:

- `Backend/server.js` mounts `/api/auth`, `/api/products`, `/api/cart`, `/api/orders`, `/api/coupons`, `/api/contact`, and `/api/health`.
- `Backend/config/db.js` connects Mongoose using `MONGO_URI`.
- `Backend/middleware/auth.js` verifies bearer JWTs and gates admin-only routes.
- `Backend/utils/seedData.js` seeds product, coupon, and user data.

Key frontend files:

- `Frontend/Ecommerce-main/my-app/src/App.js` defines public and protected browser routes.
- `Frontend/Ecommerce-main/my-app/src/api/axios.js` centralizes the API base URL, JSON headers, bearer token attachment, and `401` logout handling.
- `Frontend/Ecommerce-main/my-app/src/config/config.js` centralizes `REACT_APP_*` configuration.
- `Frontend/Ecommerce-main/my-app/src/store/authStore.js` and `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` persist auth and cart state with Zustand.

## API Overview

All backend API routes are mounted under `/api`.

| Area | Routes | Auth |
| --- | --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile`, `POST /auth/addresses`, `DELETE /auth/addresses/:id` | Profile and address routes require a bearer token |
| Products | `GET /products`, `GET /products/men`, `GET /products/women`, `GET /products/sale`, `GET /products/bestsellers`, `GET /products/categories`, `GET /products/:id` | Public reads; create/update/delete require admin |
| Cart | `GET /cart`, `POST /cart/items`, `PUT /cart/items/:itemId`, `DELETE /cart/items/:itemId`, `DELETE /cart`, `POST /cart/coupon`, `DELETE /cart/coupon` | Bearer token |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:id`, `PUT /orders/:id/cancel` | Bearer token |
| Coupons | `POST /coupons/validate`, `GET /coupons`, `POST /coupons`, `DELETE /coupons/:id` | Validate is public; management requires admin |
| Contact | `POST /contact`, `GET /contact`, `PUT /contact/:id/read`, `DELETE /contact/:id` | Submit is public; management requires admin |

## Testing

Frontend tests use Vitest and React Testing Library. Test setup lives in `Frontend/Ecommerce-main/my-app/src/setupTests.js`.

```bash
cd Frontend/Ecommerce-main/my-app
npm test
```

Backend automated tests are not configured in `Backend/package.json`. Use the health endpoint smoke test after starting the server.

## License

No root `LICENSE` file is present. `Backend/package.json` declares `ISC`; the frontend package is private and does not declare a separate license.
