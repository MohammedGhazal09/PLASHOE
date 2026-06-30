# Phase 29: Demo Admin Portfolio Access and Safe Preview Mode

## Outcome
Authenticated non-admin users can open the admin console as a portfolio demo without receiving real administrative authority.

## Requirements
- Keep signed-out users redirected to account sign-in.
- Let signed-in non-admin users reach `/admin` in demo mode.
- Show a visible notice explaining that this is a portfolio preview and why actions are restricted.
- Serve sample admin read data in demo mode instead of calling protected admin endpoints.
- Disable admin controls in demo mode and block all admin mutations at the API wrapper.
- Keep real admin accounts on the existing full-access path.

## Non-goals
- No real admin role escalation.
- No backend authorization relaxation.
- No writes from demo-admin accounts.

## Acceptance
- Signed-out `/admin` still redirects.
- Non-admin `/admin` renders the console with sample data and a restriction notice.
- Demo controls are disabled in the active admin panel.
- Demo mutation wrappers reject before making HTTP calls.
- Real admin behavior remains unchanged.
