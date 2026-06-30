# Phase 23 Spec: Admin Metrics Dashboard and Store Health Snapshot

## Goal
Operators can see the store's current health, revenue, fulfillment, inventory, returns, and message workload from the admin console.

## Requirements
- V3-ADMSTAT-01: A protected admin summary API returns bounded metrics for paid revenue, order status, low stock, open returns, unread messages, and coupon usage.
- V3-ADMSTAT-02: The admin console shows a compact dashboard section with loading, error, empty, and populated states.
- V3-ADMSTAT-03: Metrics are computed server-side through admin-protected queries and avoid customer-sensitive detail.

## Recommendation
Add a narrow `/api/admin/summary` endpoint and a first admin-console Dashboard section. Keep the response aggregate-only except for a bounded low-stock product list used for operational triage.

## In Scope
- Paid revenue and paid order count.
- Order fulfillment status and payment status counts.
- Product count, low-stock count, out-of-stock count, and up to five low-stock products.
- Open return count by status.
- Unread contact-message count.
- Active coupon count and total coupon redemptions.
- Backend aggregation tests, frontend API wrapper tests, dashboard UI tests, build, visual QA, and review artifacts.

## Out of Scope
- General analytics/event tracking.
- Time-series charts.
- Customer-level drilldowns.
- Export/download features.
- Provider or hosted monitoring integration.

## Acceptance Criteria
- Non-admin users cannot access the summary endpoint.
- Empty stores return zeroed metrics instead of errors.
- Populated stores return bounded aggregate data with no customer email/address/payment detail.
- Dashboard handles loading, error, empty, and populated states.
- Admin console exposes Dashboard as a reachable section.
