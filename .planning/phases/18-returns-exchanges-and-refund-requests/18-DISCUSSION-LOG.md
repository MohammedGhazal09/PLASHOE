# Phase 18 Discussion Log

## Decisions

| Topic | Options | Selected | Rationale |
| --- | --- | --- | --- |
| Refund execution | Live Stripe refund, manual RMA refund intent, no refund state | Manual RMA refund intent | D-62 blocks real refunds; Stripe webhook fields stay authoritative. |
| RMA persistence | Embed on order, separate model | Separate model | Keeps request workflow queryable and avoids conflicting with payment webhook state. |
| Eligibility window | Hardcoded, env-configured | Env-configured with 30-day default | Allows local tests and future policy tuning without provider work. |
| Customer UI | Account orders only, order detail page, new standalone page | Order detail page | Closest existing surface with item, payment, and fulfillment context. |
| Admin UI | Reuse order detail only, add returns tab | Add returns tab | Operators need a queue separate from fulfillment. |

## Grey Areas Resolved With Recommendations

- **Exchange fulfillment:** record exchange request and desired size only. Do not create replacement orders in this phase.
- **Refund amount:** compute requested amount from item price and quantity; admin can record a manual resolved amount on the RMA without changing order payment fields.
- **Partial refunds:** block new return requests when the order payment state is already refunded/partially_refunded for now. This avoids conflicting with provider-origin refund state.

## Non-Goals

- Live provider refund calls.
- Warehouse receiving integrations.
- Return labels.
- Notification providers.
