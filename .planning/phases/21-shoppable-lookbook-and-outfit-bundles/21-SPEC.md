# Phase 21 Spec: Shoppable Lookbook and Outfit Bundles

## Goal
Lookbook content becomes shoppable merchandising where tagged products and outfit bundles can move directly into cart.

## Requirements
- V2-LOOK-01: Lookbook content can associate images or scenes with active products and optional outfit bundles.
- V2-LOOK-02: Shoppers can inspect tagged products and add individual items or available bundle items to cart.
- V2-LOOK-03: Admin maintenance, responsive behavior, accessibility, and focused tests cover shoppable lookbook interactions.

## Recommendation
Add a dedicated lookbook content model and API instead of adding scene metadata to products. Products remain the source of truth for stock, price, sizes, and cart normalization; lookbook entries only hold scene imagery, hotspot positions, and bundle composition.

## In Scope
- Public active lookbook listing with populated tagged products and bundle items.
- Admin lookbook listing, create, update, and delete workflow.
- Storefront hotspot inspection, individual add-to-cart, and bundle add-to-cart using current cart store behavior.
- Focused backend/frontend tests, docs, browser smoke, UI review, code review, and verification artifacts.

## Out of Scope
- Image upload/storage providers.
- Automated visual recognition or AI outfit generation.
- Discounted bundle pricing.
- Provider-backed merchandising scheduling beyond active/draft and sort order.

## Acceptance Criteria
- Public lookbook entries only expose active merchandising scenes.
- Admin users can maintain entries without code edits.
- Invalid or missing product references are rejected server-side.
- Bundle add-to-cart uses current product size/stock data and existing cart normalization.
- The lookbook page is keyboard-accessible, responsive, and covered by focused tests.

