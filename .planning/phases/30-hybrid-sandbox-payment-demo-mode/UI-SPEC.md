# UI Spec

## Mock Gateway Page
- Route: `/checkout/mock?orderId=:id`.
- First screen shows order number, amount, current payment status, and provider mode.
- Show explicit copy that no real money is processed and no card data is collected.
- Provide three clear outcomes: approve, decline, cancel.
- Outcome buttons are disabled while processing and after non-pending states.

## Checkout Page
- Keep the existing checkout flow and hosted-payment language.
- Add concise copy that demo deployments may use a mock gateway.

## Return Page
- Existing return page remains authoritative by refetching the order.
- If returned from mock mode, show a short sandbox outcome notice.
