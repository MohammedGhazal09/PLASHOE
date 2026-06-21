# Phase 15: Product Detail Reviews and Fit Confidence - Context

**Gathered:** 2026-06-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 15 adds a public product detail buying decision surface with richer product fields, verified-purchase reviews, fit guidance, and bounded related products. It extends existing catalog/product/order/wishlist contracts without changing checkout rules.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**7 requirements are locked.** See `15-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream work MUST read `15-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Public product detail route and page for `/products/:id`.
- Additive product fields for richer detail content.
- Related-products backend endpoint and frontend rendering.
- Review model, protected verified-purchase submission, public listing, and rating/fit aggregation.
- Product detail review form/list UI with safe validation and rendering.
- Fit guidance at the product decision point.
- Focused backend/frontend tests, docs, build, browser smoke, and verification artifacts.

**Out of scope (from SPEC.md):**
- Review photo/video uploads.
- Review helpful votes, comments, Q&A, or moderation dashboard.
- Personalized recommendations.
- Advanced catalog search/faceting.
- Changing checkout/payment/fulfillment rules.
- Full rich-text review rendering.

</spec_lock>

<decisions>
## Implementation Decisions

### Product Detail Route and Content
- **D-01:** Use `/products/:id` as the canonical public product detail route.
- **D-02:** ProductCard, related product cards, and any product name/image links should route to `/products/:id` when a product id is available.
- **D-03:** Product detail should reuse existing cart behavior, wishlist behavior, product normalization, public asset helpers, and toast patterns.
- **D-04:** Rich product fields are additive and optional: `gallery`, `materials`, `careInstructions`, and `fitGuide`.
- **D-05:** Product detail should render useful fallback content when optional rich fields are absent so existing products still have a complete page.

### Review API and Safety
- **D-06:** Use product-subresource routes: `GET /api/products/:id/reviews` and `POST /api/products/:id/reviews`.
- **D-07:** Public review listing returns only approved reviews plus limited user display data.
- **D-08:** Review submission requires bearer auth and a verified purchase found in existing orders for the current user and product.
- **D-09:** Verified purchase means the user owns a non-cancelled order containing the product with payment status `paid` or `not_required`.
- **D-10:** Enforce one review per user/product. Duplicate submission returns `409`.
- **D-11:** Review content is plain text only, strict-field validated, length-bounded, and rendered without HTML injection.
- **D-12:** Review payload includes rating, title, comment, and optional fit feedback enum (`runs_small`, `true_to_size`, `runs_large`).

### Aggregation and Related Products
- **D-13:** Creating an approved review updates product `rating`, `reviewCount`, `ratingDistribution`, and review-derived fit summary.
- **D-14:** Related products use deterministic catalog rules: same gender/category first, then same category, then highest rating/newest fallback, always excluding the current product.
- **D-15:** The detail page shows up to 4 related products; the API may accept `limit` but caps at 8.

### Frontend Experience
- **D-16:** Reviews are enabled by default after Phase 15 and hidden only when `REACT_APP_ENABLE_REVIEWS=false`.
- **D-17:** Review form is visible to signed-in users, but submit failure copy should clearly distinguish sign-in required, verified-purchase required, duplicate review, and validation failures.
- **D-18:** Product detail must show fit guidance beside size selection, not buried below the fold on desktop.
- **D-19:** Related products should use existing ProductCard styling and remain bounded so the page does not become a full discovery surface.
- **D-20:** Loading, error, empty-review, and no-related-products states must be visible text states.

### the agent's Discretion
- **D-21:** Choose exact internal helper names and component boundaries as long as route/API contracts stay stable.
- **D-22:** Choose the precise fallback fit copy for products without explicit fit data, provided it is concise and not misleading.
- **D-23:** Choose the exact test split as long as backend route behavior, frontend API/store/page behavior, docs, build, and browser smoke are covered.

</decisions>

<canonical_refs>
## Canonical References

**Downstream work MUST read these before planning or implementing.**

### Phase Scope
- `.planning/phases/15-product-detail-reviews-and-fit-confidence/15-SPEC.md` - Locked Phase 15 requirements and boundaries.
- `.planning/ROADMAP.md` - Phase 15 goal, dependencies, canonical refs, and success criteria.
- `.planning/REQUIREMENTS.md` - V2-PDP, V2-REV, and V2-FIT traceability.
- `.planning/STATE.md` - Current phase state and open production/staging caveats.

### Backend
- `Backend/models/Product.js` - Existing product schema, indexes, and rating field.
- `Backend/controllers/productController.js` - Existing product list/detail handlers and response envelopes.
- `Backend/routes/productRoutes.js` - Existing public/admin product route structure.
- `Backend/validators/product.js` - Existing Zod product schema patterns.
- `Backend/models/Order.js` - Verified-purchase source for review eligibility.
- `Backend/test/helpers/factories.js` - Test factory patterns for users, products, orders, and future reviews.

### Frontend
- `Frontend/Ecommerce-main/my-app/src/api/productsApi.js` - Existing product API wrapper.
- `Frontend/Ecommerce-main/my-app/src/services/catalog/normalizeProduct.js` - Product normalization contract.
- `Frontend/Ecommerce-main/my-app/src/components/ProductCard.jsx` - Product card UI and wishlist control integration.
- `Frontend/Ecommerce-main/my-app/src/components/QuickViewModal.jsx` - Existing product decision modal.
- `Frontend/Ecommerce-main/my-app/src/pages/OrderDetail.jsx` - Authenticated order detail patterns and order item display.
- `Frontend/Ecommerce-main/my-app/src/App.js` - Route registration.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WishlistButton` can be reused on the product detail page.
- `useCartStore.addItem` handles backend cart add for authenticated users and local cart add for local fallback product ids.
- `normalizeProduct` already converts backend and fallback catalog products into render-ready product objects.
- `ProductCard` already contains star rendering and add-to-cart behavior that can inform detail-page UI.
- `ordersApi` and `OrderDetail` show existing authenticated API/error/toast patterns.

### Established Patterns
- Backend responses use `{ success, data }` envelopes and paginated list metadata.
- Backend input validation uses Zod strict objects and route-level `validateRequest`.
- Authenticated routes use `protect`; admin routes add `admin`.
- Frontend API modules go through the shared axios instance.
- Frontend tests use Vitest and React Testing Library with user-facing assertions.

### Integration Points
- Product routes can host related-products and review subresources before `/:id`.
- Product model can receive optional rich fields without breaking existing product documents.
- Review aggregation updates Product fields used by existing catalog sorting and bestsellers.
- Product detail route should be wired under the existing public `Layout`.

</code_context>

<specifics>
## Specific Ideas

- Keep the review API under product routes rather than adding top-level shopper-facing review URLs.
- Keep review rendering plain-text and simple; no rich text or media.
- Use existing PLASHOE neutral ecommerce styling, not a marketing landing page.

</specifics>

<deferred>
## Deferred Ideas

- Review moderation dashboard belongs in a later admin/moderation phase.
- Review media uploads require a storage/security design and are deferred.
- Personalized recommendations belong to Phase 20.
- Advanced search/faceting belongs to Phase 16.

</deferred>

---

*Phase: 15-product-detail-reviews-and-fit-confidence*
*Context gathered: 2026-06-20*
