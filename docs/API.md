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
| GET | `/api/products/:id/related` | Return deterministic self-excluding related products for a product. | No | `productsApi.getRelated(id, params)` |
| GET | `/api/recommendations` | Return bounded explainable product recommendations using catalog rules. | No | `recommendationsApi.getRecommendations(params)` |
| GET | `/api/lookbook` | Return active shoppable lookbook scenes with populated product tags and bundle items. | No | `lookbookApi.getEntries()` |
| GET | `/api/products/:id/reviews` | Return approved reviews and rating/fit summary for a product. | No | `reviewsApi.getReviews(productId, params)` |
| POST | `/api/products/:id/reviews` | Create a verified-purchase review for the current user and product. | Bearer JWT | `reviewsApi.createReview(productId, payload)` |
| POST | `/api/products` | Create a product. | Admin bearer JWT | `adminApi.createProduct(payload)` |
| PUT | `/api/products/:id` | Update a product. | Admin bearer JWT | `adminApi.updateProduct(id, payload)` |
| DELETE | `/api/products/:id` | Delete a product. | Admin bearer JWT | `adminApi.deleteProduct(id)` |
| GET | `/api/admin/lookbook` | List draft and active lookbook entries for admins. | Admin bearer JWT | `adminApi.getLookbookEntries()` |
| POST | `/api/admin/lookbook` | Create a lookbook entry. | Admin bearer JWT | `adminApi.createLookbookEntry(payload)` |
| PUT | `/api/admin/lookbook/:id` | Update a lookbook entry. | Admin bearer JWT | `adminApi.updateLookbookEntry(id, payload)` |
| DELETE | `/api/admin/lookbook/:id` | Delete a lookbook entry. | Admin bearer JWT | `adminApi.deleteLookbookEntry(id)` |
| GET | `/api/cart` | Return the current user's cart, creating an empty cart if needed. | Bearer JWT | `cartApi.getCart()` |
| POST | `/api/cart/merge` | Merge backend-syncable guest cart items into the authenticated cart before checkout. | Bearer JWT | `cartApi.mergeItems(items)` |
| POST | `/api/cart/items` | Add a product and size to the current user's cart after stock validation. | Bearer JWT | `cartApi.addItem(productId, quantity, size)` |
| PUT | `/api/cart/items/:itemId` | Update a cart item quantity after stock validation. | Bearer JWT | `cartApi.updateItem(itemId, quantity)` |
| DELETE | `/api/cart/items/:itemId` | Remove one cart item. | Bearer JWT | `cartApi.removeItem(itemId)` |
| DELETE | `/api/cart` | Clear cart items and coupon data. | Bearer JWT | `cartApi.clearCart()` |
| POST | `/api/cart/coupon` | Apply a coupon to the current user's cart. | Bearer JWT | `cartApi.applyCoupon(code)` |
| DELETE | `/api/cart/coupon` | Remove coupon data from the current user's cart. | Bearer JWT | `cartApi.removeCoupon()` |
| GET | `/api/wishlist` | Return the current user's saved products with bounded pagination and populated product summaries. | Bearer JWT | `wishlistApi.getWishlist(params)` |
| POST | `/api/wishlist/items` | Save a product to the current user's wishlist. Duplicate saves are idempotent. | Bearer JWT | `wishlistApi.addItem(productId)` |
| DELETE | `/api/wishlist/items/:productId` | Remove a saved product from the current user's wishlist. Missing saved items are treated as no-ops. | Bearer JWT | `wishlistApi.removeItem(productId)` |
| POST | `/api/orders` | Start hosted Stripe Checkout from the current user's cart, returning an order plus payment redirect data. | Bearer JWT + `Idempotency-Key` | `ordersApi.create(orderData, idempotencyKey)` |
| GET | `/api/orders` | List the current user's orders sorted newest first. | Bearer JWT | `ordersApi.getAll()` |
| GET | `/api/orders/:id` | Return one order if owned by the user or requested by an admin. | Bearer JWT, owner or admin | `ordersApi.getById(id)` |
| POST | `/api/orders/:id/reorder` | Move currently available items from a prior order into the current user's cart. | Bearer JWT, owner only | `ordersApi.reorder(id)` |
| PUT | `/api/orders/:id/cancel` | Cancel an owned order unless it is shipped or delivered. | Bearer JWT, owner only | `ordersApi.cancel(id)` |
| POST | `/api/orders/:id/payment/mock` | Record a mock sandbox payment outcome: `approve`, `decline`, or `cancel`. | Bearer JWT, owner only, mock provider order | `ordersApi.completeMockPayment(id, outcome)` |
| GET | `/api/admin/orders` | List all orders for admins with bounded pagination and filters. | Admin bearer JWT | `adminApi.getOrders(params)` |
| GET | `/api/admin/orders/:id` | Return full admin order detail with limited user identity. | Admin bearer JWT | `adminApi.getOrder(id)` |
| PATCH | `/api/admin/orders/:id/fulfillment` | Advance fulfillment and update carrier/tracking fields. | Admin bearer JWT | `adminApi.updateOrderFulfillment(id, payload)` |
| POST | `/api/returns` | Submit a return or exchange request for an eligible delivered order. | Bearer JWT, owner only | `returnsApi.create(payload)` |
| GET | `/api/returns` | List the current user's return/exchange requests, optionally by `orderId` or `status`. | Bearer JWT | `returnsApi.getMine(params)` |
| GET | `/api/returns/:id` | Return one owned return/exchange request. | Bearer JWT, owner or admin | `returnsApi.getById(id)` |
| GET | `/api/admin/returns` | List return/exchange requests for admins with bounded pagination and filters. | Admin bearer JWT | `adminApi.getReturns(params)` |
| GET | `/api/admin/returns/:id` | Return full admin return/exchange request detail. | Admin bearer JWT | `adminApi.getReturn(id)` |
| PATCH | `/api/admin/returns/:id/status` | Approve, reject, receive, or resolve a return/exchange request with notes. | Admin bearer JWT | `adminApi.updateReturnStatus(id, payload)` |
| POST | `/api/back-in-stock` | Capture explicit opt-in intent for an unavailable product and size. | No | `backInStockApi.createRequest(payload)` |
| POST | `/api/webhooks/stripe` | Receive Stripe payment events through a raw-body signature-verified webhook. | Stripe signature | None |
| POST | `/api/coupons/validate` | Validate a coupon code and return discount details. | No | `couponApi.validate(code)` |
| GET | `/api/coupons` | List coupons with bounded admin pagination and filters. | Admin bearer JWT | `adminApi.getCoupons(params)` |
| POST | `/api/coupons` | Create a coupon. | Admin bearer JWT | `adminApi.createCoupon(payload)` |
| DELETE | `/api/coupons/:id` | Delete a coupon. | Admin bearer JWT | `adminApi.deleteCoupon(id)` |
| POST | `/api/contact` | Submit a contact message. | No | `contactApi.submit(name, email, subject, message)` |
| GET | `/api/contact` | List contact messages with bounded admin pagination and filters. | Admin bearer JWT | `adminApi.getContactMessages(params)` |
| PUT | `/api/contact/:id/read` | Mark one contact message as read. | Admin bearer JWT | `adminApi.markContactMessageRead(id)` |
| DELETE | `/api/contact/:id` | Delete one contact message. | Admin bearer JWT | `adminApi.deleteContactMessage(id)` |

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
| `q` | Bounded full-text product search across product `name`, `category`, and `description`. Trimmed, 1-80 characters. |
| `gender` | Filters by product `gender`, such as `male` or `female`. |
| `category` | Filters by product category. Model enum values are `Training`, `Running`, `Sneaker`, and `Classic`. |
| `sale` | When set to `true`, filters products where `isOnSale` is true. |
| `size` | Filters products whose `sizes` array contains the requested EU size from `35` through `45`. |
| `minPrice` | Filters products where `price.current` is greater than or equal to this non-negative value. |
| `maxPrice` | Filters products where `price.current` is less than or equal to this non-negative value. Must be greater than or equal to `minPrice` when both are present. |
| `minRating` | Filters products whose `rating` is greater than or equal to this value from `0` through `5`. |
| `sort` | Supports `price-asc`, `price-desc`, `rating`, and `newest`. |
| `limit` | Maximum products returned. Defaults to `20` and is capped at `100`. |
| `page` | Page number. Defaults to `1` and must be at least `1`. |

