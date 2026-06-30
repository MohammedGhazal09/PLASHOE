# Implementation Plan

1. Add a demo-admin React context set by `AdminRoute`.
2. Update `AdminRoute` to redirect only unauthenticated users and mark authenticated non-admins as demo users.
3. Update `AdminConsole` to enable admin API demo mode, show the notice, and disable active-section controls.
4. Add demo admin sample data and mutation guards to `adminApi`.
5. Update route/API tests for signed-out, non-admin demo access, real admin access, sample reads, and blocked mutations.
6. Run focused frontend tests and visual/design QA for `/admin`.
