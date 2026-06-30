# Plan 24-01 Summary

Added protected admin back-in-stock APIs:

- `GET /api/back-in-stock/admin/summary`
- `GET /api/back-in-stock/admin`
- `PATCH /api/back-in-stock/admin/:id/status`

The list endpoint supports bounded pagination and filters by product id, size, email, status, and search. The summary endpoint returns status counts, pending size counts, and top pending product/size demand with email counts only.
