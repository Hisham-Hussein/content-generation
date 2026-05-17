---
name: generate-carousel
description: Use when a user wants a branded multi-slide LinkedIn carousel PDF generated from Airtable carousel slides using the tenant's local brand kit. Triggers on "generate carousel", "carousel from slides", "build carousel", "carousel PDF", or when carousel slides with visual directions are provided.
---

<objective>
Generate premium branded LinkedIn carousel PDFs (1080×1350 per slide, 4:5) from pre-structured Airtable carousel slides. Each slide arrives with text content and a visual direction — the skill composes per-slide HTML with unique SVG content diagrams, renders PNGs, runs programmatic and visual QA on every slide, and exports a combined PDF.

The Airtable pipeline handles content planning — this skill handles visual production only. No brief derivation, no slide type mapping, no approval gates. The expert already approved the content upstream.
</objective>

<essential_principles>

**SVG content diagrams, not atmospheric backgrounds.**
Carousel SVGs are readable content diagrams, not faint background decoration. SVG opacity ranges and font sizes are defined in the brand kit README's "SVG content diagrams" table — follow those values, not the CSS card-class values which are lower due to backdrop-filter. This is the single most common failure mode — using CSS-level opacity on SVG shapes makes them invisible on mobile.

**Every slide gets a unique SVG.**
Each Airtable carousel slide has a `Visual:` direction. Compose a unique SVG diagram matching that direction. Do not reuse the same glass card layout across slides — visual monotony kills engagement.

**Author footer on every slide.**
Carousel slides are shared as individual screenshots. Every slide needs the branded author footer (`.author-footer` class) with photo + name + logo. The `.slide-content` wrapper already provides `padding-bottom:80px` to clear the footer.

**QA every slide, not a subset.**
Run programmatic bounds checks on ALL slides. Visually inspect EVERY rendered PNG. Do not declare done based on spot-checking a few slides.

**Render success is not QA success.**
Playwright rendering without errors means nothing about visual quality. A technically valid render can still fail if SVGs are too faint, elements are clipped, or the composition is weak.

**Use Lucide icons when available.**
When a visual direction calls for standard icons (lock, pencil, database, arrow, etc.), use the Lucide CDN rather than hand-drawing them from SVG path coordinates. Place icons as HTML elements (`<i data-lucide="icon-name">`), not inside SVG. Hand-drawn SVG is appropriate for custom diagrams and compositions that Lucide doesn't cover.

**This especially applies to arrows and connectors** — use `arrow-right`, `arrow-left-right`, `arrow-down`, `chevron-right`, etc. instead of hand-drawing SVG `<marker>` arrowheads. SVG markers render poorly at phone scale; Lucide icons stay crisp. Position them as absolutely placed HTML elements over the SVG diagram.

**Stay faithful to the visual direction's intent.**
Creative embellishment that reinforces the message is fine. Adding unrelated elements that confuse the message is not.

**Airtable slide text is sacred.**
Every text block from the Airtable carousel slide must appear in the output. If the diagram is too large to fit alongside the text, shrink the diagram — never delete the text. The Airtable content was expert-approved upstream.

</essential_principles>

<quick_start>
Provide Airtable carousel slides (text + visual direction per slide) and a tenant folder path. The skill reads the brand kit, composes per-slide HTML with unique SVG content diagrams, renders PNGs via Playwright, runs programmatic bounds checks and a QA subagent review on every slide, then exports a combined PDF.

Minimum invocation: "Generate a carousel from these slides for tenant at `<tenant-folder-path>`"
</quick_start>

<required_reading>
Before generating, read these files in order:

1. `../../references/shared-art-direction-principles.md` — plugin-level visual quality floor
2. The tenant's carousel brand kit README (found inside the tenant folder at `ui_kits/linkedin_carousel/README.md`) — design system: CSS classes, slide layout rules, SVG opacity table, SVG sizing rules, element spacing, author footer pattern
3. The tenant's carousel brand kit CSS (at `ui_kits/linkedin_carousel/carousel.css`) — available CSS classes
4. `references/render-workflow.md` — multi-slide render loop with Playwright
5. `references/carousel-qa-checklist.md` — per-slide and cross-slide QA rules
</required_reading>

