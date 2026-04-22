# Production Render Workflow

Use this as the normative execution loop for version-one infographic production.

## Core Model

- strategic brief first
- fixed HTML artboard as source of truth
- PNG as the primary publishing asset
- PDF as a derivative export from the verified PNG

## Required Loop

1. Start from the approved infographic brief, not a blank design prompt.
2. Compress the source into a visual job:
   - audience
   - core message
   - claim boundaries
   - proof points
   - layout concept
   - attribution requirements
3. Build a deterministic fixed-size HTML artboard.
4. Render the artboard to PNG with Playwright + Chromium.
5. Open the PNG and inspect it visually.
6. Reject outputs that are:
   - crowded,
   - muddy,
   - weak in hierarchy,
   - hard to read on mobile,
   - structurally broken,
   - or compositionally wrong even if the render succeeded.
7. Revise the HTML and rerender within a small bounded loop.
8. Only after the PNG passes QA:
   - export the verified PNG to PDF,
   - rasterize the PDF back to PNG,
   - verify the PDF-back raster still matches closely enough for production sanity.
9. Write the final bundle and trace the render method and QA result in the manifest.

## Deterministic Artboard Rules

- Use a fixed 4:5 artboard.
- Avoid responsive web-page behavior inside the production artboard.
- Keep the HTML/CSS layout deterministic.
- Preserve explicit section boundaries and safe internal spacing.

## Render Rules

- Playwright success means only that rendering succeeded.
- Screenshot review is mandatory after every render pass.
- Do not export or present the output as final until the PNG passes visual QA.

## PDF Rule

- Default to PDF from the verified PNG.
- Do not trust direct browser PDF output for complex infographic layouts unless separately verified.

## Completion Rule

The asset is complete only when all of the following are true:

- the brief was approved,
- the PNG passed screenshot QA,
- the PDF-back raster check passed,
- the manifest records the accepted render method and QA result.
