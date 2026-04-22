# Production Render Workflow

Use this as the normative execution loop for version-one infographic production.

Read this together with `../../references/shared-art-direction-principles.md`.

## Core Model

- strategic brief first
- fixed HTML artboard as source of truth
- PNG as the primary publishing asset
- PDF as a derivative export from the verified PNG
- the brief is a compression of the post argument, not a decoration of the full post
- one dominant visual system should carry the page
- composition quality outranks decorative surface treatment

## Shared Art-Direction Requirements

- Translate the post into a visual argument, not a caption recap.
- Choose one dominant visual system.
- Use one memorable structural motif only when it sharpens the idea.
- Keep cards, borders, and separators selective.
- Remove copy before shrinking type or lowering contrast.
- Reject outputs that are technically correct but visually generic, muddy, or overcrowded.
- If approved tenant examples exist, treat them as a quality floor.

## Proven Layout Pattern

The strongest single-image infographic pattern is a save-worthy field sheet:

- one clear title
- one sentence of framing
- audience or context chips when useful
- one high-signal hero claim
- one comparison, framework, or workflow structure
- one compact evidence strip
- one restrained proof annotation
- restrained footer attribution or trust signal

## Required Loop

1. Start from the approved infographic brief, not a blank design prompt.
2. Compress the source into a visual job:
   - audience
   - core message
   - claim boundaries
   - proof points
   - layout concept
   - layout profile
   - attribution requirements
3. Choose one dominant visual system and keep the rest of the page subordinate to it.
4. If tenant approved or rejected examples exist, use them actively before generating.
5. Build a deterministic fixed-size HTML artboard.
6. Embed the `mobile-linkedin-compliance` JSON block in the HTML and mark each counted content block with `data-content-block`.
7. Run `scripts/validate-mobile-linkedin-infographic.mjs` before rendering.
8. Run render-environment preflight before rendering.
9. Prefer existing machine-level Playwright and Chromium runtimes before any install step.
10. Render the artboard to PNG with Playwright + Chromium.
11. Open the PNG and inspect it visually.
12. Reject outputs that are:
   - crowded,
   - muddy,
   - weak in hierarchy,
   - hard to read on mobile,
   - structurally broken,
   - generic or template-like,
   - caption-decorative instead of argumentative,
   - or compositionally wrong even if the render succeeded.
13. Revise the HTML and rerender within a small bounded loop.
14. Only after the PNG passes QA:
   - export the verified PNG to PDF,
   - rasterize the PDF back to PNG,
   - verify the PDF-back raster still matches closely enough for production sanity.
15. Write the final bundle and trace the render method, runtime source, mobile compliance result, and QA result in the manifest.

## Deterministic Artboard Rules

- Use a fixed 4:5 artboard.
- Default authoring artboard: `1080 x 1350 px`
- Default PNG export target: `1080 x 1350 px`
- Default PDF page ratio should preserve the verified PNG ratio
- Avoid responsive web-page behavior inside the production artboard.
- Keep the HTML/CSS layout deterministic.
- Preserve explicit section boundaries and safe internal spacing.
- Keep `overflow: hidden` on the production artboard when that is required for deterministic rendering.

## Brand And Design Rules

- Use the tenant's brand tokens, source assets, and approved examples when they exist.
- Prefer HTML/CSS-native layout over image-drawing approaches for infographic production.
- Preserve strong contrast and readable hierarchy over mood or decorative subtlety.
- If the layout feels crowded, reduce copy before shrinking or dimming important text.
- Avoid generic robot imagery, magic-wand visuals, or hype motifs.
- Keep structural motifs selective instead of repeating borders or cards everywhere.

## Render Rules

- Perform environment detection before any Playwright browser install attempt.
- Reuse existing machine-level runtimes when they are available.
- Recommended render settings:
  - viewport `1080 x 1350`
  - device scale factor `2`
  - wait for page load and fonts before screenshot
  - screenshot the fixed artboard, not a responsive page viewport
- Playwright success means only that rendering succeeded.
- Screenshot review is mandatory after every render pass.
- Do not export or present the output as final until the PNG passes visual QA.

## PDF Rule

- Default to PDF from the verified PNG.
- Do not trust direct browser PDF output for complex infographic layouts unless separately verified.
- If PDF output looks suspicious, generate a print-media screenshot as a diagnostic step before deciding the HTML is wrong.

## Verification Workflow

Use this sequence for format verification:

1. Open the PNG at original size.
2. Review the PNG visually before calling the asset ready.
3. Check for layout collisions:
   - footer touching content
   - cards or borders colliding
   - clipped or hidden sections
   - crowded zones that read as one merged block
4. Check composition quality, not just render fidelity:
   - the page communicates one dominant visual system
   - the main idea is obvious in about 3 seconds
   - structural motifs are selective
   - borders/cards are not overused
   - hierarchy is clear in a 3-second mobile scan
   - no section feels cramped or muddy
   - the output does not feel like a generic social template
5. When approved tenant examples exist:
   - compare the output against them for readability, density, and polish
   - reject the output if it is clearly weaker or more generic
6. Confirm image dimensions.
7. If PDF output is suspicious:
   - run `pdfinfo`
   - rasterize the PDF back to PNG with `pdftoppm`
   - visually compare the rasterized PDF against the original PNG
8. Remove temporary diagnostic files after debugging.

## Useful Diagnostic Commands

```bash
pdfinfo <path-to-pdf>
```

```bash
pdftoppm -png -r 144 <path-to-pdf> <output-prefix>
```

## Completion Rule

The asset is complete only when all of the following are true:

- the brief was approved,
- the validator passed or was explicitly overridden,
- the PNG passed screenshot QA,
- the PDF-back raster check passed,
- the manifest records the accepted render method and QA result,
- the output cleared the shared art-direction quality bar,
- no temporary diagnostic files remain in the final output folder.

## Acceptance Criteria

- HTML opens cleanly.
- PNG matches the intended design.
- PNG has the expected dimensions.
- PDF is one page.
- PDF has the expected page ratio.
- Rasterized PDF visually matches the PNG.
- Output is not obviously weaker than approved tenant examples when they exist.
- No temporary debug artifacts remain in the final asset folder.

## Prompting And Agent Sequence

The workflow should be treated as a staged generation sequence:

1. read the content brief
2. identify the audience and conversion job
3. extract the minimum visual argument
4. identify the active brand material and constraints
5. propose or choose the internal visual structure
6. generate HTML/CSS source
7. render PNG
8. visually inspect
9. iterate layout
10. export PDF from the verified PNG
11. verify the PDF
12. update manifest and output records