<workflow>

**Step 1: Resolve inputs**

Require from the user:
- Airtable carousel slides (text + visual direction per slide), either pasted or fetched
- Tenant folder path (local filesystem)

If either is missing, stop and ask. Do not infer defaults.

**Step 2: Read brand kit**

Read from the tenant folder:
- `ui_kits/linkedin_carousel/README.md` — layout rules, SVG opacity/sizing tables, author footer pattern, element spacing
- `ui_kits/linkedin_carousel/carousel.css` — available CSS classes
- `colors_and_type.css` and `colors_and_type_mobile.css` — base design tokens
- `assets/` — author photo, logo images referenced by the footer
- Read `../../references/shared-art-direction-principles.md` as the generic quality floor

Stop on genuine brand blockers only:
- Missing essential render assets (author photo, logo)
- Ambiguity preventing brand resolution

**Step 3: Compose per-slide HTML**

For each carousel slide, compose an HTML section:

- Wrap content in `.slide-content` (top-aligned) or `.slide-content-center` (for CTA)
- Use `.slide-title`, `.slide-body` for text elements
- Add the tag row with `.c-tag` and `.c-page-num` inline via flexbox (`justify-content:space-between`) — the tag sits left, the page number sits right. For centered layouts (CTA) where there is no tag row, use an absolutely positioned element outside the content wrapper: `<div style="position:absolute;top:60px;right:60px" class="c-page-num">N / N</div>`. Page number must appear top-right on every slide.
- Compose a unique SVG content diagram inside `.slide-viz` following the slide's visual direction:
  - Use the SVG opacity ranges and font sizes from the brand kit README's "SVG content diagrams" table
  - Use the SVG sizing rules from the brand kit README's "SVG sizing rules" section
  - Scale ALL SVG internals proportionally — fonts, radii, rects, strokes
  - Elements must fill the viewBox — no large canvas with tiny clustered elements
- Add `.author-footer` with author photo, name, role, logo, URL
- Add the tenant's theme atmosphere elements as specified in the brand kit README
  - Atmosphere elements as specified in the brand kit README must stay within the 1080×1350 frame. Do not use negative offsets — the validation script checks all absolutely positioned elements against the canvas bounds, regardless of `overflow:hidden` clipping.
- Swipe cues (`.c-swipe`) are optional — the prototype omits them because the author footer already anchors the slide bottom. Include only if the visual direction calls for a navigation hint.

If any slide's visual direction uses icons, include the Lucide icons CDN script and call `lucide.createIcons()` with the parameters specified in the brand kit README's Dependencies section.

The brand kit includes HTML template files (CoverSlide.html, FeaturePoint.html, etc.) as structural reference patterns. Use them as composition inspiration when a slide's visual direction matches a template's purpose, but do not mechanically instantiate them — each slide's SVG content diagram is always unique per its visual direction.

Assemble all sections into a single HTML document linking the brand kit CSS files.

**Step 4: Render per-slide PNGs**

Read `references/render-workflow.md` for the full render loop.

- Run render-environment preflight (reuse existing Playwright + Chromium)
- Render each slide as a 1080×1350 PNG at device scale factor 2
- Wait for page load and fonts before each screenshot

**Step 5: Programmatic validation**

Run `scripts/validate-carousel-slides.mjs` against the rendered HTML. Pass the Playwright and Chromium paths resolved in Step 4 as `PLAYWRIGHT_PATH` and `CHROMIUM_PATH` environment variables:

