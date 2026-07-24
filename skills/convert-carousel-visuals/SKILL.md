---
name: convert-carousel-visuals
description: Convert, audit, repair, or restyle branded carousel diagrams as information-bearing raster visuals while preserving the source bundle. Use when a user asks to replace authored SVGs with generated images, create an image-based carousel variant, preserve diagram explanations in raster form, flatten annotations or brand assets, correct visual overlaps or remnants, or improve an existing raster-carousel conversion.
---

# Convert Carousel Visuals

Create or repair a versioned image-based carousel without changing the original bundle. Each converted visual ends as one flattened PNG containing the scene, deterministic information, and approved brand assets.

## Required inputs

Require:

- Existing `carousel.html`.
- Source caption, normally `post.txt`.
- `slides.txt` when present.
- Tenant folder and theme, unless they can be resolved unambiguously from the carousel.

Use an explicit output folder when provided. Otherwise create the next `carousel-vN` folder beside the source carousel. Never overwrite the original bundle or edit its HTML.

## Workflow

### 1. Inventory the carousel

Read the caption, slide text, HTML, tenant brand kit, and theme instructions. Run:

```bash
node scripts/inventory-carousel-visuals.mjs <carousel.html>
```

This identifies each authored SVG content diagram, its visible labels, and its owning slide. Treat runtime Lucide SVGs and brand-logo SVGs as allowed; do not replace them.

### 2. Establish project-specific visual direction

Read [visual-direction-contract.md](references/visual-direction-contract.md). Create `visual-direction.yaml` in the variant to record:

- The intended visual character and audience.
- Approved references and prohibited treatments.
- Permitted style families and when each applies.
- Any project-specific treatment budgets.
- Typography, brand-asset, and generated-text policies.

Do not encode one project's taste as a universal skill rule. If the user already delegated visual direction, record the assumptions and proceed. Otherwise show a concise direction proposal before generation.

### 3. Make a semantic conversion brief

For every target slide, define:

- The slide's actual claim, facts, labels, and metrics.
- A visual mechanism that explains the claim.
- Why each major visual element maps to the claim.
- Likely misreadings or decorative failure modes.
- Critical subjects that must remain visible.
- The information region and the scene region.
- One layout: `top`, `bottom`, `left`, `right`, or `negative-space`.
- Required official brand assets and their intended anchors.

Read [semantic-visual-design.md](references/semantic-visual-design.md), [layout-and-subject-safety.md](references/layout-and-subject-safety.md), and [conversion-brief-contract.md](references/conversion-brief-contract.md). A visually attractive but weakly mapped metaphor must be revised before generation.

"Text first" means reserve a protected information region before composing the image. It does not mean every slide uses a bottom band.

### 4. Create the versioned variant

Run:

```bash
node scripts/create-carousel-variant.mjs <source-carousel.html> <output-folder>
```

It copies the HTML without changing the source and rebases tenant-relative paths for the deeper `carousel-vN` directory. Confirm the original file hash is unchanged.

### 5. Generate, compose, and flatten each target

Use the built-in image generation tool directly. Do not use Visual Companion.

- Generate one raster scene foundation per slide by default. Generate variants only when the user asks.
- Derive style from `visual-direction.yaml`; do not default to 3D or any other treatment.
- Keep all typography, statistics, logos, and readable UI out of the generated foundation.
- Use the conversion brief's critical-subject invariants in every image prompt.
- Reject or edit any foundation containing accidental text, misleading pseudo-UI, or an information zone that is not genuinely empty.
- Add exact information and official brand assets deterministically in `visual-compositor.html`.
- Anchor logos and annotations to declared geometry, then inspect their optical placement.
- Rasterize the full composition as one PNG before carousel integration.
- Do not crop a scene with a transform merely to hide unused space. Regenerate or edit the foundation when the required subjects cannot fit.

Read [image-generation-prompting.md](references/image-generation-prompting.md) and [composition-and-flattening.md](references/composition-and-flattening.md). Render compositor assets at 2x and save final PNGs in `images/`.

Slides with no authored content SVG remain HTML-native unless the user explicitly requests a conversion.

### 6. Integrate with single-artifact ownership

Replace only targeted authored SVG content with final raster `<img>` elements. Preserve slide copy, page numbers, author footer, theme chrome, runtime icons, and brand assets.

Each converted `.slide-viz` must contain exactly one content artifact: the final raster image. Do not leave explanatory text, brand logos, diagram fragments, or absolutely positioned content overlays beside it.

### 7. Validate in stages

Validate:

1. The text-free foundation.
2. The flattened infographic.
3. The complete rendered slide.
4. The final PDF.

Audit foundations:

```bash
node scripts/audit-foundation-text.mjs <foundation.png> [foundation.png ...]
```

Treat status `manual_required` as an incomplete gate, not a pass. Inspect the foundations at full resolution when OCR is unavailable or produces ambiguous results.

Run:

```bash
node scripts/validate-raster-carousel.mjs <carousel.html> <conversion-manifest.json>
```

Read [raster-carousel-qa-checklist.md](references/raster-carousel-qa-checklist.md). Inspect every target at full size, then render 1080x1350 slide PNGs at device scale factor 2 and export the PDF only from verified, current PNGs.

## Non-negotiable rules

- The original carousel remains byte-for-byte unchanged.
- One converted slide gets one information-bearing final raster image.
- Preserve the slide's semantic claim and exact facts; a beautiful but non-explanatory scene fails.
- Generated foundations contain no intentional or accidental typography, statistics, logos, or readable UI.
- Exact text and official brand assets are compositor-owned and flattened before integration.
- A converted visual container contains no competing content overlays or remnants.
- Signal text is at least 24px, labels 18px, and descriptions 20px at a 920px compositor width.
- Scene and information regions do not intersect unless a declared negative-space region is visibly empty and verified at final size.
- Inspect every final slide, not a contact sheet or thumbnail subset.
- Make at most three correction passes per slide. Escalate unresolved failures.

## Resources

- [Visual direction](references/visual-direction-contract.md): project-specific art direction and treatment controls.
- [Semantic visual design](references/semantic-visual-design.md): claim-to-image mapping and metaphor rejection tests.
- [Conversion brief](references/conversion-brief-contract.md): required per-slide handoff.
- [Layout and subject safety](references/layout-and-subject-safety.md): layout selection and crop rules.
- [Image prompting](references/image-generation-prompting.md): foundation and edit prompt rules.
- [Composition and flattening](references/composition-and-flattening.md): deterministic information, brand assets, and single-raster ownership.
- [Raster QA checklist](references/raster-carousel-qa-checklist.md): required final inspection.
- [Render workflow](references/render-workflow.md): runtime discovery, 2x screenshots, and PDF export.
