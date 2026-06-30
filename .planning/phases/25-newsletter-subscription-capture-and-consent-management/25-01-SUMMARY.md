# Plan 25-01 Summary

Added newsletter backend lifecycle:

- `POST /api/newsletter`
- `POST /api/newsletter/unsubscribe/:token`
- `GET /api/newsletter/admin/summary`
- `GET /api/newsletter/admin`

The public subscribe endpoint is consent-backed and duplicate-safe. Admin endpoints are protected and omit unsubscribe tokens.