- Footer clipping: verify `.author-footer` bottom edge is within canvas
- Body→footer gap: verify `.slide-body` bottom does not overlap `.author-footer` top
- SVG clipping: verify no SVG element extends beyond its viewBox or the slide canvas
- Element overflow: verify no absolutely positioned element escapes the 1080×1350 frame
- Cross-slide structural check: flags extreme monotony (8+ consecutive identical wrapper structures). Visual layout variety is verified by the QA subagent in Step 6, not this script.

Hard fail on any violation. Fix the HTML and re-render before proceeding.

The validator checks geometry only — opacity, composition quality, and visual readability are evaluated by the QA subagent in Step 6.

**Step 6: QA subagent review**

Read `references/carousel-qa-checklist.md` for the full QA criteria.

Spawn a QA subagent using the prompt at `prompts/qa-reviewer.md`. Provide:
- All rendered slide PNGs
- The original Airtable carousel slides (text + visual direction per slide) — needed to verify SVG matches intent
- The carousel brand kit README (SVG opacity/sizing rules)
- The QA checklist

The subagent inspects every slide and returns a pass/fail report with specific findings per slide.

**Step 7: Fix and retry**

If QA fails on any slide:
- Fix the HTML for the failing slides
- Re-render only the affected slides
- Visually read every re-rendered PNG before proceeding — render success is not visual success
- Re-run programmatic validation on the fixed slides
- Re-run the QA subagent with ALL slide PNGs (not just the fixed ones) — cross-slide checks require the full set
- Bounded retry: max 3 revision passes per slide

Do not present fixed slides to the user without visually inspecting the re-rendered PNGs. The composing agent must verify the fix looks correct, not just that the render script succeeded.

If a slide still fails after 3 attempts, stop and escalate to the user.

**Step 8: Export PDF + asset bundle**

After all slides pass QA:
- Export a combined multi-page PDF (one slide per page, 1080×1350)
- Derive the asset slug: `{next-sequence-number}-{kebab-carousel-title}` (e.g., `7-brain-vs-hands-carousel`). Determine the sequence number from the count of existing directories in `<tenant-folder>/generated/`.
- Write the final asset bundle to `<tenant-folder>/generated/<asset-slug>/`:
  - `carousel.html` — the editable source
  - `slide-01.png` through `slide-NN.png` — individual slide PNGs
  - `carousel.pdf` — the combined PDF
  - `manifest.yaml` — title, slide count, dimensions, theme, render method, validation/QA results, timestamp

</workflow>

<anti_patterns>

- **Using CSS card-class or infographic opacity on carousel SVGs.** SVG elements have no backdrop-filter — they need the higher opacity ranges from the brand kit README's "SVG content diagrams" table, not the lower values from CSS card classes.
- **Same layout for every slide.** Each slide has its own visual direction. Glass cards on every slide = visual monotony.
- **Declaring done after spot-checking.** Every slide must pass QA. Slide 7 can be broken even if slides 1–6 look fine.
- **Skipping the QA subagent.** The composing agent has anchoring bias toward its own work. A fresh QA agent catches issues the composer rationalizes away.
- **Treating Playwright success as QA success.** Render success means the browser didn't crash. It says nothing about visual quality.
- **Shrinking text instead of shrinking the diagram.** If a slide is crowded, shrink the SVG diagram — never shrink the text and never delete Airtable-approved copy.

</anti_patterns>

<success_criteria>
The carousel is complete when:

- Every slide has a unique SVG content diagram matching its visual direction
- SVG opacity and font sizes follow the brand kit README's "SVG content diagrams" table
- Author footer is visible and unclipped on every slide
- Programmatic bounds checks pass on all slides
- QA subagent passes all slides
- Combined PDF exports cleanly with one page per slide
- Asset bundle written to the output folder with manifest
- No temporary or debug artifacts in the output folder
</success_criteria>

<reference_index>
**QA:** references/carousel-qa-checklist.md
**Render:** references/render-workflow.md
**Validation script:** scripts/validate-carousel-slides.mjs
**QA subagent:** prompts/qa-reviewer.md
**Art direction (plugin-level):** ../../references/shared-art-direction-principles.md
</reference_index>