Product search uses the `product_text_search` MongoDB text index and the API always applies bounded pagination. The product schema also declares indexes for gender/category, sale, size, price, rating, and created date filters used by the catalog routes.

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
  "description": "Lightweight running shoe.",
  "gallery": ["trail-runner.jpg", "trail-runner-side.jpg"],
  "materials": [
    { "label": "Upper", "value": "Recycled knit textile" },
    { "label": "Outsole", "value": "Rubber traction sole" }
  ],
  "careInstructions": ["Brush off dry dirt.", "Spot clean with mild soap."],
  "fitGuide": {
    "summary": "Runs true to size for most shoppers.",
    "sizeNote": "Choose your usual EU size.",
    "width": "Standard width",
    "archSupport": "Medium support"
  },
  "sustainability": {
    "summary": "Upper material includes supplier-documented recycled textile.",
    "source": "Supplier material declaration",
    "impactMetrics": [
      {
        "label": "Recycled upper textile",
        "value": "Documented",
        "source": "Supplier material declaration"
      }
    ],
    "certifications": [
      {
        "name": "Material declaration",
        "issuer": "PLASHOE supplier compliance",
        "url": "https://example.test/material-declaration"
      }
    ],
    "manufacturing": {
      "location": "Portugal",
      "facility": "Partner workshop",
      "process": "Cut, stitch, and finish.",
      "source": "Supplier onboarding record"
    },
    "durability": {
      "summary": "Care-tested for everyday city wear.",
      "repairability": "Replaceable laces.",
      "expectedUse": "Everyday walking when cleaned as instructed.",
      "source": "PLASHOE care standard"
    }
  }
}
```

Sustainability fields are optional, but displayed environmental or durability claims must be source-backed: `sustainability.summary` requires `sustainability.source`, every `impactMetrics` entry requires `source`, and manufacturing or durability detail groups require their own `source` when populated. Product detail UI falls back to conservative copy when these fields are absent.

`GET /api/products/:id/related` accepts `limit`, which defaults to `4` and is capped at `8`. Results exclude the source product and prefer same gender/category, then same category, then highest-rated/newest fallback products.

`GET /api/recommendations` accepts:

| Query Parameter | Description |
| --- | --- |
| `productId` | Optional source product id. When present, recommendations explain whether they match the same gender/category, same category, or top-rated fallback rule. |
| `limit` | Maximum recommendations returned. Defaults to `4` and is capped at `8`. |

Recommendation responses use the normal product shape plus `recommendationReason`. The endpoint only returns in-stock products and does not use shopper tracking or cross-session behavior data.

### Lookbook

`GET /api/lookbook` returns active entries sorted by `sortOrder` and creation date. Each entry contains scene metadata, hotspot coordinates, populated product summaries, and an optional bundle.

Admin create/update payload:

```json
{
  "title": "City Commute",
  "description": "Tagged commute scene",
  "image": "/images/lookbook-city.jpg",
  "status": "active",
  "sortOrder": 1,
  "hotspots": [
    {
      "productId": "665000000000000000000001",
      "x": 35,
      "y": 62,
      "label": "Daily runner"
    }
  ],
  "bundle": {
    "title": "Commute Set",
    "description": "Build the full look.",
    "items": [
      {
        "productId": "665000000000000000000001",
        "defaultSize": 42,
        "quantity": 1
      }
    ]
  }
}
```

Hotspot coordinates are percentages from `0` through `100`. Admin writes reject missing product references, so storefront scenes do not silently point at deleted products. Bundle add-to-cart is handled by the frontend cart store against current product size/stock data; there is no separate bundle discount or pricing endpoint in this phase.

### Product Reviews

`GET /api/products/:id/reviews` accepts bounded pagination parameters:

| Query Parameter | Description |
| --- | --- |
| `page` | Page number. Defaults to `1` and must be at least `1`. |
| `limit` | Maximum approved reviews returned. Defaults to `20` and is capped at `100`. |

`POST /api/products/:id/reviews`

```json
{
  "rating": 5,
  "title": "Great fit",
  "comment": "Comfortable all day and true to size.",
  "fit": "true_to_size"
}
```

Review submission requires bearer auth and a verified purchase: the current user must own a non-cancelled order containing the product with `paymentStatus` of `paid` or `not_required`. One review per user/product is allowed; duplicates return `409`. Review fields are strict, length-bounded plain text. `fit` is optional and may be `runs_small`, `true_to_size`, or `runs_large`.

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

`POST /api/cart/merge`

```json
{
  "items": [
    {
      "productId": "665000000000000000000001",
      "quantity": 2,
      "size": 42
    }
  ]
}
```

Checkout is account-required. Guest cart items stay local until sign-in/register, then the frontend sends backend-syncable MongoDB product ids to this protected merge endpoint. The backend aggregates duplicate product/size lines, adds them to existing authenticated cart lines, validates the final quantity against current stock, ignores guest-supplied prices, and uses current product prices for new backend cart lines. Product or stock conflicts return `409` with machine-readable errors and leave the backend cart unchanged.

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

### Wishlist

`GET /api/wishlist` accepts bounded pagination parameters:

| Query Parameter | Description |
| --- | --- |
| `page` | Page number. Defaults to `1` and must be at least `1`. |
| `limit` | Maximum saved products returned. Defaults to `20` and is capped at `100`. |

`POST /api/wishlist/items`

```json
{
  "productId": "665000000000000000000001"
}
```

`productId` must be a valid MongoDB ObjectId and must reference an existing product. Saving the same product more than once returns the current wishlist without duplicating the item.

`DELETE /api/wishlist/items/:productId` removes the saved product when present. Removing a product that is not saved still returns the current wishlist, so the frontend can treat repeated remove actions as successful cleanup.

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

`POST /api/orders/:id/reorder` rebuilds the current user's cart from a prior owned order using current product records and prices. Deleted products, unavailable sizes, and insufficient-stock items are skipped with machine-readable conflicts. If no items can be restored, the endpoint returns `409`.

Successful response:

```json
{
  "success": true,
  "message": "Order items moved to cart",
  "data": {
    "added": 2,
    "skipped": [],
    "cart": {}
  }
}
```

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

### Returns and Exchanges

`POST /api/returns`

```json
{
  "orderId": "665000000000000000000010",
  "type": "return",
  "items": [
    {
      "orderItemId": "665000000000000000000020",
      "quantity": 1,
      "reason": "Size did not work"
    }
  ],
  "customerNotes": "Please review this return."
}
```

For exchanges, set `type` to `exchange` and include `exchangeSize` on each item. Request creation is strict and owner-only. The order must be `delivered`, have `deliveredAt`, be within `RETURN_WINDOW_DAYS` (default 30), and have `paymentStatus` of `paid` or `not_required`. Requested item quantity cannot exceed the original ordered quantity minus quantities already consumed by non-rejected/non-cancelled RMA requests.

Successful requests persist a `requestNumber` beginning with `RMA-`, requested items, an eligibility snapshot, refund intent, and status history. Refund intent is an RMA audit field only; this endpoint does not call Stripe and does not update `Order.paymentStatus`, `refundAmount`, or `refundRecords`.

Customer `GET /api/returns` accepts:

| Query Parameter | Description |
| --- | --- |
| `orderId` | Optional order id filter. |
| `status` | Optional request status filter: `requested`, `approved`, `rejected`, `received`, `resolved`, or `cancelled`. |

Admin `GET /api/admin/returns` accepts:

| Query Parameter | Description |
| --- | --- |
| `page` | Page number. Defaults to `1` and must be at least `1`. |
| `limit` | Maximum rows returned. Defaults to `20` and is capped at `100`. |
| `status` | Filters request status. |
| `type` | Filters `return` or `exchange`. |
| `q` | Searches `requestNumber` and `orderNumber`. |

`PATCH /api/admin/returns/:id/status`

```json
{
  "status": "approved",
  "note": "Approved by support",
  "refundAmount": 0
}
```

Allowed admin flow is `requested` -> `approved` or `rejected`, `approved` -> `received` or `rejected`, then `received` -> `resolved` or `rejected`. Each accepted update appends a server-timestamped status-history entry with the admin actor. Resolving a return may record a manual `refundAmount` on `refundIntent`, but Stripe-origin webhook state remains authoritative for order payment fields.

RMA conflicts return `409` with machine-readable codes:

| Code | Meaning |
| --- | --- |
| `ORDER_NOT_DELIVERED` | The order is not delivered or has no `deliveredAt`. |
| `PAYMENT_NOT_ELIGIBLE` | The order payment state is not eligible for a new RMA request. |
| `RETURN_WINDOW_EXPIRED` | The configured return window has passed. |
| `QUANTITY_EXCEEDS_ELIGIBLE` | Requested quantity exceeds remaining eligible quantity. |
| `INVALID_RETURN_STATUS_TRANSITION` | The admin status update skips or reverses the supported flow. |
| `RETURN_REQUEST_NOT_FOUND` | The requested RMA id does not exist. |

### Back-In-Stock Requests

`POST /api/back-in-stock`

```json
{
  "productId": "665000000000000000000001",
  "size": 42,
  "email": "jane@example.com",
  "consent": true
}
```

This endpoint captures explicit lifecycle-message intent only. It does not send email/SMS, does not require provider secrets, and does not export contact lists. The product must exist, the size must belong to the product, `consent` must be `true`, and the product must currently have `stock` of `0`. Duplicate pending requests for the same product, size, and email return the existing request.

Availability conflicts return `409`:

```json
{
  "success": false,
  "message": "Product is currently available",
  "errors": [
    {
      "code": "PRODUCT_AVAILABLE",
      "resource": "product",
      "productId": "665000000000000000000001",
      "available": 3
    }
  ]
}
```

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
    "phone": "+1 555 123 4567",
    "addresses": [],
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

Wishlist responses use the bounded list envelope and populate each saved item's `product` with `name`, `image`, `price`, `sizes`, `stock`, `category`, `gender`, and `isOnSale`:

```json
{
  "success": true,
  "count": 1,
  "total": 1,
  "page": 1,
  "limit": 20,
  "pages": 1,
  "data": [
    {
      "productId": "665000000000000000000002",
      "addedAt": "2026-06-20T00:00:00.000Z",
      "product": {
        "_id": "665000000000000000000002",
        "name": "Trail Runner",
        "image": "trail-runner.jpg",
        "price": {
          "original": 140,
          "current": 120
        },
        "sizes": [39, 40, 41, 42],
        "stock": 8,
        "category": "Running",
        "gender": "male",
        "isOnSale": true
      }
    }
  ]
}
```

Product review list responses use a bounded list envelope plus a `summary` object that mirrors the product's review aggregate fields:

```json
{
  "success": true,
  "count": 1,
  "total": 1,
  "page": 1,
  "limit": 20,
  "pages": 1,
  "summary": {
    "averageRating": 5,
    "reviewCount": 1,
    "ratingDistribution": { "1": 0, "2": 0, "3": 0, "4": 0, "5": 1 },
    "fitSummary": {
      "runsSmall": 0,
      "trueToSize": 1,
      "runsLarge": 0,
      "total": 1,
      "dominant": "true_to_size"
    }
  },
  "data": [
    {
      "_id": "665000000000000000000010",
      "rating": 5,
      "title": "Great fit",
      "comment": "Comfortable all day.",
      "fit": "true_to_size",
      "verifiedPurchase": true,
      "createdAt": "2026-06-20T00:00:00.000Z",
      "user": {
        "name": "Jane Customer"
      }
    }
  ]
}
```

Review create returns `201` with the created public review and the updated aggregate `summary`.

Order checkout-start returns status `201`, `message: "Payment started"`, and `data.order` plus `data.payment`. An exact retry with the same `Idempotency-Key` returns status `200`, `message: "Payment already started"`, the same order, and the stored pending payment URL. Missing `Idempotency-Key` returns `400`. Reusing the key for a changed non-empty cart/request state returns `409`.

The backend calculates order items, subtotal, discount, total, coupon usage, and stock decrement from the authenticated cart. Provider-backed orders start with fulfillment `status: "pending"` and payment state `payment_pending`. In Stripe mode, verified webhook success moves fulfillment to `processing` and `paymentStatus` to `paid`. In mock sandbox mode, `POST /api/orders/:id/payment/mock` records controlled demo outcomes without collecting card data. Order numbers are unique display identifiers beginning with `PLS-`; they are not strict sequences.

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

When Stripe config is incomplete or `PAYMENTS_ENABLED=false`, checkout returns a mock gateway URL:

```json
{
  "provider": "mock",
  "checkoutUrl": "/checkout/mock?orderId=665000000000000000000010",
  "sessionId": "mock-session-665000000000000000000010",
  "paymentIntentId": null,
  "demoMode": true
}
```

`POST /api/orders/:id/payment/mock`

```json
{
  "outcome": "approve"
}
```

Supported mock outcomes are `approve`, `decline`, and `cancel`. They transition the same order payment fields to `paid`, `payment_failed`, or `payment_canceled`; decline and cancel release reserved inventory once through the existing payment-state service.

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

Possible conflict `code` values include `INSUFFICIENT_STOCK`, `PRODUCT_UNAVAILABLE`, `SIZE_UNAVAILABLE`, `PRODUCT_AVAILABLE`, `COUPON_USAGE_LIMIT_REACHED`, `COUPON_UNAVAILABLE`, `COUPON_MINIMUM_NOT_MET`, `IDEMPOTENCY_KEY_CONFLICT`, `INVALID_FULFILLMENT_TRANSITION`, `PAYMENT_NOT_SHIPPABLE`, and `TRACKING_REQUIRED`.

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
| `400` | Zod validators, controllers, and Mongoose validation | Invalid request body/query/params, unknown write fields, duplicate user, invalid coupon, invalid cart quantity or size, invalid wishlist/review product id, empty cart, missing shipping fields, missing/invalid `Idempotency-Key`, or an order that can no longer be cancelled. |
| `401` | `protect` middleware and login controller | Missing token, failed token verification with the allowed HS256 algorithm, missing authenticated user, or invalid login credentials. |
| `403` | `admin` middleware, order ownership checks, and review eligibility | Authenticated user is not an admin, the user is not authorized to access the requested order, or the user has no verified purchase for the reviewed product. |
| `404` | Controllers | Product, wishlist product, cart, cart item, order, coupon, or contact message was not found. |
| `409` | Cart, checkout, review, retention, and fulfillment conflict handling | Requested stock is unavailable, a cart/order product was deleted, a back-in-stock product is already available, guest cart merge cannot be completed, coupon usage is exhausted, coupon rules changed, an idempotency key was reused for a different checkout state, the user already reviewed the product, or an admin fulfillment update violates payment/status/tracking rules. |
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
| `Frontend/Ecommerce-main/my-app/src/api/productsApi.js` | `productsApi` | Public product read endpoints only: `GET /api/products`, `GET /api/products/:id`, `GET /api/products/:id/related`, `GET /api/products/men`, `GET /api/products/women`, `GET /api/products/sale`, `GET /api/products/bestsellers`, `GET /api/products/categories` |
| `Frontend/Ecommerce-main/my-app/src/api/recommendationsApi.js` | `recommendationsApi` | `GET /api/recommendations` |
| `Frontend/Ecommerce-main/my-app/src/api/lookbookApi.js` | `lookbookApi` | `GET /api/lookbook` |
| `Frontend/Ecommerce-main/my-app/src/api/cartApi.js` | `cartApi` | `GET /api/cart`, `POST /api/cart/merge`, `POST /api/cart/items`, `PUT /api/cart/items/:itemId`, `DELETE /api/cart/items/:itemId`, `DELETE /api/cart`, `POST /api/cart/coupon`, `DELETE /api/cart/coupon` |
| `Frontend/Ecommerce-main/my-app/src/api/wishlistApi.js` | `wishlistApi` | `GET /api/wishlist`, `POST /api/wishlist/items`, `DELETE /api/wishlist/items/:productId` |
| `Frontend/Ecommerce-main/my-app/src/api/reviewsApi.js` | `reviewsApi` | `GET /api/products/:id/reviews`, `POST /api/products/:id/reviews` |
| `Frontend/Ecommerce-main/my-app/src/api/ordersApi.js` | `ordersApi` | `POST /api/orders` with optional `Idempotency-Key`, `GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders/:id/payment/mock`, `POST /api/orders/:id/reorder`, `PUT /api/orders/:id/cancel` |
| `Frontend/Ecommerce-main/my-app/src/api/returnsApi.js` | `returnsApi` | `POST /api/returns`, `GET /api/returns`, `GET /api/returns/:id` |
| `Frontend/Ecommerce-main/my-app/src/api/backInStockApi.js` | `backInStockApi` | `POST /api/back-in-stock` |
| `Frontend/Ecommerce-main/my-app/src/api/contactApi.js` | `contactApi` | `POST /api/contact` |
| `Frontend/Ecommerce-main/my-app/src/api/couponApi.js` | `couponApi` | `POST /api/coupons/validate` |
| `Frontend/Ecommerce-main/my-app/src/api/adminApi.js` | `adminApi` | `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`, `GET /api/admin/lookbook`, `POST /api/admin/lookbook`, `PUT /api/admin/lookbook/:id`, `DELETE /api/admin/lookbook/:id`, `GET /api/admin/orders`, `GET /api/admin/orders/:id`, `PATCH /api/admin/orders/:id/fulfillment`, `GET /api/admin/returns`, `GET /api/admin/returns/:id`, `PATCH /api/admin/returns/:id/status`, `GET /api/coupons`, `POST /api/coupons`, `DELETE /api/coupons/:id`, `GET /api/contact`, `PUT /api/contact/:id/read`, `DELETE /api/contact/:id` |

## Admin Console

The frontend admin console is available at `/admin`. Signed-out users are redirected to `/account`. Authenticated non-admin users can open a portfolio demo preview with sanitized sample admin data and disabled write controls. Real admin API calls still require backend bearer-token authentication plus the backend `admin` middleware; the demo preview does not set `isAdmin` or weaken backend authorization.

The console supports order list/detail/fulfillment operations, product create/update/delete, coupon list/create/delete, and contact message list/mark-read/delete workflows through `adminApi`. In demo mode, `adminApi` returns sample reads and rejects mutation wrappers before HTTP requests are sent.
