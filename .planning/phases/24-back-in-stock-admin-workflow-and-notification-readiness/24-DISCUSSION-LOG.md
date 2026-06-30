# Phase 24 Discussion Log

## Decisions

- Use existing back-in-stock model status values: `pending`, `notified`, and `cancelled`.
- Add admin APIs to the existing back-in-stock route instead of creating a separate admin resource namespace.
- Make the list endpoint paginated and bounded with a max limit of 100.
- Use row-level email visibility only in the admin list; summary data returns email counts only.
- Keep the UI default filter on `pending` so admins land on actionable demand.

## Recommendations

- Implement newsletter/unsubscribe/suppression before connecting any provider send workflow.
- Add bulk notification only after audit logging, rate limits, suppression checks, and provider retry behavior are specified.
- Replace the raw Product ID filter with a reusable product picker in Phase 27, which is already queued for admin merchandising workflows.

## Risks

- Product-name search in the admin list is helpful but limited to product name matching; richer product selection should wait for Phase 27.
- Marking a row `notified` is not evidence that a real customer notification was sent.
