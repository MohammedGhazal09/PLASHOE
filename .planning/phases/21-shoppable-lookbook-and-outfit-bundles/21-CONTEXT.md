# Phase 21 Context

## Existing Surfaces
- `Frontend/Ecommerce-main/my-app/src/pages/LookBook.jsx` is currently static image/link content.
- `Frontend/Ecommerce-main/my-app/src/store/cartStore.js` owns add-to-cart normalization for guest and authenticated carts.
- `Backend/models/Product.js` owns product price, stock, size, and merchandising detail fields.
- `Frontend/Ecommerce-main/my-app/src/pages/AdminConsole.jsx` hosts admin maintenance sections.

## Relevant Constraints
- D-03: Do all work inline and do not use subagents.
- D-65: Bundle add-to-cart must respect stock, size selection, and cart normalization rules.
- Product references must not become stale silently; admin writes need reference validation.
- The storefront can use mocked backend responses for browser smoke, but hosted/provider success must not be claimed.

## Recommendation
Use active/draft status plus explicit sort order for local merchandising control. Avoid adding scheduling, segmentation, or provider-backed automation until real merchandising operations need it.

