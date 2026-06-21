---
phase: 14
slug: wishlist-and-saved-shopping-intent
status: passed
verified: 2026-06-20
---

# Phase 14 Verification

## Automated Checks

| Check | Command | Result |
| --- | --- | --- |
| Backend wishlist routes | `cd Backend; npm test -- wishlist.test.js` | Passed: 1 test file, 7 tests |
| Frontend wishlist API/store/UI/config | `cd Frontend/Ecommerce-main/my-app; npm test -- --run src/api/wishlistApi.test.js src/store/wishlistStore.test.js src/components/WishlistButton.test.jsx src/components/ProductCard.test.jsx src/components/QuickViewModal.test.jsx src/components/Header.test.jsx src/pages/Account.test.jsx src/config/config.test.js` | Passed: 8 test files, 28 tests |
| Frontend production build | `cd Frontend/Ecommerce-main/my-app; npm run build` | Passed |

## Browser Smoke

| Surface | Evidence | Result |
| --- | --- | --- |
| Desktop home/product cards/header | Headless Chrome at `1440x900`, local dev server with `REACT_APP_ENABLE_WISHLIST=true` | Passed: 8 wishlist buttons detected, header started at `Wishlist (0 items)`, saving one product updated header to `Wishlist (1 item)`, one toggle exposed `aria-pressed=true`, no horizontal overflow |
| Mobile account wishlist | Headless Chrome at `390x844`, seeded authenticated session plus local wishlist storage | Passed: `My Wishlist`, `Smoke Runner`, `Move to cart`, and `Remove` rendered with no horizontal overflow |

Artifacts:

- `.planning/phases/14-wishlist-and-saved-shopping-intent/artifacts/14-ui-smoke-report.json`
- `.planning/phases/14-wishlist-and-saved-shopping-intent/artifacts/14-ui-smoke-home-desktop.png`
- `.planning/phases/14-wishlist-and-saved-shopping-intent/artifacts/14-ui-smoke-account-mobile.png`

## Acceptance Mapping

| Acceptance Area | Evidence |
| --- | --- |
| Protected backend list/add/remove | `Backend/test/wishlist.test.js` covers unauthenticated `401`, empty envelope creation, add/list population, duplicate add, remove/no-op, request validation, and missing product `404`. |
| Frontend API wrapper | `src/api/wishlistApi.test.js` covers `GET /wishlist`, `POST /wishlist/items`, and `DELETE /wishlist/items/:productId`. |
| Guest local wishlist | `src/store/wishlistStore.test.js` covers local add/remove without API calls and local-only product id preservation. |
| Auth sync and merge | `src/store/wishlistStore.test.js` and `src/pages/Account.test.jsx` cover authenticated API sync, merge after login, and failed merge preservation. |
| ProductCard and Quick View controls | `ProductCard.test.jsx`, `QuickViewModal.test.jsx`, `WishlistButton.test.jsx`, and desktop smoke cover accessible save/remove controls. |
| Header count/link | `Header.test.jsx` and desktop smoke cover feature-gated wishlist link/count and count update after save. |
| Account wishlist management | `Account.test.jsx` and mobile smoke cover list rendering, size selection, move-to-cart ordering, remove, load-error alert, and failed move preservation. |
| Documentation/config | `docs/API.md`, `docs/DEVELOPMENT.md`, `docs/TESTING.md`, `docs/CONFIGURATION.md`, `README.md`, and `.env.example` were updated for wishlist behavior and flag default. |

## Not Verified

- No hosted, staging, or production URL was exercised.
- Browser smoke did not use a live MongoDB-backed authenticated wishlist session; backend persistence is verified through route-level tests.
- Cross-browser coverage beyond local headless Chrome was not run.

## Recommendation

Before enabling a hosted release, run one staging smoke with a real user account and MongoDB-backed products: save from a product card, refresh, confirm `/api/wishlist` persistence, log out/log in, and move the saved product to cart.
