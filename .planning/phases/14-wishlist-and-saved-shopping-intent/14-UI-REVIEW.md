---
phase: 14
slug: wishlist-and-saved-shopping-intent
status: passed
reviewed: 2026-06-20
---

# Phase 14 UI Review

## Method

Reviewed the implemented wishlist surfaces with local headless Chrome against the Phase 14 UI contract:

- Desktop viewport: `1440x900`
- Mobile viewport: `390x844`
- Local URL: `http://127.0.0.1:5174`
- Runtime flag: `REACT_APP_ENABLE_WISHLIST=true`

## Evidence

| Artifact | Surface |
| --- | --- |
| `artifacts/14-ui-smoke-home-desktop.png` | Desktop home/product-card/header wishlist smoke |
| `artifacts/14-ui-smoke-account-mobile.png` | Mobile account wishlist management smoke |
| `artifacts/14-ui-smoke-report.json` | Machine-readable smoke assertions |

## Findings

| Area | Result | Notes |
| --- | --- | --- |
| ProductCard visibility | Pass | Wishlist heart buttons were visible without hover and exposed product-specific accessible labels. |
| Header count | Pass | Header wishlist link exposed `Wishlist (0 items)` and updated to `Wishlist (1 item)` after saving. |
| Toggle state | Pass | Saved product control exposed `aria-pressed=true` after save. |
| Account wishlist | Pass | Mobile account wishlist rendered saved product details, size choices, `Move to cart`, and `Remove`. |
| Responsive overflow | Pass | Desktop measured no positive horizontal overflow; mobile measured `scrollWidth` equal to viewport width. |
| Copy and state preservation | Pass | Guest/local copy is visible for local saved items, and automated tests cover failed move-to-cart preservation plus visible wishlist load errors. |

## Notes

- The mobile smoke seeded local wishlist storage because browser-level backend persistence was out of scope for this local-only verification pass.
- The ignored local frontend `.env` disables wishlist, so local smoke explicitly set `REACT_APP_ENABLE_WISHLIST=true`. The checked-in example and docs now reflect the intended default-on behavior.

## Recommendation

For staging signoff, repeat the same desktop and mobile paths against a live backend account so visual behavior and backend persistence are verified together.
