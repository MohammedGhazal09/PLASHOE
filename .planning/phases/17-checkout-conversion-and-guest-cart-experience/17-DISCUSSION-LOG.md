# Phase 17: Checkout Conversion and Guest Cart Experience - Discussion Log

**Date:** 2026-06-21
**Mode:** Auto-approved recommendations per user instruction

## Recommendation Summary

The recommended product decision is account-required checkout with robust guest-cart merge on sign-in/register. This is preferred over true guest checkout because the current backend order model, payment metadata, order history, idempotency, stock, coupon, and cart-clearing guarantees are all authenticated-user based.

## Decisions Presented and Locked

| Area | Options considered | Approved recommendation | Reason |
|------|--------------------|-------------------------|--------|
| Checkout policy | True guest checkout, account-required merge, defer policy | Account-required merge | Preserves Phase 4 checkout integrity and fits current `Order.user` and protected order routes. |
| Merge location | Frontend loop over add-item API, backend merge endpoint, no merge | Backend merge endpoint | Gives one all-or-nothing validation point and avoids duplicate/lost cart lines. |
| Local-only products | Drop them, try to submit anyway, preserve and block checkout | Preserve and block checkout | Prevents silent loss and prevents payment from ignoring UI-visible local items. |
| Auth return path | Stay on Account, always Cart, return to checkout after merge | Return to checkout after successful merge | Reduces friction while still routing conflicts to Cart for review. |
| Saved address | Prefill only, save only, prefill plus optional save | Prefill default address plus optional save | Reduces repeated entry without changing backend order validation. |
| Payment semantics | Change order creation, keep current order creation | Keep current order creation | Protects idempotency, stock, coupon, payment hold, and webhook behavior. |

## Grey Areas Closed

1. True guest checkout is intentionally out of scope for Phase 17.
2. Cart merge is explicit backend API behavior, not an implicit side effect of generic `syncCart()`.
3. Merge failures preserve local cart items and block checkout until reviewed.
4. Saved address support uses existing user address model and protected address API.
5. Existing order/payment tests remain the regression baseline.

## Deferred

- Guest order creation and guest order lookup.
- Checkout analytics.
- Full address book management.

---

*Discussion log created: 2026-06-21*
