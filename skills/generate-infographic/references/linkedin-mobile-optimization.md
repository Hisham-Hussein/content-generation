# LinkedIn Mobile Optimization

Treat LinkedIn infographics as mobile-first visual explanations, not posters.

## Default Shape

- 4:5 vertical
- publishing target: `1080 x 1350 px`
- PNG as the primary publishing export
- keep the final publishing file under `5 MB` when possible

## Practical Rule

If the asset cannot be read clearly on a phone, it should not be posted.

## Enforcement Model

These rules are not optional style advice.

- Validator failure is a hard stop by default.
- The only allowed bypass is an explicit user override token: `OVERRIDE_MOBILE_RULES`
- The override token is case-sensitive.
- The override applies to the current generation run only.
- Override bypasses numeric validator gates only.
- Override does not bypass screenshot QA, clipped-layout rejection, or unreadable-output rejection.

## Use 4:5 For Most Infographics

Best for:

- frameworks
- step-by-step visuals
- process diagrams
- educational posts
- AI or business explainers

Use square only when the design is simple or desktop consistency matters more than vertical mobile impact.

## One Infographic = One Idea

- Do not cram a whole article or LinkedIn caption into one image.
- Default to:
  - one big headline
  - 3 to 5 supporting points
  - one visual system
  - one takeaway
- Use one dominant visual system, not multiple competing structures.

## Density Floor

The rules above are ceilings. They are not permission to publish a slogan.

"One idea" constrains the **number of arguments**, not the amount of substance
behind them. An infographic is an information artifact: the reader should leave
knowing things, not just having read a headline.

**The floor:** every supporting point must carry its **concrete specifics** from
the source — the options, mechanisms, examples, or consequences that make it
actionable — not merely its label.

- "Trigger" is a label. "On a clock / once and never again / called by another
  system" are the specifics.
- "Context" is a label. The actual surfaces it can reach are the specifics.

**The test:** could this asset be reconstructed from the source's headings alone?
If yes, it is under-built — it is an outline, not an infographic.

**The opposite failure** is equally real: transcribing the caption verbatim. The
floor asks for *specifics per point*, not for total word count. Compress each
specific to its shortest faithful form, then keep it.

When density and the block ceiling conflict, reduce the **number of points** and
keep their specifics. Three fully-supported points beat five bare labels.

## Readability Rules

- Headline should read instantly on mobile.
- Section labels and body copy must remain readable without zooming.
- Headline target: `52 to 72 px`
- Section header target: `34 to 44 px`
- Body target: `28 to 34 px`
- Avoid captions unless necessary.
- Avoid important body text below `24 px` in the publishing composition.
- Avoid paragraphs, dense tables, tiny legends, and cramped captions.
- If a block cannot stay readable at comfortable size, cut the content.
- If the design feels crowded, reduce copy before shrinking type or lowering contrast.

## Hard Validator Rules

- artboard must be exactly `1080 x 1350 px`
- safe padding must be at least `40 px` on all sides (research 2026-07: LinkedIn mandates no safe zone for single 4:5 feed images; 80px convention originates from PDF-carousel overlays)
- `headline_px >= 52`
- `section_px >= 34`
- `body_px >= 24`
- `caption_px >= 24`
- content block count must not exceed `5`
- the HTML must include:
  - a `mobile-linkedin-compliance` JSON block
  - `data-content-block` markers for counted content blocks

## Content Block Taxonomy

For validator counting, only these count toward the `5`-block maximum:

- `hero`
- `support`
- `evidence`
- `proof`
- `takeaway`

These do not count as content blocks:

- eyebrow or meta labels
- source notes
- CTA container
- signature or logo treatment
- footer attribution

## Medium-Native Formatting

The source is usually a caption. Captions are written for a plain-text field that
strips formatting, so they simulate structure with characters: `↳` for sub-points,
`→` for flow, `✅` for list items, `1️⃣` for numbering, emoji as section markers.

