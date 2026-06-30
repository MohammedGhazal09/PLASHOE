# Phase 23 Context

## Existing Evidence
- `Frontend/Ecommerce-main/my-app/src/pages/AdminConsole.jsx` renders section buttons and one active admin component.
- `Frontend/Ecommerce-main/my-app/src/api/adminApi.js` centralizes admin API wrappers.
- `Backend/app.js` already mounts admin order, return, and lookbook routes under `/api/admin/*`.
- Admin protection uses `protect` and `admin` middleware.
- Existing models provide the needed aggregate fields: `Order.total`, `Order.status`, `Order.paymentStatus`, `Product.stock`, `ReturnRequest.status`, `ContactMessage.isRead`, and `Coupon.usedCount`.

## Constraints
- No subagents.
- Keep metrics compact and query-bounded.
- Do not expose customer-sensitive detail.
- Use existing Vitest/Supertest and React Testing Library patterns.
- UI should stay dense, operational, and consistent with the existing admin console.

## Risks
- Store counts can be empty; UI must avoid NaN and undefined labels.
- Payment revenue must not count failed, pending, or cancelled payments.
- Low-stock detail must be bounded to avoid turning the summary endpoint into a product search endpoint.
