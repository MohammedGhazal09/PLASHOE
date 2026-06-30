# Phase 31: Implement PayPal sandbox checkout provider support

**Created:** 2026-06-30
**Ambiguity score:** 0.10 (gate: <= 0.20)
**Requirements:** 6 locked

## Goal

PLASHOE checkout uses PayPal sandbox hosted checkout as the visible payment-provider path when PayPal sandbox configuration is present, while keeping the existing mock gateway as a fallback.

## Background

Phase 30 added a Stripe-or-mock payment demo. The current backend only selects Stripe when Stripe variables are complete; otherwise it returns the internal mock gateway. The user cannot create a Stripe or Moyasar merchant account for this portfolio project, but has PayPal sandbox credentials and a webhook ID. The missing capability is a real PayPal sandbox provider path that creates a PayPal order, redirects the shopper to PayPal approval, captures after return, and accepts verified PayPal webhook events.

## Requirements

1. **PayPal provider selection**: Runtime payment mode must support `paypal` in addition to existing `stripe` and `mock`.
   - Current: `Backend/config/env.js` and `Backend/services/paymentService.js` only select Stripe or mock.
   - Target: `PAYMENT_PROVIDER=paypal` with complete PayPal sandbox config selects PayPal; incomplete config falls back to mock.
   - Acceptance: Backend config tests prove PayPal, Stripe, incomplete-config fallback, and `PAYMENTS_ENABLED=false` behavior.

2. **Hosted PayPal checkout**: Checkout must create a PayPal Orders v2 order and redirect shoppers to PayPal's approval URL.
   - Current: `paymentProvider.createCheckoutSession` creates Stripe sessions only, or mock sessions.
   - Target: PayPal mode creates a PayPal `CAPTURE` order with PLASHOE metadata/custom id and returns the `rel=approve` URL.
   - Acceptance: Checkout API response includes `provider: "paypal"`, a PayPal approval URL, and the PayPal order id as the provider session id.

3. **Return capture**: PayPal success returns must capture the approved PayPal order and update the local order payment state.
   - Current: `/checkout/success` only refetches order state; Stripe relies on webhooks and mock relies on its mock endpoint.
   - Target: For PayPal orders, the return page triggers an authenticated backend capture endpoint using the PayPal token/order id and local order id.
   - Acceptance: A focused backend test proves capture marks the order `paid`, persists capture id, and remains owner-only/idempotent for paid orders.

4. **PayPal webhook handling**: The backend must expose `/api/webhooks/paypal` and process verified PayPal events idempotently.
   - Current: Only `/api/webhooks/stripe` exists.
   - Target: PayPal webhook handler verifies PayPal headers with PayPal's verify-signature API, claims `PaymentEvent` rows with provider `paypal`, and updates the same order payment states used by Stripe/mock.
   - Acceptance: Webhook tests cover invalid verification rejection, duplicate event no-op, capture completed, capture denied/declined, approval reversed, and refunded events.

5. **Frontend transparency**: Checkout and return UI must clearly indicate PayPal sandbox behavior without collecting card data in PLASHOE.
   - Current: Checkout copy mentions generic hosted checkout and possible mock gateway.
   - Target: Checkout copy names secure hosted PayPal sandbox when active provider data says PayPal; return page shows PayPal sandbox capture/confirmation state.
   - Acceptance: Frontend tests and visual QA cover checkout payment copy and PayPal return capture states.

6. **Secret safety and fallback**: PayPal credentials must remain backend-only and never be committed or exposed to frontend bundles/logs.
   - Current: local `.env` contains ignored PayPal credentials; source does not use them yet.
   - Target: Only backend env variables read PayPal secrets; docs list required Render variables without secret values.
   - Acceptance: Source search finds no pasted PayPal secret, tests/log redaction do not expose PayPal secrets, and `.env` stays ignored.

## Boundaries

**In scope:**
- Backend env validation for `PAYMENT_PROVIDER=paypal`, `PAYPAL_ENV`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, and return URLs.
- PayPal Orders v2 create/capture helpers implemented with native `fetch`; no new dependency.
- Checkout API response and order persistence for provider `paypal`.
- Protected local capture endpoint for PayPal success returns.
- Public raw-body PayPal webhook route with signature verification through PayPal's verify-signature API.
- Frontend checkout/return copy and capture call using existing route structure.
- Focused backend/frontend tests, docs, build, and browser visual QA.

**Out of scope:**
- Live PayPal production payments - portfolio demo stays sandbox.
- PayPal JS buttons or embedded card fields - hosted redirect is the smaller provider-visible path.
- Saving PayPal payment methods, subscriptions, disputes, payouts, or marketplace flows - separate product scope.
- Manual refund initiation in PLASHOE admin - existing webhook refund-state handling only.
- Storing PayPal credentials in frontend code or planning artifacts.

## Constraints

- Preserve existing Stripe behavior for projects that can use Stripe.
- Preserve mock fallback for missing or disabled payment config.
- Do not store card numbers, fake card data, PayPal buyer credentials, or secret keys.
- Use server-owned order totals from the existing checkout service; do not trust frontend totals.
- Keep code changes scoped to existing payment service/provider/webhook boundaries unless a small route/API addition is needed.
- Use official PayPal REST APIs and sandbox endpoints: `api-m.sandbox.paypal.com` for sandbox, `api-m.paypal.com` for live.

## Acceptance Criteria

- [x] `PAYMENT_PROVIDER=paypal` with complete sandbox vars selects `paymentProviderMode: "paypal"`.
- [x] Missing PayPal vars or `PAYMENTS_ENABLED=false` falls back to mock without crashing checkout.
- [x] Checkout creates a PayPal provider-backed order and returns the approval URL.
- [x] PayPal success return captures payment through a protected backend endpoint and marks the order paid.
- [x] PayPal webhook route rejects failed verification and processes valid events idempotently.
- [x] Checkout/return UI names PayPal sandbox and does not collect card data.
- [x] Focused backend and frontend tests pass.
- [x] Production build passes.
- [x] Hercules/Playwright visual QA verifies the PayPal checkout/return surfaces.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.95 | 0.75 | met | Provider goal is PayPal sandbox hosted checkout. |
| Boundary Clarity | 0.92 | 0.70 | met | Redirect/capture/webhook in, live payments/buttons out. |
| Constraint Clarity | 0.86 | 0.65 | met | Backend-only secrets, sandbox, no new dependency. |
| Acceptance Criteria | 0.88 | 0.70 | met | API, UI, webhook, tests, build, and visual QA are pass/fail. |
| **Ambiguity** | 0.10 | <=0.20 | met | Auto-approved recommendations per mission file. |

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | What exists today? | Stripe/mock services exist; PayPal does not. |
| 2 | Simplifier | What is the smallest useful PayPal demo? | Hosted redirect plus server capture; no PayPal JS buttons. |
| 3 | Boundary Keeper | What stays out? | Live payments, frontend secrets, subscriptions, saved methods, admin refunds. |
| 4 | Failure Analyst | What would make this unsafe? | Unverified webhooks, exposed secrets, frontend totals, or broken mock fallback. |
| 5 | Seed Closer | What proves completion? | Focused tests, build, and visual QA against real rendered payment surfaces. |

---

*Phase: 31-implement-paypal-sandbox-checkout-provider-support*
*Spec created: 2026-06-30*
*Next step: gsd-discuss-phase 31 - implementation decisions*
