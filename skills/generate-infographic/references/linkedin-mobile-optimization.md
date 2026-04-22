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
- safe padding must be at least `80 px` on all sides
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

- Keep safe padding in the `80 to 120 px` range.
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
- `80 to 100 px` safe padding
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
