# Phase 20 Spec: Retention Lifecycle Commerce and Personalization

## Objective
PLASHOE should support repeat purchase and retention workflows without committing to an external messaging provider, storing contact lists in code, or introducing invasive behavioral tracking.

## Requirements
- V2-RET-01: Shoppers can request back-in-stock notifications by product and size.
- V2-RET-02: Account and order surfaces support reorder or buy-again flows when products are still available.
- V2-RET-03: Abandoned-cart recovery is designed with explicit opt-in, privacy, and provider boundaries.
- V2-RET-04: Recommendations are explainable, bounded, and do not require invasive tracking.
- D-03: No subagents.
- D-64: Lifecycle messaging must be opt-in and avoid committing provider secrets or contact lists.

## Recommendation
Implement durable opt-in intent capture and local commerce flows now, while deferring actual email/SMS delivery to a provider integration phase. Recommendation logic should be deterministic and explainable, based on product catalog relationships rather than user tracking.

## Acceptance Criteria
- Back-in-stock requests persist product, size, email, consent, and pending status.
- Available products reject back-in-stock requests with a clear conflict.
- Reorder endpoint rebuilds cart lines from current product data and skips unavailable items with machine-readable conflicts.
- Product detail exposes back-in-stock intent and explanation-based recommendations.
- Order detail exposes a buy-again action.
- Docs and tests describe provider/privacy boundaries for abandoned-cart recovery.

