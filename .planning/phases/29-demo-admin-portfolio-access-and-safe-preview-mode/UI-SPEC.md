# UI Spec

## Demo Admin Notice
- Place a notice above the active admin section.
- Copy: explain portfolio preview, sample data, and read-only restriction.
- Use existing admin visual language: border, white background, restrained text.

## Interaction Rules
- Sidebar navigation remains enabled so reviewers can inspect sections.
- Active section controls are disabled in demo mode.
- Disabled state applies consistently to forms, filters, pagination, action buttons, and destructive buttons.
- Real admins see no demo notice and no disabled wrapper.

## Accessibility
- Notice uses `role="status"` and is referenced by the disabled fieldset.
- The disabled fieldset has a screen-reader-only legend.
- No hidden write controls remain keyboard-focusable in demo mode.
