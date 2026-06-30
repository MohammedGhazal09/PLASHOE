# Phase 31 UI Spec

## Checkout Page

- Existing checkout form, shipping method selector, totals, coupon controls, and payment button remain in place.
- Payment copy must clearly say payment opens in a secure hosted PayPal sandbox checkout when PayPal mode is active.
- The copy must also say PLASHOE does not collect or store card details.
- If the backend returns mock mode, the current mock-gateway copy remains valid.
- Do not add a PayPal button component or embedded card field in this phase.

## PayPal Redirect

- The checkout submit button continues to redirect to the provider URL returned by the backend.
- No extra confirmation modal.
- No card input in PLASHOE.

## Return Page

- Success return must support PayPal query params: `orderId` from PLASHOE and `token` from PayPal.
- While capture is running, show concise copy: "Confirming PayPal sandbox payment..."
- After capture/refetch, show the existing order status panel.
- If capture fails, show a recoverable error and keep links to account orders and collection.
- Cancel return keeps the existing canceled page behavior.

## Visual Constraints

- Keep the current quiet checkout layout and card sizes.
- No new palette.
- Text must fit on mobile and desktop.
- Notices use existing border/background patterns already used for mock sandbox and shipping errors.

## Accessibility

- Capture/cancel notices must use readable text, not color alone.
- Loading text must be visible while capture is pending.
- Buttons and links keep existing keyboard behavior.

## Verification

- Frontend tests cover PayPal return capture loading/success/error states.
- Visual QA captures checkout desktop, PayPal return desktop, and mobile return page.
