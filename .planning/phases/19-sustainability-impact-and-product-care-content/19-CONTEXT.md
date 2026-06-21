# Phase 19 Context

## Existing Surface
- Phase 15 already added `materials`, `careInstructions`, and `fitGuide` to the product model and product detail page.
- Admin product management currently supports core catalog fields only.
- The product detail fallback copy currently makes material and care claims even when product fields are empty.
- Our Story includes unsupported impact totals and broad claims that are not tied to sourceable product data.

## Implementation Notes
- Preserve existing catalog and product-detail behavior.
- Add sustainability as an optional nested object on products.
- Require sources for displayed environmental impact metrics and evidence-sensitive manufacturing or durability details.
- Use conservative fallback copy when product-level sustainability content is unavailable.

