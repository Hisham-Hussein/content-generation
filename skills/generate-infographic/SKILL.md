---
name: generate-infographic
description: Use when a user wants a premium LinkedIn-first single-page infographic generated from source text using a tenant-local approved normalized brand profile.
---

# Generate Infographic

This skill is the version-one production workflow for infographic output inside the multi-tenant content-generation plugin.

Use it for LinkedIn-first single-page infographic generation only.

## Required Inputs

- an explicit tenant folder path provided by the user
- source text, either pasted directly or provided through a local file

If the user does not provide a tenant folder, stop and ask for it. Do not infer hidden defaults.

## Read Before Generating

1. `../normalize-brand/references/normalized-brand-profile-contract.md`
2. `references/infographic-brief-contract.md`
3. `references/asset-manifest-contract.md`
4. `references/qa-checklist.md`
5. `references/production-render-workflow.md`
6. `references/linkedin-mobile-optimization.md`

## Workflow

1. Resolve the source into a lightweight normalized source package:
   - resolved text
   - source type
   - source label or title
   - source locator
   - attribution notes if present
2. Resolve the user-provided tenant folder and check for `normalized-brand-profile.md`.
3. If no normalized brand profile exists:
   - invoke `normalize-brand`
   - write the draft normalized brand profile and validation report
   - surface them for review
   - stop before generation
4. If the normalized brand profile exists but is still `draft`, stop and ask the user to review and approve it before generation.
5. Use the approved normalized brand profile as the canonical brand state. Do not auto-refresh it.
6. Derive a lightweight normalized infographic brief using `references/infographic-brief-contract.md`.
7. Surface the brief to the user for explicit review and approval before generation proceeds.
8. If the brief has unresolved gaps, stop at brief review instead of pretending the brief is complete.
9. Translate the approved brief into a single-image infographic job:
   - one main idea
   - a bounded number of content blocks
   - visual structure
   - proof treatment
   - attribution requirements
10. Build a fixed-size 4:5 HTML artboard as the editable source of truth.
11. Apply LinkedIn mobile optimization rules before first render:
   - mobile readability over decorative density
   - fewer words before smaller type
   - restrained branding
   - safe padding and clean section separation
12. Render PNG from the HTML artboard with Playwright + Chromium.
13. Open and inspect the rendered PNG using `references/qa-checklist.md`.
14. If the output is clearly fixable, revise the HTML and re-render within a small bounded loop.
15. If the PNG is technically valid but still crowded, muddy, weak on first glance, or poor on mobile, treat it as `revise-and-retry`, not `pass`.
16. If hard QA still fails after bounded retries, stop and escalate instead of presenting the output as accepted.
17. Export PDF from the verified PNG.
18. Rasterize the PDF back to an image and verify it matches closely enough for production sanity.
19. Write the final asset bundle into the target asset folder:
   - `infographic.html`
   - `infographic.png`
   - `infographic.pdf`
   - `manifest.yaml`

## Output Rules

- If the user provides an explicit output folder, use it.
- Otherwise use a tenant-defined output organization rule only if it stays tenant-relative.
- Otherwise default to `<tenant-folder>/generated/<asset-slug>/`.
- Temporary or debug artifacts should not remain in the final output folder.

## Do Not

- treat Playwright or browser render success as QA success
- treat a technically valid render as acceptable if it fails mobile readability or composition quality
- skip brief review
- generate from a draft brand profile as if it were approved
- introduce carousel, single-image, or other future workflows into version one
