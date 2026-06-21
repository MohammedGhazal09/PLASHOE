# Phase 18: Returns Exchanges and Refund Requests - Specification

**Created:** 2026-06-21
**Ambiguity score:** 0.12 (gate: <= 0.20)
**Requirements:** 4 locked

## Goal

Customers and operators can handle return and exchange requests with persisted request state, eligibility checks, admin resolution, and refund-safe audit history.

## Recommended Decisions

- Keep Phase 18 as an RMA workflow and audit layer, not a live Stripe refund executor. Reason: roadmap constraint D-62 explicitly blocks real refunds without explicit product and provider policy.
- Use delivered paid/not-required orders as the initial eligibility boundary. Reason: the existing fulfillment model already records `deliveredAt`, order status, and payment state.
- Track refund intent separately from `Order.paymentStatus`, `refundAmount`, and webhook refund records. Reason: Stripe-origin refund webhooks remain the authoritative payment state mutator.

## Requirements

1. **Persisted RMA model and APIs**: Return/exchange requests have a model, customer API, admin API, and status history.
   - Acceptance: Customers can create/list/detail their own requests; admins can list/detail all requests.

2. **Eligibility rules**: Request creation accounts for order status, payment state, delivery date, item quantity, and a configured return window.
   - Acceptance: Tests reject undelivered orders, refunded/unpaid orders, expired windows, over-quantity requests, and duplicate active quantities.

3. **Admin resolution**: Admins can approve, reject, receive, resolve, and record notes for requests.
   - Acceptance: Admin status transitions append status history and reject invalid transitions.

4. **Refund consistency**: RMA refund intent does not mutate or conflict with Stripe-origin refund webhook state.
   - Acceptance: Admin resolution records manual refund notes/amounts on the RMA only and does not change `Order.paymentStatus`, `refundAmount`, or `refundRecords`.

## Boundaries

**In scope:**
- Backend RMA persistence, validation, eligibility, customer routes, admin routes, and tests.
- Customer order-detail return/exchange request UI.
- Admin console returns queue and status action UI.
- API, development, testing, and README documentation.

**Out of scope:**
- Real Stripe refund API calls.
- Automated label generation, carrier pickup, warehouse scanning integrations, or replacement-order creation.
- Email/SMS notifications.
- Policy localization or multi-window category rules.

## Acceptance Criteria

- [x] RMA requests persist with request number, type, items, eligibility snapshot, refund intent, and status history.
- [x] Customer routes enforce ownership and eligibility.
- [x] Admin routes enforce admin-only access and allowed transitions.
- [x] Frontend order detail can submit a return/exchange request for eligible delivered orders.
- [x] Admin console can inspect and update RMA requests.
- [x] Stripe webhook refund state remains authoritative for order payment fields.
- [x] Focused backend/frontend tests, build, docs, UI review, code review, and verification are complete.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
| --- | --- | --- | --- | --- |
| Goal Clarity | 0.90 | 0.75 | met | RMA workflow and non-provider refund boundary are explicit. |
| Boundary Clarity | 0.90 | 0.70 | met | Real refunds and logistics integrations are out of scope. |
| Constraint Clarity | 0.85 | 0.65 | met | Delivery, payment, quantity, and return window rules are defined. |
| Acceptance Criteria | 0.85 | 0.70 | met | Backend, frontend, docs, and verification evidence are required. |
| **Ambiguity** | 0.12 | <=0.20 | met | Ready for discussion and planning. |

## Interview Log

| Round | Perspective | Question summary | Decision locked |
| --- | --- | --- | --- |
| 1 | Policy | Should Phase 18 issue real refunds? | No; record manual refund intent only. |
| 2 | Eligibility | What order states qualify? | Delivered orders within window with paid/not-required payment state. |
| 3 | Inventory | How should item quantities be bounded? | Request quantities cannot exceed delivered quantity minus non-cancelled/non-rejected RMA quantities. |
| 4 | Admin | What transitions are supported? | Requested -> approved/rejected, approved -> received, received -> resolved. |
| 5 | UX | Where does the customer act? | Order detail page, with admin management in the admin console. |

---

*Phase: 18-returns-exchanges-and-refund-requests*
*Spec created: 2026-06-21*
