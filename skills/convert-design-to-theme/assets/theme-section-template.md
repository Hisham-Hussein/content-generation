# Theme Section Template

Skeleton for a new `THEMES.md` section. Match this shape — people read these by scanning to the same row in a different section, so a section that reorders things is harder to use than one that's merely terser.

Replace every `<…>`. Delete the parenthetical guidance. Keep the heading order.

---

```markdown
## N. <Theme Name>

**Mood:** <one or two sentences on how it feels. Borrow the source's own language where it's good — it usually is.>
**When to use:** <the content this suits, and which existing theme it sits closest to. A reader choosing between two similar themes needs the distinction stated.>

**Origin:** Derived from <Brand>'s <surface> system (`references/design-systems/DESIGN-<brand>.md`, <version>). Deviations from the source are recorded below.

### Page & canvas

| Element | Value |
|---|---|
| Page background | `<hex>` |
| Body background | `<hex>` (visible around canvas) |
| Safe padding | `<n>px` |

### Atmosphere

| Element | Value |
|---|---|
| Orbs | <value, or **None** with the reason> |
| Dot grid | <value, or **None** with the reason> |
| Background watermark type | `<rgba>`, <face> <weight>, `line-height: <n>` |
| Decorative <rings/rules/stripes> | <value, or **None**> |

<A short paragraph on what makes this theme's atmosphere different from its nearest sibling. This is the paragraph people actually read.>

### Tags/pills

| Element | Value |
|---|---|
| Border | <value> |
| Background | `<hex>` |
| Text color | `<hex>`, <face> <weight>, <size>, <case/tracking if not default> |
| Padding / radius | `<n>px <n>px`, `border-radius: <n>px` |

<If the source's rules made this awkward, say how it was resolved here.>

### Headline treatment

| Element | Value |
|---|---|
| Primary hook | `<hex>`, <face> <weight>, <size>, `letter-spacing: <n>` |
| Gradient phrase | **None.** One text unit, one colour — see Usage rules <n> |
| Subhead | `<hex>`, <face> <weight>, <size> |

<Any weight or emphasis rule that is characteristic of this source.>

### Type scale (LinkedIn-adapted)

<Include when the source's sizes needed scaling. Showing the mapping stops it being re-derived differently next time.>

| Role | Source | This theme | Weight |
|---|---|---|---|
| Hook | <n>px | `<n>px` | <n> |
| Body | <n>px | `<n>px` | <n> |
| Small / caption | <n>px | `<n>px` (floor) | <n> |

### Feature cards

| Element | Value |
|---|---|
| Background | <value> |
| Border | <value, or None with what does the work instead> |
| Border-radius | `<n>px` |
| Padding | `<n>px` |
| Gap between cards | `<n>px` |
| Title | <face> <weight>, <size>, `<hex>` |
| Description | <face> <weight>, <size>, `<hex>` |

### Hero card

<Rename to whatever this theme's featured surface actually is — "Hero card (the colour block)", "Hero card (signature surface)". If the source has no glass, say so rather than leaving a glass row empty.>

| Element | Value |
|---|---|
| Background | <value> |
| Border | <value> |
| Border-radius | `<n>px` |
| Padding | `<n>px` |
| Backdrop-filter | <value, or **None** — this theme has no blur layer> |

### Info grid cards

| Element | Value |
|---|---|
| Layout | `grid-template-columns: 1fr 1fr`, gap `<n>px` |
| Card background | `<hex>` |
| Card border | <value> |
| Card border-radius | `<n>px` |
| Card padding | `<n>px` |
| Title | <face> <weight>, <size>, `<hex>` |
| Description | <face> <weight>, <size>, `<hex>` |

### Icons

| Element | Value |
|---|---|
| Shape | <shape>, `border-radius: <n>` |
| Size | `<n>px` container, glyph `<n>px` |
| Fill | <value> |
| Icon color | <value> |
| Library | Lucide, `stroke-width: <n>` |

### Stat bars

| Element | Value |
|---|---|
| Fill | <value> |
| Track | <value> |
| Height | `<n>px`, `border-radius: <n>px` |
| Label | <face> <weight>, <size>, `<hex>` |
| Value | <face> <weight>, <size>, `<hex>` |

### Stat numbers

| Element | Value |
|---|---|
| Number | <face> <weight>, <size>, `<hex>` |
| Label | <face> <weight>, <size>, `<hex>` |

### Takeaway card

| Element | Value |
|---|---|
| Background | <value> |
| Border | <value> |
| Border-radius | `<n>px` |
| Padding | `<n>px` |
| Text | <face> <weight>, <size>, `<hex>`, centered |
| Subtext | <face> <weight>, <size>, `<hex>` |

### Step/timeline

| Element | Value |
|---|---|
| Connector line | <value> |
| Step marker | <value> |
| Title | <face> <weight>, <size>, `<hex>` |
| Meta text | <face> <weight>, <size>, `<hex>` |

### SVG illustrations

| Element | Value |
|---|---|
| On <surface> — strokes | `<hex>` at `stroke-opacity <n>`, width `<n>px` |
| On <surface> — primary text | `<hex>`, opacity 1.0, <size> |
| On <surface> — secondary text | `<hex>` at `fill-opacity <n>`, <size> |
| Accent | `<hex>`, one per figure, marked `data-accent="true"` |
| Arrowheads | Drawn inline on the path tangent, never floating icons |

**Colour-declaration rule:** every SVG `<text>` must declare a CSS `color` matching its `fill` — contrast tooling reads `color`, SVG paints `fill`.

### <Any measured colour limit>

<Include a section like this whenever check-palette-contrast.mjs found a pair below 4.5:1 that the theme still permits somewhere. State the measured number — an enforceable rule beats "use sparingly".>

### Footer

| Element | Value |
|---|---|
| Separator | <value> |
| Author photo | `<n>px` circle, <border> |
| Author name | <face> <weight>, <size>, `<hex>` |
| Author role | <face> <weight>, <size>, `<hex>` |
| Logo | `isemantics-logo-icon.png`, height `<n>px` |
| Text | <face> <weight>, <size>, `<hex>` |

### Typography

<Which faces, why, and how they're loaded. Name the substitution if the source's faces are proprietary — and say whose recommendation it was. Note it here if this theme departs from the tenant's default families.>

### Documented deviations

<Only when the source and the tenant's chrome or laws disagreed. Each entry: what the source says, what this theme does, and why. Skip the heading entirely if there were none — an empty section invites someone to fill it.>

- **<Element>:** <source's rule>. <What we do instead, and the reason.>

### Boundaries

- <The hard "don'ts" that keep this theme itself. Pull from the source's own don'ts, plus anything the conversion decided.>

**Example files:** `<path to the rendered reference asset>`
```
