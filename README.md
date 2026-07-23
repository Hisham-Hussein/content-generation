# Content Generation

Private content-generation plugin for tenant-local LinkedIn content workflows.

## What This Plugin Does

`normalize-brand` is an optional cleanup utility for messy tenant brand folders:

- `normalized-brand-profile.md`
- `brand-validation-report.md`

`generate-infographic` uses the tenant's original brand materials plus source text to drive LinkedIn-first single-page infographic production with:

- brief review before generation
- HTML as source of truth
- PNG as primary export
- PDF derived from the verified PNG
- bounded screenshot QA

`plan-carousel` and `generate-carousel` turn approved post content into a branded SVG-first carousel.

`convert-carousel-visuals` creates a non-destructive `carousel-vN` variant that replaces authored SVG content diagrams with information-bearing raster visuals. It preserves exact facts through deterministic composition, keeps critical scene subjects visible, and supports top, bottom, left, right, or safe-negative-space information layouts.

## Current Repo Structure

```text
content-generation/
  .codex-plugin/
    plugin.json
  assets/
    plugin-mark.svg
  skills/
    normalize-brand/
    generate-infographic/
    plan-carousel/
    generate-carousel/
    convert-carousel-visuals/
```

## GitHub

GitHub repository:

`https://github.com/Hisham-Hussein/content-generation`
