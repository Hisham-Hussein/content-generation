<overview>
Per-slide and cross-slide QA checklist for carousel generation. Apply together with `../../references/shared-art-direction-principles.md` and the tenant's carousel brand kit README.

Validator pass is required before QA. QA does not replace programmatic validation.
</overview>

<allowed_outcomes>

- `pass` — all slides meet quality bar
- `revise-and-retry` — specific slides need fixes, identify which ones and why
- `stop-and-escalate` — carousel fails after bounded retries, escalate to user

</allowed_outcomes>

<per_slide_checks>

**Hard reject conditions — reject the slide if any are true:**

- Author footer is clipped, overlapped by content, or missing
- SVG content diagram uses opacity values below the ranges in the brand kit README's "SVG content diagrams" table (do not use CSS card-class values — SVG has no backdrop-filter)
- SVG text labels are below the minimum font size specified in the brand kit README's "SVG content diagrams" table
- SVG elements are clipped at canvas edges or viewBox boundaries
- Body text overlaps or crowds the author footer (insufficient gap)
- Content is pushed outside the 1080×1350 frame
- The slide has no SVG diagram despite having a visual direction
- The SVG diagram does not match the slide's visual direction
- Important text is hard to read at phone screen size
- The slide looks like a generic social card instead of a content diagram
- Safe padding is weak — content sits too close to slide edges
- Theme atmosphere elements (as specified in brand kit README) are missing
- Bar chart elements overflow their axes (y + height must equal axis y-position)

**First-glance quality — assess within 3 seconds:**

- Is the slide's main point clear immediately?
- Does the SVG diagram reinforce the text, not just decorate?
- Is hierarchy clear — title, then diagram, then body text?
- Does the slide feel designed, not merely filled?

</per_slide_checks>

<cross_slide_checks>

**Visual rhythm:**
- Slide layouts vary visually — no long runs of visually identical compositions (the programmatic script checks structural wrappers only; visual variety is YOUR responsibility)
- Cover (slide 1) is structurally distinct from content slides
- CTA (last slide) is structurally distinct from content slides
- SVG diagrams vary across slides — no repeated identical compositions

**Consistency:**
- Author footer appears on every slide in the same position
- Page number format is consistent (N / Total)
- Typography scale is consistent across all slides
- Theme atmosphere is present on every slide (as defined in brand kit README)
- Swipe cues: optional — the prototype omits them. Only flag if the visual direction explicitly requested them and they are missing.

**Spacing:**
- SVG blocks have 24px minimum vertical gaps
- Arrow labels between adjacent elements have 130–150px horizontal gaps
- No elements collide across any slide

</cross_slide_checks>

<comparative_quality>

If the tenant has a reference carousel (check the `generated/` folder in the tenant directory):
- Compare the output against it for SVG clarity, opacity, composition quality
- Reject if the output is clearly weaker in readability or visual polish
- The reference carousel is the quality benchmark, not a template to copy

</comparative_quality>

<qa_loop_rule>

- Playwright render success does not mean the slide is acceptable
- Programmatic validation success does not mean the slide is acceptable
- A technically correct render can still fail QA if composition is weak
- If a slide is fixable, revise the HTML and re-render
- If a slide still fails after 3 revision attempts, stop and escalate
- Do not present output as accepted when any slide has unresolved QA findings

</qa_loop_rule>
