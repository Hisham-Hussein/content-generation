# Adaptation Rules

The recurring collisions between a website design system and a fixed-size social asset, and how each has been resolved. Read before Step 4.

The pattern underneath all of them: **a source rule usually encodes a constraint of its own medium.** Find the constraint, then ask what it becomes when the medium changes. That question yields a better answer than either obeying the rule blindly or discarding it.

---

## Viewport rules that assume scrolling

**The collision.** Sources often say things like "never two colour panels visible at once — the page always returns to white between them." That rule exists because a scrolling page separates panels *in time*. A 1080×1350 asset has no scroll: it is one viewport, entirely visible at once.

**Resolution.** Take the rule literally and let it shape the layout: one panel per asset, everything else on the neutral ground. This usually produces the strongest composition anyway, because it forces a single dominant element.

**But check the user's intent first.** Someone who chose a colourful brand *because it is colourful* will be unhappy when the rule flattens their asset to one block. If the source shows a second dialect where the constraint doesn't apply (a product surface, a collaborative canvas, a playful sub-brand), register that as a **variant** with its own discipline. Substitute what the scroll was providing — for panels separated by vertical scroll, a hard minimum white gutter between panels does the same work in a fixed frame.

Do not silently relax the rule. Either resolve it, or raise it.

---

## Type scales below the mobile floor

**The collision.** Web body copy sits at 16–20px and captions at 12px. The published composition floor is 24px.

**Resolution.** Scale the whole ramp up so the smallest role lands on 24px, then preserve relationships rather than values:

- **Ratios.** If display is 4.8× body in the source, keep roughly that.
- **Letter-spacing behaviour.** Negative tracking that scales with size stays scaling with size. Positive tracking on small mono labels stays positive.
- **Weight assignments.** If the source expresses hierarchy through fine weight increments (330 vs 480 vs 540) rather than size jumps, that is the most characteristic thing about it. Keep it.
- **Line-height contrast.** Tight on display, generous on body, if that's what the source does.

Publish the mapping as a small table in the theme section. It documents a decision and stops it being re-derived differently next time.

---

## Colour that doesn't survive the new context

**The collision.** A brand accent calibrated for a large white web page can fail against the surfaces it will actually sit on in an asset, especially as small text.

**Resolution.** Measure before you specify, not after. Run `scripts/check-palette-contrast.mjs` over every foreground/background pair the theme permits, then write the *measured* limits into the theme section:

- ≥ 4.5:1 → any text
- 3.0–4.5:1 → large display text only, name the size floor
- < 3.0 → not text at all; fills and graphic marks only

Write the failure into the spec as a rule with its measured number attached ("magenta measures 2.69:1 on lime — never text on a pastel block"). A number is enforceable in a way that "use sparingly" is not.

**Real example:** a promo accent was specified as permitted for "large-text pill fills or graphic accents" — correct — but then used as a 24px label on a pastel block in the first specimen. It measured 2.69:1 and hard-failed. The fix was the label going to ink and the rule getting a measured clause. Rendering caught it; reading did not.

---

## Elements the source never mentions

**The collision.** Most sources say nothing about stat bars, takeaway cards, timeline connectors, or diagram opacity tiers. The catalog requires all of them.

**Resolution.** Derive from the source's own logic. Ask what this brand *would* do:

- A monochrome system fills a progress bar solid black on its faintest grey track.
- A signature-colour system fills it with the signature on a tint of it.
- A system that bans shadows won't want a shadowed takeaway card — give it a colour surface instead.
- A system whose depth device is colour-blocking will express a timeline as a hairline with dots, not as a heavy connector.

Do not import values from an existing theme. That is exactly how a new theme ends up looking like an old one wearing a different palette.

---

## Depth languages that don't transfer

**The collision.** A source may use shadow, blur, glass, or rotation for depth. Some of these are cheap in a browser and wrong in a flat export.

**Resolution.** Identify the source's *primary* depth device and keep only that one:

- colour-blocking → depth comes from surface contrast; ban shadows in the theme
- rotation (sticky-note collage) → keep the rotation, ban shadows; rotation is doing that job
- hairline strokes → keep strokes, no fills
- glass/blur → check it survives the export; a backdrop-filter with nothing behind it renders as flat tint, and if that's the case, say so in the spec rather than shipping a no-op

State the ban explicitly. "No shadows" reads as a strong opinion; its absence reads as an oversight and someone will add one.

---

## SVG text and the contrast checker

**The collision.** SVG paints from `fill`. Contrast tooling that walks the DOM reads the CSS `color` property. When a label has `fill="#f5e9d4"` and no `color`, the checker measures inherited black against the card and reports a failure that isn't real.

**Resolution.** Declare both, and make them agree:

```css
.ink-card svg text { color: var(--cream); }
.ink-card svg text[data-accent] { color: var(--accent); }
```

This is not silencing a check — it makes the CSS truthful about what is painted, so any colour-aware tool downstream reads the right value. Put the rule in the theme's SVG section so it isn't rediscovered every time.

---

## Layout mechanics that bite during rendering

Collected from real conversions. Each cost a render cycle.

| Symptom | Cause | Fix |
|---|---|---|
| Tag pill spans the full width | Column flex containers stretch children on the cross axis | `align-self: flex-start` |
| Bar fill invisible | `<span>` is inline; inline elements ignore `height` | `display: block` on track and fill |
| Diagram's last arrowhead clipped | viewBox height smaller than `max(y)` of children | Reshape the figure, don't just grow the viewBox — growing it adds dead space |
| Large gap above the footer | `margin-top: auto` absorbs all leftover space | Scale the hero up to fill it; unexplained whitespace is a QA defect |
| Content overflows the canvas | Copy wraps to more lines than estimated | Cut copy before shrinking type — the floor exists for a reason |
| Orphaned final word | Browser line-breaking optimises for fill, not meaning | Author the break with `<br>` at a phrase boundary |
| Type renders as serif | `@import` placed after a style rule is silently dropped | Use `<link>` in `<head>`, and verify the computed font in the render |
