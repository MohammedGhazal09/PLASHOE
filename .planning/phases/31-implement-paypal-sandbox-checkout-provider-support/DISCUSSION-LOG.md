# Phase 31 Discussion Log

**Date:** 2026-06-30
**Mode:** Auto-approved recommendations per mission file

## Questions And Decisions

1. **Which provider path should be visible to recruiters?**
   - Options: keep mock only, Stripe test mode, PayPal sandbox.
   - Recommendation: PayPal sandbox.
   - Why: User has PayPal sandbox credentials and cannot use Stripe/Moyasar account setup.
   - Decision: PayPal sandbox.

2. **Hosted redirect or PayPal JS buttons?**
   - Options: hosted redirect, PayPal buttons, both.
   - Recommendation: hosted redirect first.
   - Why: It matches the current checkout provider URL contract and is the smallest provider-visible integration.
   - Decision: hosted redirect.

3. **When should PayPal be selected?**
   - Options: auto-detect any PayPal vars, explicit `PAYMENT_PROVIDER=paypal`, replace Stripe.
   - Recommendation: explicit `PAYMENT_PROVIDER=paypal`.
   - Why: Avoid surprising existing Stripe behavior and make Render setup clear.
   - Decision: explicit selector.

4. **How should success be confirmed?**
   - Options: webhook only, return capture only, both.
   - Recommendation: both.
   - Why: Return capture gives immediate portfolio UX; webhook support proves provider-grade reconciliation.
   - Decision: return capture plus verified webhooks.

5. **What fallback should exist?**
   - Options: fail checkout on missing PayPal vars, mock fallback, keep Stripe fallback.
   - Recommendation: mock fallback.
   - Why: The portfolio site should still be demoable when provider config is missing or deployment env is not ready.
   - Decision: mock fallback.

## Auto-Approved Recommendation Summary

- Use PayPal sandbox hosted checkout as Phase 31's visible provider.
- Keep Stripe code intact.
- Keep mock gateway fallback.
- Use backend-only PayPal REST calls with native `fetch`.
- Add protected capture endpoint and public verified webhook endpoint.
- Update docs and UI copy without exposing secrets.

## Deferred

- PayPal JS SDK buttons.
- Live PayPal production launch.
- Saved payment methods and subscriptions.
