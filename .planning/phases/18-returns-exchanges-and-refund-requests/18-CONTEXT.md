# Phase 18 Context - Returns Exchanges and Refund Requests

## Current State

- Orders have fulfillment states, `deliveredAt`, payment states, and Stripe-origin refund fields.
- Stripe webhook processing updates `Order.paymentStatus`, `refundAmount`, and `refundRecords`.
- Admin order management supports list/detail and fulfillment transitions.
- Customer order detail supports order tracking and cancellation for eligible orders.

## Key Constraints

- Do all work inline; no subagents.
- Do not initiate real refunds without explicit product and payment-provider policy.
- Do not weaken Phase 4/5 payment, stock, coupon, checkout retry, or webhook guarantees.
- Preserve ownership boundaries: customers only see their own RMA requests; admins can see all.

## Recommended Implementation Shape

- Add a `ReturnRequest` model instead of embedding mutable request state in `Order`.
- Add a service that owns eligibility and status transitions.
- Mount customer routes at `/api/returns`.
- Mount admin routes at `/api/admin/returns`.
- Add frontend wrappers in `returnsApi.js` and admin wrapper methods in `adminApi.js`.
- Add customer UI to `OrderDetail.jsx` and admin queue UI to `AdminConsole`.

## Evidence Targets

- Backend focused: `npm test -- return-request.test.js payment-webhook.test.js`.
- Frontend focused: `npm test -- returnsApi.test.js adminApi.test.js OrderDetail.test.jsx AdminReturns.test.jsx`.
- Full frontend/build after UI edits.
- Browser smoke for customer RMA form and admin RMA queue if time permits.
