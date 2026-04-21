# Content Generation

Standalone Codex plugin for brand-normalized content-generation workflows.

Version one is intentionally narrow:

- `normalize-brand`
- `generate-infographic`

The plugin is designed as the umbrella for a broader content-generation toolkit. Infographics are the first public workflow, not the final boundary of the plugin.

## What This Plugin Does

`normalize-brand` turns a messy tenant brand folder into stable tenant-local brand state:

- `normalized-brand-profile.md`
- `brand-validation-report.md`

`generate-infographic` uses an approved tenant-local normalized brand profile plus source text to drive LinkedIn-first single-page infographic production with:

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

- tenant-local brand normalization
- LinkedIn-first single-page infographic generation
- explicit brand approval before generation
- explicit brief review before generation

Version one does not yet include:

- carousel generation
- single-image generation
- copy polishing
- broader platform variants beyond the first infographic workflow

