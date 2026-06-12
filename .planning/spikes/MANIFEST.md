# Spike Manifest

## Idea

Use small, runnable experiments to de-risk PLASHOE before production hardening. The first spike focuses on the storefront purchase path because it is the highest-value workflow and already has known mismatches across frontend pages, API wrappers, backend routes, and controllers.

## Requirements

- Keep spike experiments self-verifying when possible so results can be re-run without external services.
- Do not read local `.env` files in spikes; use source files, examples, and generated docs only.
- Prioritize core ecommerce reliability before adding new customer-facing features.

## Spikes

| # | Name | Type | Validates | Verdict | Tags |
|---|------|------|-----------|---------|------|
| 001 | core-flow-contract-check | standard | Given the current PLASHOE source, when a static contract checker scans the storefront purchase path, then it identifies route/API/UI mismatches without needing MongoDB or browser setup. | VALIDATED | reliability, checkout, api-contracts, testing |
