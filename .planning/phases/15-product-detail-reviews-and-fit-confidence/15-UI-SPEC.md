---
phase: 15
slug: product-detail-reviews-and-fit-confidence
status: approved
shadcn_initialized: false
preset: none
created: 2026-06-20
---

# Phase 15 - UI Design Contract

> Visual and interaction contract for product detail, reviews, fit guidance, and related products.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | Existing React, Tailwind utility styling, local components, and Material UI theme only where already used |
| Icon library | Existing FontAwesome icons |
| Font | Inter, system-ui, sans-serif |

### Product Surface

- Surface type: ecommerce product decision page.
- Tone: detailed, calm, and purchase-focused.
- Primary user: shopper comparing size, fit, reviews, and materials before adding to cart.
- First screen impact: product image, name, price, rating/review count, size selector, fit confidence, wishlist, and add-to-cart must be visible or nearly visible on desktop.

---

## Spacing Scale

Declared values use 4px multiples.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, rating stars, metadata separators |
| sm | 8px | Inline helper text, compact badges |
| md | 16px | Control groups, review metadata, related product gaps |
| lg | 24px | Product detail sections, review form spacing |
| xl | 32px | Desktop image/detail column gap |
| 2xl | 48px | Major page sections such as reviews and related products |
| 3xl | 64px | Top/bottom page padding on desktop |

Exceptions: none.

### Layout Contracts

- Product detail uses existing storefront layout under `Layout`; do not create a landing page.
- Desktop layout uses a two-column product decision area: media on the left, purchase details on the right.
- Mobile layout stacks media, details, size/fit controls, reviews, then related products.
- Do not put cards inside cards. Reviews may be repeated list items with borders, not nested decorative panels.
- Related products use ProductCard and stay bounded to four visible items.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.5 |
| Label | 12px | 600 | 1.35 |
| Heading | 20px | 600 | 1.3 |
| Display | 32px | 600 | 1.2 |

### Typography Rules

- Do not scale font size with viewport width.
- Letter spacing is `0`.
- Page title may use Display size; section headings use Heading size.
- Review body text stays Body size and plain text.
- Badges and fit labels use Label size but remain readable.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #ffffff | Page background, product media surface, review list surface |
| Secondary (30%) | #f1f1ef | Fit guidance bands, empty states, subtle section contrast |
| Accent (10%) | #6e7051 | Primary add-to-cart, active size/focus accents, verified badges |
| Text | #262b2c | Headings, primary content |
| Muted text | #6b6f68 | Metadata, secondary help, dates |
| Border | #d9d9d2 | Size buttons, review dividers, form fields |
| Star | #d4a017 | Rating stars only |
| Destructive | #b42318 | Validation errors and destructive copy only |

Accent reserved for: add-to-cart, verified-purchase badge, active size, focus accents, and primary review submit action.

Color constraints:
- No gradients, orbs, bokeh, or hero illustration treatments.
- Do not rely on star color alone; include rating count/labels.
- Fit confidence must use text labels, not color-only indicators.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Add CTA | Add to Cart |
| Wishlist CTA | Save for later |
| Review section heading | Customer Reviews |
| Review form heading | Write a review |
| Review submit | Submit review |
| Review empty heading | No reviews yet |
| Review empty body | Be the first verified buyer to share how these fit. |
| Verified badge | Verified purchase |
| Fit heading | Fit confidence |
| Fit fallback | Runs true to size for most shoppers. |
| Related heading | You may also like |
| Product not found | Product not found |
| Review gated unauthenticated | Sign in to review verified purchases. |
| Review gated unverified | Reviews are available after a verified purchase. |
| Duplicate review | You have already reviewed this product. |
| Error state | We could not load this product. Try again from the collection. |

Copy rules:
- Use direct ecommerce verbs.
- Do not add instructional paragraphs explaining how reviews work.
- Error copy must state the problem and next action.

---

## Screen Contracts

### Product Detail Page

- Route: `/products/:id`.
- Media area shows primary image and optional gallery thumbnails.
- Detail area shows product name, rating average, review count, price, sale state, stock state, description, size selector, fit confidence, wishlist, and add-to-cart.
- Size buttons have accessible selected state and at least 44px touch targets.
- Add-to-cart is disabled only when no valid size is selected or stock is unavailable.
- Loading and error states use visible text.

### Reviews

- Review list shows rating, title, comment, fit feedback, verified badge, user display name, and date.
- Review form uses labeled fields for rating, title, comment, and optional fit feedback.
- Validation errors are visible and associated with the relevant fields where practical.
- Review content renders as plain text; do not use `dangerouslySetInnerHTML`.
- Empty state is unframed content.

### Fit Guidance

- Fit confidence sits near size selection.
- Product-provided fit copy takes priority; fallback copy is concise.
- Review-derived fit summary appears when review data exists.
- Size guide/care/materials content appears below the main buying controls.

### Related Products

- Use existing ProductCard with no more than four products.
- Product cards link to their detail pages.
- Empty related-products state can be omitted; do not render a large empty panel.

---

## Responsive Contract

| Viewport | Layout |
|----------|--------|
| 320px to 767px | Single column; gallery thumbnails wrap; full-width add-to-cart and review form controls |
| 768px to 1023px | Two-column-friendly product decision area if space allows; reviews remain single column |
| 1024px and above | Media/details two-column layout; reviews and related products use constrained content width |

Responsive rules:
- No horizontal page overflow at 320px, 390px, 768px, 1366px, or 1440px.
- Text must not overlap product media, price, buttons, or review metadata.
- Touch targets for sizes, wishlist, add-to-cart, review submit, and related product links must be at least 44px high.
- Related product cards wrap before shrinking text below 12px.

---

## Accessibility Contract

- Product detail page has one clear `h1`.
- Product image has useful alt text from product name.
- Size choices are keyboard reachable and expose selected state.
- Wishlist button keeps product-specific accessible labels from Phase 14.
- Review form fields have visible labels.
- Review submit errors use visible text and `role="alert"` where appropriate.
- Loading text uses visible status text.
- Rating controls have accessible names, not star icons alone.
- Review list metadata is readable in source order.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party registry | none | not allowed for this phase |

No registry UI blocks are approved for Phase 15. Use existing dependencies and local components.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-06-20

## Checker Notes

- Product detail uses existing PLASHOE storefront composition rather than a marketing hero.
- Reviews and fit guidance are plain, accessible, and purchase-focused.
- Responsive requirements include explicit no-overflow checks and touch target constraints.
