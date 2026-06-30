# Phase 22 Discussion Log

## Recommendation
Proceed with a narrow account self-service implementation. The defensible default is profile and address management only, plus an explicit credential-management notice. Password or email changes need stronger flows than this phase currently owns.

## Decisions
- Add `PUT /api/auth/addresses/:id/default` as the only new backend route.
- Keep address editing out of scope; customers can delete and recreate an address.
- Ensure deleting a default address leaves another default when addresses remain.
- Keep `email` read-only and reject profile email mutation through existing strict validation.
- Show credential management as unavailable from this local workflow instead of adding an unsafe endpoint.

## Open Questions
- Future work can add verified email-change and current-password-confirmed password-change flows.
- Future work can add address editing if address usage grows beyond the current checkout prefill contract.
