# Normalized Brand Profile Contract

Canonical file: `normalized-brand-profile.md`

Canonical format:

- Markdown file with YAML frontmatter

Canonical purpose:

- the tenant brand source of truth used during downstream generation

Minimum YAML frontmatter fields:

- `status`
- `approved_at`
- `brand_name`
- `active_publishing_brand`
- `brand_role`
- `visual_mood`
- `palette`
- `functional_palette_rules`
- `typography_guidance`
- `readability_contrast_rules`
- `mobile_readability_rules`
- `density_composition_rules`
- `motif_structure_rules`
- `hero_treatment_rules`
- `footer_signature_rules`
- `trust_signal_rules`
- `imagery_guidance`
- `do_rules`
- `dont_rules`
- `qa_emphasis_rules`
- `output_organization_rules`
- `required_render_asset_references`
- `reference_assets_or_examples`

Body expectations:

- explain the brand behavior in human-readable terms
- include clarifying notes or examples when they improve reliability
- keep render asset references tenant-relative whenever specific assets are required
- preserve tenant-specific execution guidance that materially affects layout quality, mobile readability, QA standards, or footer/trust-signal behavior

Version one approval rules:

- `status` must be `draft` or `approved`
- `approved_at` should be present only when the profile is approved
- generation should treat only the approved profile as canonical
