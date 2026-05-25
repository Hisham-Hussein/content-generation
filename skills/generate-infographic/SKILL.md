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

1. `../../references/shared-art-direction-principles.md`
2. `references/brand-material-intake.md`
3. `references/infographic-brief-contract.md`
4. `references/asset-manifest-contract.md`
5. `references/qa-checklist.md`
6. `references/production-render-workflow.md`
7. `references/linkedin-mobile-optimization.md`
8. `references/render-environment-preflight.md`
9. `references/svg-content-diagram-rules.md`
10. `scripts/validate-mobile-linkedin-infographic.mjs`
11. `scripts/validate-post-render.mjs`

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
6. Apply `../../references/shared-art-direction-principles.md` as the generic visual quality floor for the run.
7. Check for a template catalog in the tenant folder:
   - look for `ui_kits/linkedin_infographic_templates/` (or a similar `*infographic*templates*` directory) inside the tenant folder
   - if found, read its `README.md` to learn the available layouts and the layout selection heuristic
   - this step is conditional — if no template catalog exists, skip to brief derivation and generate freehand
8. Derive a lightweight normalized infographic brief using `references/infographic-brief-contract.md`:
   - if a template catalog was found in step 7, match the source content's structure against the catalog's layout selection heuristic and add a `recommended_template` field (template name + file) and a `template_rationale` field (one line explaining the match) to the brief
   - if no template catalog exists, omit these fields and the agent generates the layout freehand
   - the template recommendation is a suggestion, not a constraint — the user may override it at brief review
   - match the source content's structure against the content-to-diagram selection heuristic in `references/svg-content-diagram-rules.md` and add the recommended `diagram_type` (or `"none"` for CSS-native visual arguments) and a one-sentence `diagram_description` to the brief
9. Surface the brief to the user for explicit review and approval before generation proceeds:
   - when a template recommendation is present, show it as part of the brief so the user approves both the content plan and the structural skeleton in one gate
   - the user may accept the recommended template, request a different one from the catalog, or say "no template" to generate freehand
10. If the brief has unresolved gaps, stop at brief review instead of pretending the brief is complete.
11. Translate the approved brief into a single-image infographic job:
   - one main idea
   - one dominant visual system
   - one memorable structural motif only if it improves the message
   - a bounded number of content blocks
   - visual structure
   - proof treatment
   - attribution requirements
   - if a template was approved, use it as the structural skeleton — clone the template HTML and replace its slots with real content from the brief
   - if no template was approved, compose the layout freehand using the brief's visual angle and the shared art-direction principles
   - if the brief specifies a `diagram_type` other than `"none"`, the SVG content diagram must be the dominant visual element — build it at full content width using the sizing rules in `references/svg-content-diagram-rules.md` — the diagram carries the argument, text is secondary
   - if `diagram_type` is `"none"`, build a CSS-native visual argument (checklist, comparison, stat blocks) as the dominant element
12. If the tenant provides approved or rejected examples, treat them as an active quality floor and blacklist for this run.
13. Build a fixed-size 4:5 HTML artboard as the editable source of truth. If the infographic includes an SVG content diagram, apply the sizing, opacity, and font rules from `references/svg-content-diagram-rules.md`. Verify the viewBox height contains all elements. Mark accent-colored SVG elements with `data-accent="true"`. Include a `<script>` block that runs after `document.fonts.ready` to: (1) measure each SVG text element's getBBox, (2) resize the nearest ancestor/sibling rect to fit the text with padding, (3) cap rect expansion at viewBox bounds, (4) after all resizing, check for bounding-box overlap between sibling SVG elements and log a console warning for each collision. Never hardcode rect widths behind text labels — the getBBox script handles sizing.
14. Build the artboard with an explicit mobile compliance contract embedded in the HTML:
   - a `mobile-linkedin-compliance` JSON block
   - `data-content-block` markers for counted content blocks
   - a separate CTA marker when CTA is present
15. Apply LinkedIn mobile optimization rules before first render:
   - mobile readability over decorative density
   - fewer words before smaller type
   - restrained branding
   - safe padding and clean section separation
16. Run `scripts/validate-mobile-linkedin-infographic.mjs` against the HTML before any render:
   - hard fail on mobile contract violations by default
   - use override only when the user explicitly provided the exact token `OVERRIDE_MOBILE_RULES`
   - the CLI flag `--override-mobile-rules` may only be used when that exact user token is present
17. Run render-environment preflight before rendering:
   - detect an existing Playwright runtime first
   - detect an existing Chromium runtime first
   - reuse a machine-level install when available
   - install only if the required render runtime is genuinely missing
18. Render PNG from the HTML artboard with Playwright + Chromium.
19. Run `scripts/validate-post-render.mjs` against the loaded page inside the Playwright session, before taking the screenshot:
   - hard fail if the footer is clipped or invisible
   - hard fail if any content block overflows the canvas
   - when SVG elements are present, the validator also checks: text-to-container overflow (getBBox), text and shape opacity compliance, SVG viewBox containment, and font-size floor (22px) — warnings are reported separately from errors
   - hard fail if consecutive sections have less than 12px gap between them
   - if post-render validation fails, fix the HTML layout and re-render — do not proceed to screenshot QA with a clipped layout
20. Open and inspect the rendered PNG using `references/qa-checklist.md` and `../../references/shared-art-direction-principles.md`.
21. If the output is clearly fixable, revise the HTML and re-render within a small bounded loop.
22. If the PNG is technically valid but still crowded, muddy, generic, template-like, caption-decorative, weak on first glance, or poor on mobile, treat it as `revise-and-retry`, not `pass`.
23. If hard QA still fails after bounded retries, stop and escalate instead of presenting the output as accepted.
24. Export PDF from the verified PNG.
25. Rasterize the PDF back to an image and verify it matches closely enough for production sanity.
26. Write the final asset bundle into the target asset folder:
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
- treat the shared art-direction principles as optional guidance
- ignore approved tenant examples when they are available
- skip the pre-render validator or treat validator failure as a warning by default
- skip the post-render bounds check or treat a clipped footer as acceptable
- declare QA pass based on a thumbnail — inspect the full-size PNG or run programmatic checks
- install Playwright browsers before checking whether a usable machine-level runtime already exists
- require a normalized brand profile before infographic generation
- skip brief review
- introduce carousel, single-image, or other future workflows into version one
- hardcode SVG rect or container widths — use a getBBox auto-sizing script that measures rendered text and resizes containers at runtime
