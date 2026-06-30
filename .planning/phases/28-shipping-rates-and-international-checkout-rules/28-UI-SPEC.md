# Phase 28 UI Spec

## Checkout Shipping Method UI

- Show a `Shipping Method` section after shipping address fields.
- Load methods from the backend when authenticated cart, country, and cart state are ready.
- Render methods as radio options with method name, price, and estimated delivery.
- Update order summary shipping and total when the selected method changes.
- Show unsupported-country and server-error messages in a visible alert.
- Disable the payment button while rates load, when a country is unsupported, or when no method is selected.

## Accessibility

- Inputs must have programmatic labels.
- Shipping methods must be keyboard-selectable radio controls.
- Error states must use visible alert content.

## Responsive Behavior

- Desktop keeps the existing two-column checkout layout.
- Mobile stacks address form, method selection, payment copy, and order summary without horizontal overflow.
