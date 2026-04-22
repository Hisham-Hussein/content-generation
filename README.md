# Content Generation

Standalone Codex plugin for tenant-local content-generation workflows.

Version one is intentionally narrow:

- `normalize-brand`
- `generate-infographic`

The plugin is designed as the umbrella for a broader content-generation toolkit. Infographics are the first public workflow, not the final boundary of the plugin.

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
```

## Installed Location

This standalone plugin currently lives at:

`~/plugins/content-generation`

The home-local marketplace entry is:

`~/.agents/plugins/marketplace.json`

## GitHub

GitHub repository:

`https://github.com/Hisham-Hussein/content-generation`

## Version One Boundaries

Version one includes:

- optional tenant-local brand normalization utility
- LinkedIn-first single-page infographic generation
- explicit brief review before generation

Version one does not yet include:

- carousel generation
- single-image generation
- copy polishing
- broader platform variants beyond the first infographic workflow
