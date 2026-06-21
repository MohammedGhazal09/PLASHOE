# Phase 15 Research - Product Detail Reviews and Fit Confidence

**Created:** 2026-06-20
**Mode:** inline, no subagents

## Current Implementation Baseline

- Backend product API already supports list/detail/admin CRUD through `Backend/controllers/productController.js`, `Backend/routes/productRoutes.js`, and `Backend/validators/product.js`.
- Product schema is basic and additive-safe: new optional fields can be added without breaking existing product documents.
- Orders already contain `user`, `items.product`, `status`, and `paymentStatus`, which can prove verified purchase without changing checkout.
- Frontend catalog normalization is centralized in `src/services/catalog/normalizeProduct.js`.
- Frontend has ProductCard, QuickViewModal, WishlistButton, cart store, productsApi, and route registration patterns that can be reused.

## Recommended Technical Approach

1. Add product detail fields and related-products endpoint before frontend page work.
2. Add Review model/API with verified-purchase checks and product aggregate updates.
3. Add frontend `reviewsApi`, `ProductDetail` page, route wiring, and links from ProductCard.
4. Add docs/tests/build/browser smoke after behavior lands.

## Backend Notes

- Review model should include `product`, `user`, `rating`, `title`, `comment`, `fit`, `isApproved`, and `verifiedPurchase`.
- Unique index `{ product: 1, user: 1 }` enforces one review per user/product.
- Public listing should populate user `name` only.
- Verified purchase query should check an order owned by the current user containing the product, status not `cancelled`, and payment status in `paid` or `not_required`.
- Aggregation can use Mongo aggregation grouped by rating/fit and update Product fields after review create.
- Related-products endpoint can stay in product controller and use three deterministic queries: same gender/category, same category, rating/newest fallback.

## Frontend Notes

- ProductDetail should normalize backend product data with existing `normalizeProduct`.
- Review form should be local state; no new global store is needed.
- ProductCard links should not break quick-view or wishlist controls. Stop event propagation where a nested action should not navigate.
- Reviews default enabled through config, with exact `false` kill switch.
- Product detail can use fallback content for materials/fit/care when backend optional fields are absent.

## Test Strategy

- Backend: focused `product-detail.test.js` and `review.test.js` or one combined route test covering richer fields, related products, review list/create/validation/aggregation.
- Frontend: `reviewsApi.test.js`, `ProductDetail.test.jsx`, ProductCard link regression, config default test, normalizer rich-field test.
- Browser smoke: desktop product detail buying controls; mobile reviews/fit/related layout with no horizontal overflow.

## Risks

- Updating Product.rating from reviews changes existing bestseller/rating sort behavior. This is intended but should be tested.
- Review verification depends on existing order test factories and payment status semantics.
- ProductCard nested controls can accidentally trigger navigation if click propagation is not handled carefully.
- Local fallback products use non-ObjectId ids; ProductDetail should show a clear error or fallback lookup instead of sending invalid ids to backend blindly.