**An infographic has real typography. Do not transplant those characters.**

| Caption device | Infographic equivalent |
|---|---|
| `↳` sub-item marker | hairline rule between rows, or a hanging indent |
| `✅` / `•` list marker | separated rows, a grid, or a real check glyph from the icon set |
| `1️⃣ 2️⃣ 3️⃣` | position in the layout, or an icon set — not numerals, if labels already identify |
| `→` inline arrow | an actual drawn connector, or adjacency |
| emoji section markers | icons from the tenant's icon library |
| ALL-CAPS for emphasis | type scale, weight, or an inverse container |

Taking the caption's **information** is required (see Density Floor). Taking the
caption's **punctuation** is a defect.

Emoji belong in an infographic only when the tenant's brand materials explicitly
allow them.

## No Links In The Asset

Do not render URLs, short links, or QR codes into the image. They are not
clickable, they age badly, and they consume space that content needs. Source
attribution belongs in the caption or post body.

A small textual source credit ("Source: <publication>") is acceptable when the
tenant requires attribution — the ban is on rendered URLs, not on credit.

## Design For Scanning, Not Reading

People should understand the main idea in about 3 seconds.

Use:

- clear hierarchy
- big numbers
- arrows
- contrast blocks
- short labels
- visual grouping

Avoid:

- paragraphs
- tiny legends
- dense tables
- decorative icons everywhere
- stock-photo clutter
- AI-generated visual noise

## Layout Safety

- Keep safe padding in the `40 to 120 px` range (60-80px preferred for carousels, 40px acceptable for single feed images).
- Keep logos, CTA zones, and signature zones away from edges.
- Keep footer and proof strips clearly separated from the body.
- Do not let chips, labels, or proof annotations crowd core reading areas.
- Keep the key message centered and easy to scan.
- Use phone readability testing before posting or accepting the asset.

## Branding Rules

- Teach first, brand softly.
- Use restrained branding and a small brand mark or signature.
- Use consistent colors and a clear CTA only at the end when needed.
- Avoid oversized logos, repeated slogans, or promotional clutter.
- Avoid over-promotional copy and dense brand slogans.

## SVG Content Diagrams

- When an infographic includes an SVG diagram, treat it as a **content diagram** (readable on mobile), not atmospheric decoration.
- Use the sizing, opacity, and font rules from `svg-content-diagram-rules.md`.
- The SVG should fill the available content width (canvas width minus safe padding on both sides).
- Gradient fills, theme accents, and color choices are determined by the tenant's brand materials — this reference governs structure only.
- Mark accent-colored SVG elements with `data-accent="true"` so the post-render validator applies the correct opacity floor.

## Choose Format By Use Case

- Single infographic: `1080 x 1350 px`
- Simple quote or stat graphic: `1080 x 1080 px`
- Link preview image: `1200 x 627 px`
- Carousel infographic: `1080 x 1350 px` per page

## Carousel Boundary

- Do not force layered ideas into one single-image infographic.
- Carousel is a future sibling workflow.
- Do not merge carousel generation into the single-infographic workflow until the single-page pipeline is stable.

## Strong Formats For Version One

- before vs after
- framework
- 3-step process
- comparison
- comparison table
- checklist
- decision tree
- system map
- workflow diagram
- mistake vs fix

For AI and systems content, prioritize:

- framework
- workflow diagram
- before vs after
- mistake vs fix

## Updated Single-Image Default Template

- `1080 x 1350 px`
- dark background
- `40 to 100 px` safe padding
- big hook at the top
- 3 to 5 content blocks
- one visual system or metaphor
- short final takeaway
- small CTA or diagnostic question at the bottom when needed
- small logo, wordmark, or signature
- PNG under `5 MB` when possible
- PDF exported from the verified PNG

## Reject If

- the infographic feels like a compressed article
- the layout needs zooming to understand
- the main idea is not clear on first glance
- branding is stronger than the educational message
