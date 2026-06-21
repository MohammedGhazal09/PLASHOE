# Phase 18: Returns Exchanges and Refund Requests - UI Spec

**Created:** 2026-06-21
**Status:** Ready for implementation

## Objective

Expose a practical return/exchange request flow on customer order detail and an operator queue in the admin console without introducing a new visual system.

## Customer Order Detail

- Add a `Returns & Exchanges` section below order items/tracking.
- Show existing requests for the order with request number, type, status, and latest update.
- If eligible, show a compact form:
  - Request type: return or exchange.
  - Item selector.
  - Quantity.
  - Reason.
  - Desired exchange size only for exchanges.
  - Optional customer notes.
- If ineligible, show concise policy copy explaining the order is not currently eligible.
- Successful submission reloads request list and keeps the shopper on the order detail page.

## Admin Console

- Add a `Returns` section to the admin console navigation.
- Show a dense queue table with request number, customer, order, type, status, item count, requested amount, and created date.
- Detail panel shows items, customer notes, status history, refund intent, and action form.
- Admin action form supports approve, reject, receive, resolve, and note entry.

## Accessibility Contract

- Loading states use `role="status"`.
- Blocking errors use `role="alert"`.
- Form fields have visible labels.
- Buttons have direct action labels.
- Status updates are text, not color-only.

## Responsive Contract

- Customer order detail remains a one-column mobile layout and desktop grid.
- Admin returns queue may use horizontal table scrolling, matching Admin Orders.
- Detail/action form stacks on mobile and uses a two-column layout on desktop.

## Visual Tone

- Use existing PLASHOE white panels, gray borders, primary green actions, red error alerts, and compact admin typography.
- Keep cards shallow; do not nest decorative cards.

## Acceptance Checks

- Customer can see and submit an eligible RMA request.
- Customer sees ineligible policy copy for non-delivered or refunded orders.
- Admin can inspect an RMA and update status.
- Mobile customer order detail does not overlap request form, order summary, or footer.
