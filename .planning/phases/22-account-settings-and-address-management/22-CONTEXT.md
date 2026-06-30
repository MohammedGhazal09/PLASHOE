# Phase 22 Context

## Existing Evidence
- `Frontend/Ecommerce-main/my-app/src/pages/Account.jsx` has a settings tab placeholder.
- `Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx` already uses `addresses.find((address) => address.isDefault) || addresses[0]`.
- `Frontend/Ecommerce-main/my-app/src/api/authApi.js` supports profile update, address add, and address delete.
- `Frontend/Ecommerce-main/my-app/src/store/authStore.js` supports profile update and add address, but not delete or set default.
- `Backend/routes/authRoutes.js` exposes protected profile, add-address, and delete-address routes.
- `Backend/controllers/authController.js` makes first/default-added addresses default, but deleting a default address can leave remaining addresses without a default.
- `Backend/validators/auth.js` already validates the address body and rejects unknown profile fields.

## Constraints
- No subagents.
- Reuse current auth and address data shape.
- Keep credential changes protected by not exposing unsupported password/email mutation.
- Use existing Vitest/Supertest and React Testing Library patterns.
- UI work follows the existing account dashboard style and `npx ui-skills start` accessibility guidance.

## Risks
- Address subdocument IDs are Mongoose-generated; default selection must handle missing or stale IDs safely.
- Auth store persistence must update `sessionStorage` through Zustand state changes.
- Checkout relies on the same stored `user.addresses` value, so address mutations must return the full updated list.
