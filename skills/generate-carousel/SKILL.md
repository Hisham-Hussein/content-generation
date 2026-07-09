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
Carousel SVGs are readable content diagrams, not faint background decoration. The brand kit README's "SVG content diagrams" section defines a **three-tier shape fill hierarchy** (container/ambient, content, accent/primary) and a **two-tier text label hierarchy** (primary, secondary/annotation) — classify each element by its visual role and apply the corresponding tier's range. Do not use CSS card-class values (2–4%), which rely on backdrop-filter that SVG lacks. This is the single most common failure mode — using CSS-level opacity on SVG shapes makes them invisible on mobile.

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

**A script-positioned overlay icon must NOT also carry a CSS `transform`.** When a `<script>` positions an overlay icon by setting `left`/`top`, any leftover CSS transform (e.g. `transform:translate(-50%,0)`) applies ON TOP of that and silently shifts the icon off its target — this once pushed a hub icon 30px off-center. When your positioner sets `left`/`top`, have it also set `transform:'none'` (or omit the transform from the element's inline style entirely). Do not rely on `left:50%;transform:translate(-50%,0)` centering AND a JS positioner on the same element — pick one.

**Connectors touch outlines, never cross them.** Any connector (SVG `<line>` or `<path>`) must start at the EDGE of its source shape and end at the EDGE of its target — compute the rim/edge endpoints (e.g. a point on a circle's radius, or a rect's border), never the shape's center. A line drawn from one shape's center to another's center slices through both outlines and reads as broken. The Step 5 validator hard-fails on `<line>`/`<path>` endpoints that land more than 6px inside a shape they don't originate from (opt out with `data-allow-penetration` only for deliberate illustration paths).

**Stay faithful to the visual direction's intent.**
Creative embellishment that reinforces the message is fine. Adding unrelated elements that confuse the message is not.

**Airtable slide text is sacred.**
Every text block from the Airtable carousel slide must appear in the output. If the diagram is too large to fit alongside the text, shrink the diagram — never delete the text. The Airtable content was expert-approved upstream.

**Auto-size text containers, never hardcode.**
Any rect, badge, or label background behind text must be sized at runtime using `getBBox()` — never hardcode width values. Include a `<script>` block that runs after DOMContentLoaded to: (1) measure each text element's bounding box and set the parent container's dimensions with appropriate padding, and (2) after all resizing, check for bounding-box overlap between sibling SVG elements and log a console warning for each collision detected. This eliminates text clipping and surfaces layout collisions caused by auto-sizing. If collision is detected, fix the layout spacing — never revert to hardcoded widths.

**Progressive loading discipline — read ONLY what the current step requires.**
Each workflow step has a `<read_before>` tag listing the exact files needed for that step. Read ONLY those files at that step. Do NOT front-load reads from later steps "for efficiency" — this wastes context window tokens and degrades performance on the current step by flooding attention with irrelevant material. If a step has no `<read_before>`, it needs no new reads. The agent who reads everything upfront is not being efficient — they are ignoring the skill's progressive loading design.

</essential_principles>

<quick_start>
Provide Airtable carousel slides (text + visual direction per slide) and a tenant folder path. The skill reads the brand kit, composes per-slide HTML with unique SVG content diagrams, renders PNGs via Playwright, runs programmatic bounds checks and a QA subagent review on every slide, then exports a combined PDF.

Minimum invocation: "Generate a carousel from these slides for tenant at `<tenant-folder-path>` using theme `<theme-name>`"
</quick_start>

<workflow>

**Step 1: Resolve inputs**

Require from the user:
- Airtable carousel slides (text + visual direction per slide), either pasted or fetched
- Tenant folder path (local filesystem)
- Theme name (e.g., `quiet-aurora`) — must match a subfolder under `ui_kits/linkedin_carousel/themes/`

If any is missing, stop and ask. Do not infer defaults.

After resolving inputs, verify the theme folder exists: `<tenant-folder>/ui_kits/linkedin_carousel/themes/<theme>/README.md`. If the folder or README is missing, stop and tell the user — do not fall back to a different theme or proceed without theme-specific rules.

**Output-folder resolution (do NOT enumerate `generated/` here).** If the slides were provided from an existing `<tenant-folder>/generated/<slug>/` folder (e.g. the invocation opened that folder's `slides.txt`), THAT folder is the output bundle — write outputs into it, and do not compute a new sequence number. Only when creating a brand-new bundle is a slug derived, and that derivation belongs to Step 8, at bundle-write time. Do not list `generated/` during Step 1 — enumerating it now is a premature read that floods context and pre-empts a Step 8 concern.

**Step 2: Read brand kit**

<read_before>
- `../../references/shared-art-direction-principles.md` — plugin-level visual quality floor
- The tenant's brand kit README at `ui_kits/linkedin_carousel/README.md` — CSS classes, slide layout rules, SVG opacity table, SVG sizing rules, element spacing, author footer pattern
- The tenant's theme README at `ui_kits/linkedin_carousel/themes/<theme>/README.md` — atmosphere elements, gradient rules, tag/pill treatment, icon style, card surfaces for the chosen theme
- The tenant's carousel CSS at `ui_kits/linkedin_carousel/carousel.css` — available CSS classes
- The tenant's base tokens at `colors_and_type.css` and `colors_and_type_mobile.css`
</read_before>

Read the files listed above, plus list the tenant's `assets/` directory to confirm author photo and logo images exist.

Stop on genuine brand blockers only:
- Missing essential render assets (author photo, logo)
- Ambiguity preventing brand resolution

**Step 3: Compose per-slide HTML**

For each carousel slide, compose an HTML section:

- Wrap content in `.slide-content` (top-aligned) or `.slide-content-center` (for CTA)
- Use `.slide-title`, `.slide-body` for text elements
- **Slide text punctuation (brand rule):** No em dashes (—), en dashes (–), or curly quotes (' ' " "). Use periods or commas instead of dashes, straight quotes, and write number ranges as "30K to 50K" / "3 to 5". Applies to all visible text (`.slide-title`, `.slide-body`, cover/CTA text, big numbers, SVG `<text>`); HTML comments are exempt. The Step 5 validator hard-fails on any violation.
- **ICP language on visual labels (propose, don't auto-apply):** slide titles, bullets, AND the SVG/diagram LABEL text a reader sees *inside* the graphic (a gauge label, an axis label, a node caption) must use language the post's ICP grasps instantly. Flag any too-technical term — e.g. "eval pass rate", "token", "harness", "RAG", "inference" — and PROPOSE a plain-language swap ("accuracy", "cost", "memory") or a ≤4-word inline definition; the USER confirms each swap. **Pillar-calibrated, never a blanket strip:** a deck for a technical ICP may legitimately keep more terms — over-simplifying dilutes depth. Visual labels are the sneakiest place for jargon to hide because caption-level checks never see them (this is where "eval pass rate" slipped onto a cover). Mirrors Dimension 13 of the post-revision drill.
- Add the tag row with `.c-tag` and `.c-page-num` inline via flexbox (`justify-content:space-between`) — the tag sits left, the page number sits right. For centered layouts (CTA) where there is no tag row, use an absolutely positioned element outside the content wrapper: `<div style="position:absolute;top:60px;right:60px" class="c-page-num">N / N</div>`. Page number must appear top-right on every slide.
- Compose a unique SVG content diagram inside `.slide-viz` following the slide's visual direction:
  - Use the SVG opacity ranges and font sizes from the brand kit README's "SVG content diagrams" table
  - Use the SVG sizing rules from the brand kit README's "SVG sizing rules" section
  - Scale ALL SVG internals proportionally — fonts, radii, rects, strokes
  - Elements must fill the viewBox — no large canvas with tiny clustered elements
  - Include a post-render `<script>` block that auto-sizes all text containers using `getBBox()` and then checks for bounding-box overlap between sibling SVG elements, logging a console warning for each collision. Do not hardcode `width` on rects behind text labels or badges.
- Add `.author-footer` with author photo, name, role, logo, URL
- Add the tenant's theme atmosphere elements as specified in the theme README (`themes/<theme>/README.md`)
  - Atmosphere elements must stay within the 1080×1350 frame. Do not use negative offsets — the validation script checks all absolutely positioned elements against the canvas bounds, regardless of `overflow:hidden` clipping.
- Swipe cues (`.c-swipe`) are optional — the prototype omits them because the author footer already anchors the slide bottom. Include only if the visual direction calls for a navigation hint.
- **Vary wrapper structure across content slides** so no run of 8+ consecutive slides shares an identical `.slide-content` child structure — the Step 5 cross-slide check hard-fails on that. Easy, genuine variation: drop a redundant tag row on slides where the tag merely repeats the title (use an absolutely positioned `.c-page-num` instead), or alternate whether the diagram sits above or below the body. This is real variety, not gaming — don't manufacture meaningless wrapper churn.

If any slide's visual direction uses icons, include the Lucide icons CDN script and call `lucide.createIcons()` with the parameters specified in the brand kit README's Dependencies section.

Assemble all sections into a single HTML document linking the brand kit CSS files.

**Step 4: Render per-slide PNGs**

<read_before>
- `references/render-workflow.md` — Playwright render loop, HTML assembly structure, screenshot approach, PDF export, asset bundle layout
</read_before>

- Run render-environment preflight (reuse existing Playwright + Chromium)
- Render each slide as a 1080×1350 PNG at device scale factor 2
- Wait for page load and fonts before each screenshot

**Step 5: Programmatic validation**

<read_before>
- `scripts/validate-carousel-slides.mjs` — programmatic bounds-checking script (read to understand checks and environment variable requirements)
</read_before>

Run `scripts/validate-carousel-slides.mjs` against the rendered HTML. Pass the Playwright and Chromium paths resolved in Step 4 as `PLAYWRIGHT_PATH` and `CHROMIUM_PATH` environment variables:

Geometry checks:
- Footer clipping: verify `.author-footer` bottom edge is within canvas
- Body→footer gap: verify `.slide-body` bottom does not overlap `.author-footer` top
- SVG clipping: verify no SVG element extends beyond its viewBox or the slide canvas
- Element overflow: verify no absolutely positioned element escapes the 1080×1350 frame
- Cross-slide structural check: flags extreme monotony (8+ consecutive identical wrapper structures). Visual layout variety is verified by the QA subagent in Step 6, not this script.

SVG property checks (from the general carousel kit README — theme-agnostic):
- SVG font-size floor: every `<text>` inside `<svg>` must be >= 22px
- SVG text opacity floor: white/neutral text fill opacity >= 0.65 (use `data-intentional-fade="true"` to allow >= 0.50 for deliberate fade sequences); accent-colored text >= 0.85
- SVG shape fill tier: hard reject if opacity is 0.01–0.04 (CSS card-class range — no backdrop-filter in SVG); warn if 0.05–0.19 without `data-tier="container"` annotation
- SVG text-to-container overflow: text `getBBox()` must fit inside its nearest sibling rect (4px tolerance)
- Icon-text overlap: absolutely-positioned HTML icons (e.g., Lucide) overlapping SVG `<text>` elements within `.slide-viz` containers (4px tolerance)
- Path-shape penetration: SVG `<path>` connector endpoints cutting more than 6px inside destination shapes (skips closed paths, filled paths, and paths with `data-allow-penetration`; excludes source shape where path starts)
- Line-shape penetration: SVG `<line>` connector endpoints cutting more than 6px inside destination shapes (same 6px tolerance, source-shape exemption, and `data-allow-penetration` opt-out as the path check). Connectors must terminate at a shape's edge, never cross its outline.

Structural checks:
- getBBox auto-sizing script presence: at least one `<script>` block must reference `getBBox`

Text checks:
- Brand punctuation: no em dashes (—), en dashes (–), or curly quotes (' ' " ") in any visible slide text. Use straight quotes, periods/commas, and "X to Y" ranges.

Hard fail on any violation. Fix the HTML and re-render before proceeding. Warnings (shape fill tier ambiguity) do not block but should be reviewed.

The validator checks geometry, SVG property compliance, and structural requirements. Composition quality and visual readability are evaluated by the QA subagent in Step 6.

**Step 6: QA subagent review**

<read_before>
- `references/carousel-qa-checklist.md` — per-slide and cross-slide QA rules (pass to the subagent)
- `prompts/qa-reviewer.md` — QA subagent system prompt (pass to the subagent)
</read_before>

Spawn a QA subagent using the prompt at `prompts/qa-reviewer.md`. Provide:
- All rendered slide PNGs
- The original Airtable carousel slides (text + visual direction per slide) — needed to verify SVG matches intent
- The carousel brand kit README (SVG opacity/sizing rules)
- The theme README (`themes/<theme>/README.md`) — needed to verify correct atmosphere elements, gradient usage, and tag treatment for the chosen theme
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

Do not present fixed slides to the user without visually inspecting the re-rendered PNGs. The composing agent must verify the fix looks correct, not just that the render script succeeded. **After fixing any positioning or geometry issue specifically, confirm the RE-RENDERED PNG (not the pre-fix image) — a stale or unre-rendered file makes "I fixed it" a false claim. Where the fix is a coordinate/alignment change, prefer a quick numeric confirmation (e.g. compare the element's rendered center to its intended target) over eyeballing alone.**

If a slide still fails after 3 attempts, stop and escalate to the user.

**Step 8: Export PDF + asset bundle**

<read_before>
- `references/render-workflow.md` § pdf_export and § asset_bundle — PDF export options and asset bundle layout (re-read if context from Step 4 has been compressed)
</read_before>

After all slides pass QA:
- Export a combined multi-page PDF (one slide per page, 1080×1350)
- Determine the output folder:
  - **If the slides came from an existing `generated/<slug>/` folder** (per Step 1), that folder IS the bundle — reuse it; do NOT derive a new slug or enumerate `generated/`.
  - **Only for a brand-new bundle:** derive the asset slug `{next-sequence-number}-{kebab-carousel-title}` (e.g., `7-brain-vs-hands-carousel`), taking the sequence number from the count of existing directories in `<tenant-folder>/generated/`. This is the one and only place that enumeration happens.
- Write the final asset bundle to `<tenant-folder>/generated/<asset-slug>/`:
  - `carousel.html` — the editable source
  - `slide-01.png` through `slide-NN.png` — individual slide PNGs
  - `carousel.pdf` — the combined PDF
  - `manifest.yaml` — title, slide count, dimensions, theme, render method, validation/QA results, timestamp

</workflow>

<anti_patterns>

- **Using CSS card-class or infographic opacity on carousel SVGs.** SVG elements have no backdrop-filter — they need the tier-appropriate opacity ranges from the brand kit README's "SVG content diagrams" tables, not the 2–4% values from CSS card classes.
- **Same layout for every slide.** Each slide has its own visual direction. Glass cards on every slide = visual monotony.
- **Declaring done after spot-checking.** Every slide must pass QA. Slide 7 can be broken even if slides 1–6 look fine.
- **Skipping the QA subagent.** The composing agent has anchoring bias toward its own work. A fresh QA agent catches issues the composer rationalizes away.
- **Treating Playwright success as QA success.** Render success means the browser didn't crash. It says nothing about visual quality.
- **Shrinking text instead of shrinking the diagram.** If a slide is crowded, shrink the SVG diagram — never shrink the text and never delete Airtable-approved copy.
- **Hardcoding rect widths behind text.** Text length varies by content. Use `getBBox()` to measure rendered text and size the container dynamically. Hardcoded widths cause clipping on longer text and waste space on shorter text.
- **Front-loading all file reads.** Reading the QA checklist, render workflow, and validation script at Step 2 because "it's efficient" wastes context and violates progressive loading. Each step's `<read_before>` lists exactly what to read — nothing more.
- **Em dashes, en dashes, or curly quotes in slide text.** An AI-writing tell and a brand violation. Use periods/commas, straight quotes, and "X to Y" ranges. The validator hard-fails on them.
- **Connectors drawn center-to-center.** A line/path from one shape's center to another's slices through both outlines and reads as broken. Terminate connectors at the shapes' edges. The Step 5 line/path-penetration checks hard-fail on this.
- **A JS-positioned overlay icon that also has a CSS `transform`.** The transform shifts it off the position the script set (this drifted a hub icon 30px). Clear the transform when positioning by script.
- **Technical jargon on a visual label.** "eval pass rate" on a gauge, "RAG" on a node — caption checks never see label text, so jargon hides there. Propose a plain-language swap (user confirms), pillar-calibrated.

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
