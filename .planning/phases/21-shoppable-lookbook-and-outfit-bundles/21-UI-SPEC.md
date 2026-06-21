# Phase 21 UI Spec

## Storefront
- Replace static lookbook cards with shoppable scene sections.
- Each scene shows a large image with accessible hotspot buttons positioned by percentage coordinates.
- Selecting a hotspot reveals the tagged product, current price, size selection, and individual add-to-cart action.
- Optional bundle panels list available bundle items, expose size controls, and add available selected items to cart.
- Empty/error fallback preserves the current static lookbook inspiration content.

## Admin
- Add a Lookbook admin section.
- Admin form fields include title, status, image URL, description, sort order, hotspots, and optional bundle fields.
- Hotspot and bundle row text inputs use product IDs so the feature is maintainable without code edits while staying simple for the current admin surface.
- Existing products are listed as reference IDs in the admin view.

## Recommendation
Keep the first UI pragmatic and dense rather than editorial. Lookbook scenes should be visually rich, but the shopping controls must stay predictable: product, size, add action, and bundle add action.

