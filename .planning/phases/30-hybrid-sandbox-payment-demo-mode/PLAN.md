# Implementation Plan

1. Update `paymentService` to choose Stripe or mock provider by environment.
2. Add mock checkout URL generation from `FRONTEND_URL`.
3. Add a protected mock outcome endpoint under order routes.
4. Drive approve/decline/cancel through existing payment state transitions.
5. Add `ordersApi.completeMockPayment`.
6. Add `CheckoutMockPayment` page and route.
7. Update checkout and return page copy for sandbox mode.
8. Add backend and frontend tests for provider selection and outcomes.
9. Run focused tests, build, and visual/design QA for checkout/admin surfaces.
