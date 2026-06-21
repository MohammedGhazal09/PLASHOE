# Phase 20 Context

## Current State
- Cart and checkout already use current backend product prices and stock checks.
- Orders store product ids, sizes, quantities, names, images, and historical prices.
- Product detail already renders bounded related products.
- Wishlist and account flows exist, so retention features should integrate with existing surfaces.

## Constraints
- Do not send actual lifecycle messages in this phase.
- Do not add provider secrets, contact-list exports, or background jobs.
- Keep recommendations bounded and explainable.
- Keep reorder server-side so stale client prices cannot be replayed.

