# Phase 17: Checkout Conversion and Guest Cart Experience - UI Spec

**Created:** 2026-06-21
**Status:** Ready for implementation

## Objective

Make account-required checkout understandable and low-friction by preserving checkout intent, showing cart merge/review states clearly, and reusing saved shipping address data.

## Surfaces

### Account Sign-In/Register
- If reached from `/checkout`, the unauthenticated Account screen shows checkout-specific copy above the form.
- The primary auth submit button remains the existing sign-in/create-account action.
- After successful auth and cart merge, navigate back to the original checkout path.
- If cart merge fails, route to `/cart` and show cart-review context rather than silently continuing to checkout.

### Cart Page
- If authenticated cart state still includes local-only or unresolved local items, show an alert before the order summary.
- Alert copy must explain that some device-saved items need review before checkout.
- The checkout button remains visible, but checkout will also enforce the final guard.

### Checkout Page
- If unresolved local cart items exist, show an alert near the top of checkout and disable payment start.
- Shipping form pre-fills from the default saved address, falling back to first saved address and user profile fields.
- Add an authenticated checkbox: "Save this address for next time".
- Payment method copy remains hosted-checkout specific.

## Accessibility Contract

- Alerts use `role="alert"` when they represent blocking review/conflict state.
- Form labels remain explicit and associated with inputs through existing label nesting/adjacency.
- Buttons preserve minimum tap targets and disabled states.
- Checkout-specific copy must not rely on color alone.

## Responsive Contract

- Existing one-column mobile and two-column desktop checkout layout stays intact.
- Cart/checkout alerts are full-width within the page content and must not overlap sticky summary panels.
- Button text must fit at mobile widths without viewport-scaled font sizing.

## Visual Tone

- Use existing PLASHOE neutral background, dark text, and primary green action color.
- Avoid new decorative sections or card nesting.
- Keep copy concise and operational; this is a checkout flow, not a landing page.

## Acceptance Checks

- Unauthenticated checkout intent is visible on Account.
- Authenticated unresolved local items are visible before checkout payment actions.
- Saved address fields are populated without layout shift.
- Disabled checkout state is visually and programmatically disabled.

---

*Phase: 17-checkout-conversion-and-guest-cart-experience*
