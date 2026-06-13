<!-- generated-by: gsd-doc-writer -->
# API Reference

PLASHOE exposes a JSON HTTP API from the Express backend in `Backend/server.js`. All mounted routes use the `/api` prefix, and the frontend axios instance in `Frontend/Ecommerce-main/my-app/src/api/axios.js` is configured with `config.api.baseUrl`, which defaults to `http://localhost:5000/api` in `Frontend/Ecommerce-main/my-app/src/config/config.js`.

Every backend response includes an `X-Request-Id` response header. Clients may send a safe `X-Request-Id` value for correlation; otherwise the backend generates one. Error responses handled by the application error middleware include the same `requestId` in the JSON body so support can connect a user-visible failure to structured logs.

## Authentication

Authentication uses JWT bearer tokens. `POST /api/auth/register` and `POST /api/auth/login` return a token at `data.token`. Protected requests must include:

```http
Authorization: Bearer <token>
```

The frontend axios instance reads the token from `useAuthStore.getState().token` and attaches the `Authorization` header automatically. A `401` response triggers `useAuthStore.getState().logout()` in the frontend response interceptor.

Admin routes use the same bearer token plus the backend `admin` middleware, which requires `req.user.isAdmin` to be truthy.

## Endpoints Overview

| Method | Path | Description | Auth Required | Frontend Wrapper |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | Cheap liveness check for the backend process. It does not prove MongoDB-backed routes are ready. | No | None |
| GET | `/api/ready` | Dependency readiness check. Returns `200` when MongoDB is connected and `503` with sanitized diagnostics when not ready. | No | None |
| POST | `/api/auth/register` | Create a user and return the user profile plus JWT. | No | `authApi.register(name, email, password)` |
| POST | `/api/auth/login` | Authenticate a user and return the user profile plus JWT. | No | `authApi.login(email, password)` |
| GET | `/api/auth/me` | Return the current authenticated user document. | Bearer JWT | `authApi.getMe()` |
| PUT | `/api/auth/profile` | Update the current user's `name`, `email`, and/or `phone`. | Bearer JWT | `authApi.updateProfile(profileData)` |
| POST | `/api/auth/addresses` | Add an address to the current user. | Bearer JWT | `authApi.addAddress(address)` |
| DELETE | `/api/auth/addresses/:id` | Delete one address from the current user. | Bearer JWT | `authApi.deleteAddress(addressId)` |
| GET | `/api/products` | List products with optional filtering, sorting, and pagination. | No | `productsApi.getAll(params)` |
| GET | `/api/products/men` | List products where `gender` is `male` using the bounded product list envelope. | No | `productsApi.getMen()` |
| GET | `/api/products/women` | List products where `gender` is `female` using the bounded product list envelope. | No | `productsApi.getWomen()` |
| GET | `/api/products/sale` | List products where `isOnSale` is `true` using the bounded product list envelope. | No | `productsApi.getSale()` |
| GET | `/api/products/bestsellers` | List up to 8 products sorted by descending rating. | No | `productsApi.getBestsellers()` |
| GET | `/api/products/categories` | Return distinct product categories. | No | `productsApi.getCategories()` |
| GET | `/api/products/:id` | Return one product by MongoDB id. | No | `productsApi.getById(id)` |
| POST | `/api/products` | Create a product. | Admin bearer JWT | None |
| PUT | `/api/products/:id` | Update a product. | Admin bearer JWT | None |
| DELETE | `/api/products/:id` | Delete a product. | Admin bearer JWT | None |
| GET | `/api/cart` | Return the current user's cart, creating an empty cart if needed. | Bearer JWT | `cartApi.getCart()` |
| POST | `/api/cart/items` | Add a product and size to the current user's cart after stock validation. | Bearer JWT | `cartApi.addItem(productId, quantity, size)` |
| PUT | `/api/cart/items/:itemId` | Update a cart item quantity after stock validation. | Bearer JWT | `cartApi.updateItem(itemId, quantity)` |
| DELETE | `/api/cart/items/:itemId` | Remove one cart item. | Bearer JWT | `cartApi.removeItem(itemId)` |
| DELETE | `/api/cart` | Clear cart items and coupon data. | Bearer JWT | `cartApi.clearCart()` |
| POST | `/api/cart/coupon` | Apply a coupon to the current user's cart. | Bearer JWT | `cartApi.applyCoupon(code)` |
| DELETE | `/api/cart/coupon` | Remove coupon data from the current user's cart. | Bearer JWT | `cartApi.removeCoupon()` |
| POST | `/api/orders` | Start hosted Stripe Checkout from the current user's cart, returning an order plus payment redirect data. | Bearer JWT + `Idempotency-Key` | `ordersApi.create(orderData, idempotencyKey)` |
| GET | `/api/orders` | List the current user's orders sorted newest first. | Bearer JWT | `ordersApi.getAll()` |
| GET | `/api/orders/:id` | Return one order if owned by the user or requested by an admin. | Bearer JWT, owner or admin | `ordersApi.getById(id)` |
| PUT | `/api/orders/:id/cancel` | Cancel an owned order unless it is shipped or delivered. | Bearer JWT, owner only | `ordersApi.cancel(id)` |
| GET | `/api/admin/orders` | List all orders for admins with bounded pagination and filters. | Admin bearer JWT | `adminApi.getOrders(params)` |
| GET | `/api/admin/orders/:id` | Return full admin order detail with limited user identity. | Admin bearer JWT | `adminApi.getOrder(id)` |
| PATCH | `/api/admin/orders/:id/fulfillment` | Advance fulfillment and update carrier/tracking fields. | Admin bearer JWT | `adminApi.updateOrderFulfillment(id, payload)` |
| POST | `/api/webhooks/stripe` | Receive Stripe payment events through a raw-body signature-verified webhook. | Stripe signature | None |
| POST | `/api/coupons/validate` | Validate a coupon code and return discount details. | No | `couponApi.validate(code)` |
| GET | `/api/coupons` | List coupons with bounded admin pagination and filters. | Admin bearer JWT | `adminApi.getCoupons(params)` |
| POST | `/api/coupons` | Create a coupon. | Admin bearer JWT | None |
| DELETE | `/api/coupons/:id` | Delete a coupon. | Admin bearer JWT | None |
| POST | `/api/contact` | Submit a contact message. | No | `contactApi.submit(name, email, subject, message)` |
| GET | `/api/contact` | List contact messages with bounded admin pagination and filters. | Admin bearer JWT | `adminApi.getContactMessages(params)` |
| PUT | `/api/contact/:id/read` | Mark one contact message as read. | Admin bearer JWT | None |
| DELETE | `/api/contact/:id` | Delete one contact message. | Admin bearer JWT | None |

