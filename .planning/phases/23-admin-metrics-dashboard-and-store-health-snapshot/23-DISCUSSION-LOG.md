# Phase 23 Discussion Log

## Recommendation
Proceed with a bounded dashboard snapshot. The safest default is aggregate metrics only, plus a small low-stock list because inventory triage is operational and does not expose customer data.

## Decisions
- Add `/api/admin/summary` as a new protected admin route.
- Use a fixed low-stock threshold of 5 units for the first dashboard pass.
- Make Dashboard the first admin console section.
- Keep time-series and custom date filtering out of this phase.

## Open Questions
- Future phases may add time windows, trend comparisons, or exportable reports once operational reporting rules are clearer.
