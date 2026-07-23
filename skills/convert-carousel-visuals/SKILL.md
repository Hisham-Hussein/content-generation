---
name: convert-carousel-visuals
description: Convert an existing branded LinkedIn carousel from authored SVG content diagrams to information-bearing raster visuals. Use when a user asks to replace a carousel's SVGs with generated images, make an image-based carousel v2, preserve an SVG's explanation in raster form, or create a non-destructive visual variant of an existing carousel.
---

# Convert Carousel Visuals

Create a versioned, image-based carousel without changing the original carousel bundle. The final visual for each converted slide is one PNG that combines a generated scene with deterministic explanatory text and exact statistics.

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

### 2. Make a conversion brief before generating

For every target slide, define:

- The SVG's actual argument, facts, labels, and metrics.
- A scene metaphor that explains that argument.
- Critical subjects that must remain visible.
- The information region and the scene region.
- One layout: `top`, `bottom`, `left`, `right`, or `negative-space`.

Read [layout-and-subject-safety.md](references/layout-and-subject-safety.md) and [conversion-brief-contract.md](references/conversion-brief-contract.md). Show the full brief to the user and get approval before image generation.

"Text first" means reserve a protected information region before composing the image. It does not mean every slide uses a bottom band.

### 3. Create the versioned variant

Run:

```bash
node scripts/create-carousel-variant.mjs <source-carousel.html> <output-folder>
```

It copies the HTML without changing the source and rebases tenant-relative paths for the deeper `carousel-vN` directory. Confirm the original file hash is unchanged.

### 4. Generate and compose one visual per target slide

Use the built-in image generation tool directly. Do not use Visual Companion.

- Generate one raster scene foundation per slide by default. Generate variants only when the user asks.
- Keep exact statistics and explanatory text out of the generated scene. Add them deterministically in `visual-compositor.html`, then rasterize the composition.
- Use the conversion brief's critical-subject invariants in every image prompt.
- Place information in the selected safe region. Never cover a critical subject.
- Do not crop a scene with a transform merely to hide unused space. Regenerate or edit the foundation when the required subjects cannot fit.

Read [image-generation-prompting.md](references/image-generation-prompting.md) before prompting. Render compositor assets at 2x and save final PNGs in `images/`.

Slides with no authored content SVG remain HTML-native unless the user explicitly requests a conversion.

### 5. Integrate and validate

Replace only targeted authored SVG content with final raster `<img>` elements. Preserve slide copy, page numbers, author footer, theme chrome, runtime icons, and brand assets.

Run:

```bash
node scripts/validate-raster-carousel.mjs <carousel.html> <conversion-manifest.json>
```

Read [raster-carousel-qa-checklist.md](references/raster-carousel-qa-checklist.md). Validate every slide at full size, then render 1080x1350 slide PNGs at device scale factor 2 and export the PDF from those verified PNGs.

## Non-negotiable rules

- The original carousel remains byte-for-byte unchanged.
- One converted slide gets one information-bearing final raster image.
- Preserve all facts conveyed by the SVG; a beautiful but non-explanatory scene fails.
- Signal text is at least 24px, labels 18px, and descriptions 20px at a 920px compositor width.
- Scene and information regions must not intersect, except when a designated negative-space region is visually empty and verified safe.
- Inspect every final slide, not a contact sheet or thumbnail subset.
- Make at most three correction passes per slide. Escalate unresolved failures.

## Resources

- [Conversion brief](references/conversion-brief-contract.md): required per-slide handoff.
- [Layout and subject safety](references/layout-and-subject-safety.md): layout selection and crop rules.
- [Image prompting](references/image-generation-prompting.md): foundation and edit prompt rules.
- [Raster QA checklist](references/raster-carousel-qa-checklist.md): required final inspection.
- [Render workflow](references/render-workflow.md): runtime discovery, 2x screenshots, and PDF export.
