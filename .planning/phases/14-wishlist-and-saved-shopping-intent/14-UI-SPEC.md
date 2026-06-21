---
phase: 14
slug: wishlist-and-saved-shopping-intent
status: approved
shadcn_initialized: false
preset: none
created: 2026-06-20
---

# Phase 14 - UI Design Contract

> Visual and interaction contract for PLASHOE wishlist and saved-shopping-intent surfaces.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | Existing React, Tailwind utility styling, and local components |
| Icon library | Existing FontAwesome icons; no new icon package |
| Font | Inter, system-ui, sans-serif |

### Product Surface

- Surface type: customer ecommerce saved-intent flow.
- Tone: quiet, useful, and commerce-native. Save controls should feel like part of browsing, not a separate campaign.
- First screen impact: wishlist appears inside existing ProductCard, Quick View, Header, and Account surfaces.
- Primary user: shopper saving products for later, comparing sizes, and moving saved products into the cart.

---

## Spacing Scale

Declared values use 4px multiples.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, count badge padding, inline metadata |
| sm | 8px | Compact action groups, status text spacing |
| md | 16px | Product-card action rows, account list item padding |
| lg | 24px | Account wishlist sections and empty-state spacing |
| xl | 32px | Desktop account content gaps |
| 2xl | 48px | Major separation between account sections |
| 3xl | 64px | Full-page account empty states only |

Exceptions: none.

### Layout Contracts

- Wishlist UI must use existing storefront structure rather than creating a new landing page.
- ProductCard save control is a stable-size heart button positioned in the product image/action area without resizing the card.
- Quick View save control appears near product title/price or primary purchase actions, visible without requiring hover.
- Header wishlist affordance uses icon plus count where space allows; the count badge must not shift adjacent cart/account controls.
- Account Wishlist uses product rows on desktop and product cards on mobile. Do not nest cards inside cards.
- Empty states are unframed page content, not marketing panels.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.5 |
| Label | 12px | 600 | 1.35 |
| Heading | 20px | 600 | 1.3 |
| Display | 28px | 600 | 1.2 |

### Typography Rules

- Do not scale font size with viewport width.
- Letter spacing is `0`.
- Wishlist controls use concise labels: `Save`, `Saved`, `Remove`, `Move to cart`.
- Header count badge uses 12px text with stable min-width.
- Account row metadata can use 12px text, but action buttons must remain readable and touch-friendly.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #ffffff | Product surfaces, account content, modal content |
| Secondary (30%) | #f1f1ef | Account sidebar, empty-state background bands, subtle row contrast |
| Accent (10%) | #6e7051 | Primary wishlist/account actions, focus accents, active account nav |
| Text | #262b2c | Body text, headings, primary metadata |
| Muted text | #6b6f68 | Guest-local copy, secondary metadata, helper text |
| Border | #d9d9d2 | Product controls, account rows, select controls |
| Saved | #b42318 | Saved heart fill and remove/danger emphasis only |
| Destructive | #b42318 | Remove wishlist item action and destructive confirmation only |

Accent reserved for: primary move-to-cart actions, account active tab, focused controls, and one primary wishlist action per surface.

Color constraints:
- Do not add gradients, decorative orbs, or hero-style visual treatment.
- Do not rely on red heart color alone; saved state must have text or accessible label changes.
- Status and stock indicators must include readable text.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Product save inactive | Save |
| Product save active | Saved |
| Quick View secondary CTA | Save for later |
| Header link | Wishlist |
| Account section heading | My Wishlist |
| Move CTA | Move to cart |
| Remove CTA | Remove |
| Guest local message | Saved on this device. Sign in to keep it across devices. |
| Auth merge success | Wishlist saved to your account. |
| Auth merge failure | We could not sync your saved items. They are still saved on this device. |
| Empty state heading | Your wishlist is empty |
| Empty state body | Save products while browsing and they will appear here. |
| Error state | We could not load your wishlist. Check your connection and try again. |
| Move failure | We could not move this item to your cart. It is still saved. |
| Destructive confirmation | Remove: This item will leave your wishlist. Continue? |

