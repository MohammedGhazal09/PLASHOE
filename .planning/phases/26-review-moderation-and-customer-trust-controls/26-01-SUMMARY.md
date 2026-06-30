# Plan 26-01 Summary

Added protected admin review moderation endpoints:

- `GET /api/admin/reviews`
- `GET /api/admin/reviews/:id`
- `PATCH /api/admin/reviews/:id/moderation`

Moderation changes recalculate product rating aggregates from approved reviews only.
