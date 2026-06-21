# Phase 19 Spec: Sustainability Impact and Product Care Content

## Objective
Product detail, admin product management, and story surfaces must communicate materials, product care, sustainability, manufacturing, and durability information without inventing unsupported environmental claims.

## Requirements
- V2-SUS-01: Product records store structured material, sustainability, manufacturing, durability, and care content.
- V2-SUS-02: Admin product management can maintain those fields through the existing admin product form.
- V2-SUS-03: Product detail and story surfaces render sustainability content with a conservative fallback when content is missing.
- D-03: No subagents.
- D-63: Do not display environmental claims without sourceable product fields.

## Recommendation
Extend the existing Phase 15 product detail contract instead of creating a new marketing-claims subsystem. Sustainability fields should be product-scoped, optional, and source-backed, so the UI can render evidence when present and safe fallback copy when missing.

## Acceptance Criteria
- Backend product schema and validators accept `sustainability.summary`, `sustainability.source`, source-backed impact metrics, certifications, manufacturing, and durability fields.
- Admin product create/update payloads include materials, care instructions, and sustainability fields from documented textarea formats.
- Product detail renders materials, care, sustainability metrics, manufacturing, durability, and certifications only from captured product fields.
- Our Story avoids unsupported numeric impact totals and points shoppers toward product-level evidence.
- Tests cover backend detail payloads, validation, normalization, product detail rendering, and admin payload creation.