Copy rules:
- Use direct verbs for controls.
- Guest/local persistence copy must be explicit and short.
- Do not add instructional paragraphs describing the feature.
- Failure copy must confirm that saved intent was preserved when applicable.

---

## Screen Contracts

### Reusable WishlistButton

- Renders a button, not a div/span.
- Required states: unsaved, saved, loading, disabled/local-only feedback.
- Accessible name must include product context where available, such as `Save Runner Sneaker to wishlist` or `Remove Runner Sneaker from wishlist`.
- Icon-only presentation is allowed on ProductCard only if `aria-label` is complete.
- Visible text is required in Account and Quick View.
- Minimum touch target: 44px by 44px.
- Loading state must not resize the button.

### ProductCard

- Save control is visible without hover on touch/mobile.
- Hover action tray may still contain cart and quick-view controls, but wishlist state must remain discoverable.
- Saved state changes heart style and accessible label.
- Local-only save feedback appears through existing toast patterns, not extra card text.

### Quick View

- Save control appears in the product detail column near title/price or above add-to-cart.
- It must not compete with the primary add-to-cart button.
- Saved state remains visible after quantity or size changes.
- Close button keeps its accessible name.

### Header

- Wishlist link appears only when `config.features.wishlist` is true.
- Count badge shows total wishlist items and remains stable at 0, 1, and 2+ digits.
- The link routes authenticated and guest users to Account Wishlist state where practical.
- Mobile navigation must include a reachable Wishlist affordance when the feature is enabled.

### Account Wishlist

- Authenticated account view replaces the placeholder with saved product records.
- Each record includes image, name, price, stock/status when available, selected size, remove, and move-to-cart.
- Size selector defaults to the first available size and is user-changeable before move-to-cart.
- Move-to-cart uses existing cart behavior and removes the wishlist item only after cart add succeeds.
- Empty state includes the heading/body above and a compact `Browse products` link to `/collection`.
- Sync/loading state uses visible status text.

### Guest State

- Guests can save/unsave locally.
- Account unauthenticated view keeps the existing login/register form and may show the guest-local message when saved items exist.
- After successful login/register, automatic merge feedback uses toast or inline account status. It must not block navigation.

---

## Responsive Contract

| Viewport | Layout |
|----------|--------|
| 320px to 767px | Product save button remains visible; Account Wishlist uses stacked item cards with full-width actions |
| 768px to 1023px | Account Wishlist uses two-column-friendly rows/cards; Header count stays visible if horizontal space allows |
| 1024px and above | Product grid controls stay fixed-size; Account Wishlist uses row layout with image, metadata, size, and actions |

Responsive rules:
- No horizontal page overflow at 320px, 390px, 768px, or 1366px.
- No text may overlap the count badge, buttons, or product images.
- Account Wishlist actions wrap into multiple rows before shrinking text below 12px.
- Touch targets for heart buttons, remove, and move-to-cart must be at least 44px by 44px.

---

## Accessibility Contract

- All wishlist buttons have accessible names that distinguish save vs remove.
- Saved state is exposed through `aria-pressed` where the control toggles state.
- Header badge text must be announced as a count, not just decorative color.
- Size selectors in Account have visible labels.
- Error and sync messages use visible text; critical failures can use `role="alert"`.
- Loading states use `role="status"` or equivalent visible status text.
- Keyboard users can save, unsave, select size, remove, and move items to cart.
- Focus indicators must remain visible on all wishlist controls.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party registry | none | not allowed for this phase |

No registry UI blocks are approved for Phase 14. Use existing dependencies and local components.

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

- Copywriting is concrete and preserves saved intent on failure.
- Visuals fit the existing storefront and avoid adding a new page treatment.
- Color uses neutral PLASHOE surfaces with restrained accent and saved-heart states.
- Typography is fixed and compact for commerce controls.
- Spacing uses 4px multiples and stable control dimensions.
- Registry safety passes because no third-party UI blocks are used.
