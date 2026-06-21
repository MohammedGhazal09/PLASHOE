# Phase 19 UI Spec

## Product Detail
- Keep materials and care near purchase decision context.
- Add a sustainability details section below the buy box.
- Show:
  - Summary and source when both are present.
  - Impact metrics only when label, value, and source are present.
  - Manufacturing details only when a source is present.
  - Durability details only when a source is present.
  - Certifications with issuer context.
- Fallback: "Sustainability details are not available for this product yet."

## Admin Products
- Add textarea controls for:
  - Materials: `Label: Value`
  - Care instructions: one per line
  - Impact metrics: `Label | Value | Unit | Source`
  - Certifications: `Name | Issuer | URL`
- Add text inputs/textareas for summary, source, manufacturing, and durability fields.

## Our Story
- Remove unsupported numeric impact totals.
- Use story copy that emphasizes source-backed product evidence and care guidance.