## Request Formats

### Operational Checks

`GET /api/health`

```json
{
  "status": "ok",
  "message": "PLASHOE API is running"
}
```

`GET /api/ready`

Ready response:

```json
{
  "status": "ready",
  "ready": true,
  "dependencies": {
    "mongodb": {
      "status": "ready",
      "state": "connected"
    }
  }
}
```

Not-ready response:

```json
{
  "status": "not_ready",
  "ready": false,
  "dependencies": {
    "mongodb": {
      "status": "not_ready",
      "state": "disconnected"
    }
  }
}
```

Readiness diagnostics are intentionally sanitized and do not expose hostnames, connection strings, secrets, tokens, passwords, raw webhook payloads, or stack traces.

### Auth

`POST /api/auth/register`

```json
{
  "name": "Jane Customer",
  "email": "jane@example.com",
  "password": "secret123"
}
```

`POST /api/auth/login`

```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

`PUT /api/auth/profile`

```json
{
  "name": "Jane Customer",
  "email": "jane@example.com",
  "phone": "+1 555 123 4567"
}
```

`POST /api/auth/addresses`

```json
{
  "firstName": "Jane",
  "lastName": "Customer",
  "company": "Example Co",
  "country": "US",
  "street": "123 Example Street",
  "apartment": "4B",
  "city": "Example City",
  "state": "CA",
  "zipCode": "90210",
  "phone": "+1 555 123 4567",
  "isDefault": true
}
```

### Products

`GET /api/products`, `GET /api/products/men`, `GET /api/products/women`, and `GET /api/products/sale` accept these query parameters. The convenience routes force their route filter after validation, so `/men` always returns male products, `/women` always returns female products, and `/sale` always returns sale products.

| Query Parameter | Description |
| --- | --- |
| `gender` | Filters by product `gender`, such as `male` or `female`. |
| `category` | Filters by product category. Model enum values are `Training`, `Running`, `Sneaker`, and `Classic`. |
| `sale` | When set to `true`, filters products where `isOnSale` is true. |
| `sort` | Supports `price-asc`, `price-desc`, `rating`, and `newest`. |
| `limit` | Maximum products returned. Defaults to `20` and is capped at `100`. |
| `page` | Page number. Defaults to `1` and must be at least `1`. |

Admin `POST /api/products` and `PUT /api/products/:id` accept product fields from the `Product` model:

```json
{
  "name": "Trail Runner",
  "gender": "male",
  "category": "Running",
  "image": "trail-runner.jpg",
  "price": {
    "original": 140,
    "current": 120
  },
  "rating": 4.5,
  "sizes": [39, 40, 41, 42, 43],
  "stock": 25,
  "isOnSale": true,
  "description": "Lightweight running shoe."
}
```

### Cart

`POST /api/cart/items`

```json
{
  "productId": "665000000000000000000001",
  "quantity": 2,
  "size": 42
}
```

`quantity` defaults to `1`. `size` is required and must be between `35` and `45`.
If the requested final quantity exceeds `Product.stock`, the API returns `409` and leaves the cart unchanged.

`PUT /api/cart/items/:itemId`

```json
{
  "quantity": 3
}
```

`quantity` must be at least `1`.
If the requested quantity exceeds `Product.stock`, the API returns `409` and leaves the cart unchanged.

`POST /api/cart/coupon`

```json
{
  "code": "SAVE10"
}
```

### Orders

`POST /api/orders`

Required headers:

```http
Authorization: Bearer <token>
Idempotency-Key: <unique-checkout-attempt-key>
```

```json
{
  "shippingAddress": {
    "firstName": "Jane",
    "lastName": "Customer",
    "company": "Example Co",
    "country": "US",
    "street": "123 Example Street",
    "apartment": "4B",
    "city": "Example City",
    "state": "CA",
    "zipCode": "90210",
    "phone": "+1 555 123 4567"
  },
  "notes": "Leave at the front desk."
}
```

Required `shippingAddress` fields are `firstName`, `lastName`, `country`, `street`, `city`, `state`, `zipCode`, and `phone`. Orders are created from the authenticated user's cart; clients do not send line items or totals.

`Idempotency-Key` is required for checkout. Generate a new high-entropy key for each new checkout attempt and reuse the same key only for retrying that exact attempt. The backend scopes the key to the authenticated user and stores a cart fingerprint on the order.

Admin `GET /api/admin/orders` requires an admin bearer token and accepts these query parameters:

| Query Parameter | Description |
| --- | --- |
| `page` | Page number. Defaults to `1` and must be at least `1`. |
| `limit` | Maximum rows returned. Defaults to `20` and is capped at `100`. |
| `status` | Filters fulfillment status: `pending`, `processing`, `shipped`, `delivered`, or `cancelled`. |
| `paymentStatus` | Filters by the documented payment status values. |
| `q` | Searches `orderNumber` plus limited user `name` and `email`. |
| `createdFrom` | Includes orders created at or after this ISO date. |
| `createdTo` | Includes orders created at or before this ISO date. |

Admin order list rows are compact operational summaries with `_id`, `orderNumber`, limited `user` identity, `status`, `paymentStatus`, `total`, `itemCount`, tracking summary fields, and timestamps. Full order items and shipping/payment details belong on `GET /api/admin/orders/:id`, which populates user `name` and `email` only.

`PATCH /api/admin/orders/:id/fulfillment`

```json
{
  "status": "shipped",
  "carrier": "DHL",
  "trackingNumber": "TRACK123",
  "estimatedDeliveryDate": "2026-06-20T00:00:00.000Z",
  "description": "Package handed to carrier",
  "location": "Warehouse"
}
```

Allowed fulfillment flow is `processing` -> `shipped` -> `delivered`. Shipping and delivery updates are accepted only when `paymentStatus` is `paid` or `not_required`. Setting `shipped` requires `carrier` and `trackingNumber`; setting `delivered` requires the order to already be `shipped` with complete shipment tracking fields. Accepted updates append one server-timestamped `trackingHistory` event and set `shippedAt` or `deliveredAt`. Repeating the same shipped update returns `200` without duplicating history; changed shipped tracking data appends one correction event.

Fulfillment conflicts return `409` with machine-readable codes:

| Code | Meaning |
| --- | --- |
| `INVALID_FULFILLMENT_TRANSITION` | The requested status skips, reverses, or leaves the supported flow. |
| `PAYMENT_NOT_SHIPPABLE` | The payment state is not `paid` or `not_required`. |
| `TRACKING_REQUIRED` | Required carrier/tracking fields are missing. |
| `ORDER_NOT_FOUND` | The requested order id does not exist. |

### Coupons

`POST /api/coupons/validate`

```json
{
  "code": "SAVE10"
}
```

Admin `POST /api/coupons`

```json
{
  "code": "SAVE10",
  "discountPercentage": 10,
  "minOrderAmount": 50,
  "maxUses": 100,
  "validFrom": "2026-01-01T00:00:00.000Z",
  "validUntil": "2026-12-31T23:59:59.000Z",
  "isActive": true
}
```

Admin `GET /api/coupons` accepts `page`, `limit`, `isActive`, `q`, `validFrom`, and `validUntil`. It keeps the existing `/api/coupons` path, requires admin bearer auth, and returns the shared admin pagination envelope.

### Contact

`POST /api/contact`

```json
{
  "name": "Jane Customer",
  "email": "jane@example.com",
  "subject": "Sizing question",
  "message": "Do these shoes fit true to size?"
}
```

`name`, `email`, and `message` are required. `subject` is optional.

Admin `GET /api/contact` accepts `page`, `limit`, `isRead`, `q`, `createdFrom`, and `createdTo`. It keeps the existing `/api/contact` path, requires admin bearer auth, and returns the shared admin pagination envelope.

## Response Formats

Most successful responses use a `success: true` envelope and return resource data in `data`:

```json
{
  "success": true,
  "data": {}
}
```

List endpoints commonly include `count`; paginated product lists also include `total`, `page`, `limit`, and `pages`:

```json
{
  "success": true,
  "count": 20,
  "total": 57,
  "page": 1,
  "limit": 20,
  "pages": 3,
  "data": []
}
```

Admin order, coupon, and contact list responses use this shared bounded pagination envelope:

```json
{
  "success": true,
  "count": 20,
  "total": 45,
  "page": 1,
  "limit": 20,
  "pages": 3,
  "data": []
}
```

Auth register/login responses return the authenticated user summary and token:

```json
{
  "success": true,
  "data": {
    "_id": "665000000000000000000001",
    "name": "Jane Customer",
    "email": "jane@example.com",
    "isAdmin": false,
    "token": "<jwt>"
  }
}
```

Cart responses return a cart document with populated `items.product` fields `name`, `image`, and `price`; cart JSON also includes virtual `subtotal` and `total` values:

```json
{
  "success": true,
  "data": {
    "user": "665000000000000000000001",
    "items": [
      {
        "product": {
          "_id": "665000000000000000000002",
          "name": "Trail Runner",
          "image": "trail-runner.jpg",
          "price": {
            "original": 140,
            "current": 120
          }
        },
        "quantity": 2,
        "size": 42,
        "priceAtAdd": 120
      }
    ],
    "couponCode": "SAVE10",
    "discount": 10,
    "subtotal": 240,
    "total": 216
  }
}
```

Order checkout-start returns status `201`, `message: "Payment started"`, and `data.order` plus `data.payment`. An exact retry with the same `Idempotency-Key` returns status `200`, `message: "Payment already started"`, the same order, and the stored pending payment URL. Missing `Idempotency-Key` returns `400`. Reusing the key for a changed non-empty cart/request state returns `409`.

The backend calculates order items, subtotal, discount, total, coupon usage, and stock decrement from the authenticated cart. Provider-backed orders start with fulfillment `status: "pending"` and payment state `payment_pending`; verified webhook success is the only path that moves fulfillment to `processing` and `paymentStatus` to `paid`. Order numbers are unique display identifiers beginning with `PLS-`; they are not strict sequences.

```json
{
  "success": true,
  "message": "Payment started",
  "data": {
    "order": {
      "orderNumber": "PLS-MJ1R67E8-4F2C9B81AA",
      "idempotencyKey": "checkout-key-123",
      "cartFingerprint": "5a6d...",
      "items": [],
      "shippingAddress": {},
      "subtotal": 240,
      "discount": 10,
      "total": 216,
      "status": "pending",
      "paymentStatus": "payment_pending"
    },
    "payment": {
      "provider": "stripe",
      "checkoutUrl": "https://checkout.stripe.example/session",
      "sessionId": "provider_session_id",
      "paymentIntentId": "provider_payment_intent_id"
    }
  }
}
```

Payment status values:

| Status | Meaning |
| --- | --- |
| `requires_payment` | A provider-backed local order exists before a provider checkout session has been attached. |
| `payment_pending` | Hosted checkout session exists and payment has not been confirmed by webhook yet. |
| `paid` | Verified provider event captured payment and moved fulfillment to `processing`. |
| `payment_failed` | Provider payment failed; inventory is restored once when it had been decremented. |
| `payment_canceled` | Hosted checkout expired or was canceled; inventory is restored once when it had been decremented. |
| `refunded` | Provider-origin full refund was received. |
| `partially_refunded` | Provider-origin partial refund was received. |
| `not_required` | Legacy/non-provider order default. |

Cart stock, checkout stock, coupon usage, and stale idempotency conflicts return `409` with a machine-readable `errors` array:

```json
{
  "success": false,
  "message": "Insufficient stock for one or more cart items",
  "errors": [
    {
      "code": "INSUFFICIENT_STOCK",
      "resource": "product",
      "productId": "665000000000000000000002",
      "cartItemId": "665000000000000000000003",
      "requested": 4,
      "available": 3
    }
  ]
}
```

Possible conflict `code` values include `INSUFFICIENT_STOCK`, `PRODUCT_UNAVAILABLE`, `COUPON_USAGE_LIMIT_REACHED`, `COUPON_UNAVAILABLE`, `COUPON_MINIMUM_NOT_MET`, `IDEMPOTENCY_KEY_CONFLICT`, `INVALID_FULFILLMENT_TRANSITION`, `PAYMENT_NOT_SHIPPABLE`, and `TRACKING_REQUIRED`.

Cancelling an owned `pending` or `processing` order restores ordered product stock once when that order was created by the checkout path and marked as inventory-decremented. Legacy or manually-created cancellable orders without the inventory marker are cancelled without changing stock. Repeating cancellation for an already cancelled order returns success without restoring stock again. Orders with `paymentStatus` of `paid`, `refunded`, or `partially_refunded` cannot be customer-cancelled. `shipped` and `delivered` orders still return `400`.

### Stripe Webhooks

`POST /api/webhooks/stripe` is public to Stripe but protected by `Stripe-Signature` verification over the raw request body. It does not use JWT auth and must be mounted before JSON parsers mutate the body.

Handled event types:

- `checkout.session.completed` and `payment_intent.succeeded`: mark the order `paid`, set `paidAt`, persist provider ids, and move fulfillment status to `processing`.
- `payment_intent.payment_failed`: mark the order `payment_failed`, store a failure reason when available, and restore inventory once.
- `checkout.session.expired`: mark the order `payment_canceled` and restore inventory once.
- `charge.refunded` and `refund.updated`: update full or partial refund state and refund amount without adding a PLASHOE admin refund initiation endpoint.

Duplicate provider event ids are successful no-ops. Invalid signatures return `400`. Events that cannot be safely reconciled to one local order return `500` so Stripe can retry, and they are not recorded as processed.

Delete and state-change responses may return only a message:

```json
{
  "success": true,
  "message": "Product deleted"
}
```

Error responses use `success: false` and a message. Application errors also include the request id that matches the `X-Request-Id` response header:

```json
{
  "success": false,
  "message": "Server Error",
  "requestId": "8f6de0a2-0d89-4c36-9138-b248f0cdb3bd"
}
```

Validator failures include an `errors` array with field-level details:

```json
{
  "success": false,
  "message": "Invalid request",
  "errors": [
    {
      "path": "email",
      "message": "Invalid email address"
    }
  ]
}
```

## Error Codes

| Status | Source | Meaning |
| --- | --- | --- |
| `400` | Zod validators, controllers, and Mongoose validation | Invalid request body/query/params, unknown write fields, duplicate user, invalid coupon, invalid cart quantity or size, empty cart, missing shipping fields, missing/invalid `Idempotency-Key`, or an order that can no longer be cancelled. |
| `401` | `protect` middleware and login controller | Missing token, failed token verification with the allowed HS256 algorithm, missing authenticated user, or invalid login credentials. |
| `403` | `admin` middleware and order ownership checks | Authenticated user is not an admin, or the user is not authorized to access the requested order. |
| `404` | Controllers | Product, cart, cart item, order, coupon, or contact message was not found. |
| `409` | Cart, checkout, and fulfillment conflict handling | Requested stock is unavailable, a cart product was deleted, coupon usage is exhausted, coupon rules changed, an idempotency key was reused for a different checkout state, or an admin fulfillment update violates payment/status/tracking rules. |
| `413` | JSON body parser | Request body exceeded the configured JSON limit and returns `Request body too large`. |
| `429` | Rate-limit middleware | The request exceeded the global or route-specific limit. |
| `500` | Controllers and global error handler | Unexpected server error; errors routed through the global handler return a generic `Server Error` message. |

## Rate Limits

The backend uses `express-rate-limit` with JSON error envelopes. In automated tests, rate limits are skipped unless a request includes the `x-rate-limit-test` header.

| Scope | Limit | Window | Response |
| --- | --- | --- | --- |
| Global `/api` | 300 requests per IP | 15 minutes | `429` with `Too many API requests, please try again later` |
| `POST /api/auth/register` | 5 requests per IP | 15 minutes | `429` with `Too many authentication attempts, please try again later` |
| `POST /api/auth/login` | 5 requests per IP | 15 minutes | `429` with `Too many authentication attempts, please try again later` |
| `POST /api/contact` | 5 requests per IP | 1 hour | `429` with `Too many contact requests, please try again later` |
| `POST /api/coupons/validate` | 30 requests per IP | 15 minutes | `429` with `Too many coupon validation requests, please try again later` |

## Request Size Limits

JSON bodies are capped before route handlers run.

| Scope | Limit |
| --- | --- |
| `/api/auth/*` | `8kb` |
| `/api/coupons/validate` | `8kb` |
| `/api/contact` | `8kb` |
| Other mounted API routes | `64kb` |

## Frontend Wrapper Mappings

The frontend wrappers are relative to the configured axios `baseURL`; with the default frontend config, `/auth/login` resolves to `http://localhost:5000/api/auth/login`.

| Wrapper File | Export | Backend Endpoint(s) |
| --- | --- | --- |
| `Frontend/Ecommerce-main/my-app/src/api/authApi.js` | `authApi` | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/profile`, `POST /api/auth/addresses`, `DELETE /api/auth/addresses/:id` |
| `Frontend/Ecommerce-main/my-app/src/api/productsApi.js` | `productsApi` | Public product read endpoints only: `GET /api/products`, `GET /api/products/:id`, `GET /api/products/men`, `GET /api/products/women`, `GET /api/products/sale`, `GET /api/products/bestsellers`, `GET /api/products/categories` |
| `Frontend/Ecommerce-main/my-app/src/api/cartApi.js` | `cartApi` | `GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/:itemId`, `DELETE /api/cart/items/:itemId`, `DELETE /api/cart`, `POST /api/cart/coupon`, `DELETE /api/cart/coupon` |
| `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js` | `ordersApi` | `POST /api/orders` with optional `Idempotency-Key`, `GET /api/orders`, `GET /api/orders/:id`, `PUT /api/orders/:id/cancel` |
| `Frontend/Ecommerce-main/my-app/src/api/contactApi.js` | `contactApi` | `POST /api/contact` |
| `Frontend/Ecommerce-main/my-app/src/api/couponApi.js` | `couponApi` | `POST /api/coupons/validate` |
| `Frontend/Ecommerce-main/my-app/src/api/adminApi.js` | `adminApi` | `GET /api/admin/orders`, `GET /api/admin/orders/:id`, `PATCH /api/admin/orders/:id/fulfillment`, `GET /api/coupons`, `GET /api/contact` |

The backend admin product create/update/delete endpoints are implemented in `Backend/routes`, but no frontend wrapper in `Frontend/Ecommerce-main/my-app/src/api` maps those product admin operations yet.
