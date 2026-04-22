---
name: generate-infographic
description: Use when a user wants a premium LinkedIn-first single-page infographic generated from source text using the tenant's original local brand materials.
---

# Generate Infographic

This skill is the version-one production workflow for infographic output inside the multi-tenant content-generation plugin.

Use it for LinkedIn-first single-page infographic generation only.

## Required Inputs

- an explicit tenant folder path provided by the user
- source text, either pasted directly or provided through a local file

If the user does not provide a tenant folder, stop and ask for it. Do not infer hidden defaults.

## Read Before Generating

1. `references/brand-material-intake.md`
2. `references/infographic-brief-contract.md`
3. `references/asset-manifest-contract.md`
4. `references/qa-checklist.md`
5. `references/production-render-workflow.md`
6. `references/linkedin-mobile-optimization.md`
7. `references/render-environment-preflight.md`
8. `scripts/validate-mobile-linkedin-infographic.mjs`

## Workflow

1. Resolve the source into a lightweight normalized source package:
   - resolved text
   - source type
   - source label or title
   - source locator
   - attribution notes if present
2. Resolve the user-provided tenant folder and inspect the original brand materials directly.
3. Read the tenant's available brand sources as-is:
   - `README.md` when present
   - tenant `SKILL.md` when present
   - HTML, CSS, token, or brand-kit files when present
   - required local assets and approved examples when present
4. Use the original tenant brand materials as the canonical brand source for the run. Do not flatten them into a required normalized profile.
5. Stop only on genuine brand blockers:
   - conflicting active brands or personas
   - missing essential render assets explicitly required by the tenant materials
   - ambiguity that prevents choosing a usable active publishing brand
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
11. Build the artboard with an explicit mobile compliance contract embedded in the HTML:
   - a `mobile-linkedin-compliance` JSON block
   - `data-content-block` markers for counted content blocks
   - a separate CTA marker when CTA is present
12. Apply LinkedIn mobile optimization rules before first render:
   - mobile readability over decorative density
   - fewer words before smaller type
   - restrained branding
   - safe padding and clean section separation
13. Run `scripts/validate-mobile-linkedin-infographic.mjs` against the HTML before any render:
   - hard fail on mobile contract violations by default
   - use override only when the user explicitly provided the exact token `OVERRIDE_MOBILE_RULES`
   - the CLI flag `--override-mobile-rules` may only be used when that exact user token is present
14. Run render-environment preflight before rendering:
   - detect an existing Playwright runtime first
   - detect an existing Chromium runtime first
   - reuse a machine-level install when available
   - install only if the required render runtime is genuinely missing
15. Render PNG from the HTML artboard with Playwright + Chromium.
16. Open and inspect the rendered PNG using `references/qa-checklist.md`.
17. If the output is clearly fixable, revise the HTML and re-render within a small bounded loop.
18. If the PNG is technically valid but still crowded, muddy, weak on first glance, or poor on mobile, treat it as `revise-and-retry`, not `pass`.
19. If hard QA still fails after bounded retries, stop and escalate instead of presenting the output as accepted.
20. Export PDF from the verified PNG.
21. Rasterize the PDF back to an image and verify it matches closely enough for production sanity.
22. Write the final asset bundle into the target asset folder:
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
- skip the validator or treat validator failure as a warning by default
- install Playwright browsers before checking whether a usable machine-level runtime already exists
- require a normalized brand profile before infographic generation
- skip brief review
- introduce carousel, single-image, or other future workflows into version one
