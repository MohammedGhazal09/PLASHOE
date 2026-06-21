---
phase: 13
slug: admin-store-management-console
status: approved
shadcn_initialized: false
preset: none
created: 2026-06-20
---

# Phase 13 - UI Design Contract

> Visual and interaction contract for the protected PLASHOE admin store management console.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | MUI plus existing Tailwind utility styling |
| Icon library | Existing MUI icons or FontAwesome icons; no new icon package |
| Font | Inter, system-ui, sans-serif |

### Product Surface

- Surface type: operational ecommerce admin console.
- Tone: calm, dense, scannable, and action-oriented.
- First screen: the admin console itself, not a marketing or explanatory landing page.
- Primary user: store operator managing orders, products, coupons, and contact messages repeatedly.

---

## Spacing Scale

Declared values use 4px multiples.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, badge padding, inline metadata |
| sm | 8px | Compact controls, table cell internal gaps |
| md | 16px | Form fields, filter rows, section gutters |
| lg | 24px | Page padding on mobile and compact panels |
| xl | 32px | Desktop page gutters and major layout gaps |
| 2xl | 48px | Separation between unrelated admin sections |
| 3xl | 64px | Reserved for full-page empty states only |

Exceptions: none.

### Layout Contracts

- Admin shell uses one persistent navigation area and one main work area.
- Desktop target: left navigation width 220px to 260px; main content uses the remaining width.
- Mobile target: navigation collapses above the content as tabs or a compact menu; workflows remain reachable without horizontal page scrolling.
- Page content max width may be constrained for forms, but data tables should use available width with responsive columns.
- Cards are allowed for individual repeated records or modal/dialog content only. Do not place cards inside cards.
- Tables and fixed admin controls must have stable dimensions so loading text, badges, and hover states do not resize the layout.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.5 |
| Label | 12px | 600 | 1.35 |
| Heading | 20px | 600 | 1.3 |
| Display | 28px | 600 | 1.2 |

### Typography Rules

- Do not scale font size with viewport width.
- Letter spacing is `0`.
- Admin page headings stay compact; no hero-scale type inside the console.
- Table metadata can use 12px labels, but action buttons must remain readable and touch-friendly.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #ffffff | Main workspace background and table surfaces |
| Secondary (30%) | #f1f1ef | Admin shell background, filter bands, inactive rows |
| Accent (10%) | #6e7051 | Active nav item, primary action, focus accents |
| Text | #262b2c | Body text, headings, primary metadata |
| Muted text | #6b6f68 | Secondary metadata and helper text |
| Border | #d9d9d2 | Table dividers, form field borders, panel boundaries |
| Success | #2f6f4e | Paid, shipped, completed, active statuses |
| Warning | #9a6a13 | Pending, attention-needed, unread statuses |
| Destructive | #b42318 | Delete actions and destructive confirmations only |

Accent reserved for: active admin navigation, primary submit buttons, focused form controls, selected filters, and one primary status/action per view.

Color constraints:
- Do not use a page-wide gradient or decorative orb background.
- Do not create a one-note olive interface. Neutral white/gray surfaces must dominate.
- Status colors must include text labels; color alone is not the only signal.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Admin console heading | Store Admin |
| Orders section | Orders |
| Products section | Products |
| Coupons section | Coupons |
| Messages section | Messages |
| Primary order CTA | Update fulfillment |
| Primary product CTA | Save product |
| Primary coupon CTA | Create coupon |
| Contact action CTA | Mark as read |
| Empty orders heading | No orders match these filters |
| Empty orders body | Adjust filters or clear the search to review recent orders. |
| Empty products heading | No products found |
| Empty products body | Add a product or change the current filters. |
| Empty coupons heading | No coupons found |
| Empty coupons body | Create a coupon when a promotion is ready. |
| Empty messages heading | No contact messages found |
| Empty messages body | New customer messages will appear here. |
| Error state | We could not load this admin data. Check your connection and try again. |
| Forbidden state | You need an admin account to view this page. |
| Destructive confirmation | Delete: This cannot be undone. Continue? |

Copy rules:
- Use direct verbs for buttons.
- Do not include instructional paragraphs about how the console works.
- Error states state the problem and the immediate recovery path.

---

## Screen Contracts

### Admin Guard

- Unauthenticated state: redirect to `/account` using the existing return-location pattern.
- Authenticated non-admin state: render a compact forbidden view or safe redirect selected during implementation.
- Admin state: render the admin shell and default to orders.

### Admin Shell

- Required sections: Orders, Products, Coupons, Messages.
- Navigation item format: icon plus label.
- Active section: high-contrast text plus accent indicator.
- Header content: page title, short count/status metadata, and primary action when relevant.
- Avoid duplicate global headers inside nested admin views.

### Orders View

- List: order number, customer summary, payment status, fulfillment status, total, item count, created date, and primary detail action.
- Filters: search, status, payment status, created date range, page, and limit where backend supports them.
- Detail: user summary, shipping address, line items, totals, payment status, fulfillment state, carrier, tracking number, tracking history, and timestamps.
- Fulfillment form: status, carrier, tracking number, note/history field where supported by backend.
- Conflict/validation feedback: display backend message and keep the operator on the same record.

### Products View

- List: product name, category, gender, price, sale price if present, stock, active/available state if present, and actions.
- Form: fields documented by `docs/API.md` and the Product model only.
- Delete: requires confirmation before sending request.
- Image handling: URL/text fields only unless an existing endpoint supports upload. Do not invent upload UI.

### Coupons View

- List: code, active state, discount type/value, validity dates, usage information where available, and delete action.
- Create form: coupon fields supported by the existing backend create endpoint.
- Editing: not required unless an existing backend update endpoint is present.

### Messages View

- List: sender summary, subject/message preview, read state, created date, and actions.
- Detail or expandable row: show full message without breaking table layout.
- Actions: mark as read and delete where supported.

---

## Responsive Contract

| Viewport | Layout |
|----------|--------|
| 320px to 767px | Top admin section navigation, stacked filters, horizontally safe record rows or table-to-list adaptation |
| 768px to 1023px | Compact side navigation or two-column shell, tables with reduced optional columns |
| 1024px and above | Persistent side navigation, table-first layouts, detail panel or route-level detail content |

Responsive rules:
- No text may overlap controls at mobile widths.
- Touch targets for icon-only or compact buttons must be at least 44px by 44px.
- Tables may hide non-critical columns on smaller screens, but primary identity, status, and action remain visible.

---

## Accessibility Contract

- Admin navigation uses semantic links or buttons with visible focus styles.
- Icon-only buttons require accessible names.
- Dialogs must trap focus and return focus to the trigger on close.
- Form fields require visible labels and error text connected to the input where practical.
- Status chips must include readable text, not just color.
- Destructive actions require keyboard-accessible confirmation.
- Loading states use `role="status"` or equivalent visible status text where appropriate.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party registry | none | not allowed for this phase |

No registry UI blocks are approved for Phase 13. Use existing dependencies and local components.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-06-20

## Checker Notes

- Copywriting uses concrete operator labels and recovery-oriented error states.
- Visuals match an operational admin console and avoid landing-page or decorative treatment.
- Color palette is neutral-dominant with restrained PLASHOE accent use.
- Typography is fixed, compact, and suitable for tables/forms.
- Spacing is based on 4px multiples with stable table/control dimensions.
- Registry safety passes because no third-party registry blocks are used.
