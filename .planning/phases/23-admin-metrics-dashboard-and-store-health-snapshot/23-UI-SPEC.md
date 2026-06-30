# Phase 23 UI Spec

## Admin Dashboard
- Add Dashboard as the first admin console section.
- Header shows the snapshot timestamp and a refresh button.
- Summary metric tiles show paid revenue, paid orders, open returns, and unread messages.
- Secondary panels show fulfillment statuses, payment statuses, inventory health, coupon usage, and low-stock products.
- Loading state uses a role=status message.
- Error state includes a retry button.
- Empty state explains that no operational activity is available yet.

## Accessibility and Hardening
- Dashboard buttons use native button elements and accessible names.
- Metric labels are visible text, not color-only.
- Long product names wrap without breaking layout.
- Large numbers use `Intl.NumberFormat`.
- Missing or unknown metric keys render as zero or `Unknown`.
