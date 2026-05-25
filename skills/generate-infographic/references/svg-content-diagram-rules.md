# SVG Content Diagram Rules

Reference for SVG content diagrams in LinkedIn infographics. Theme-agnostic — all color choices, gradients, and palette decisions come from tenant brand materials at runtime.

---

## A. Diagram Type Catalog

| Diagram | Trigger Pattern | SVG Implementation Note |
|---------|----------------|------------------------|
| Venn | Overlapping concepts, shared attributes | Circles + labels |
| Chain / Pipeline | Sequential process, staged filtering | Boxes + arrows, narrowing walls |
| Funnel | Wide-to-narrow reduction, conversion stages | Trapezoids |
| Pyramid | Hierarchical layers, priority levels | Stacked bars |
| Quadrant | 2x2 categorization, priority/effort grids | 4 rects + axes |
| Bullseye | Concentric focus, priority rings | Concentric circles |
| Flowchart | Decision processes, branching logic | Boxes + diamonds + arrows |
| Versus | Direct A vs B comparisons | Split layout |
| Circular / Cycle | Recurring processes, feedback loops | Circular arrows |
| Hub / Solar System | Central concept with supporting elements | Center + radial nodes |
| Road / Timeline | Journey, roadmap, phase-based milestones | Winding path + nodes |
| Slope | Before/after trend, ranking shift | Directional lines |
| Ribbon Arrows | Adoption flow, journey visualization | Wide arrows |
| Iceberg | Surface vs hidden factors | Waterline + layers |
| Packed Circles | Proportional grouping, clustering | Sized circles |
| Puzzle | Interconnected components, how parts fit | Interlocking shapes |
| Staircase | Progressive stages, leveling up | Stepped blocks |
| Donut | Single key percentage or proportion | SVG arc |
| System Map | Architecture, entry to process to outcomes | Boxes + branches |
| Bar / Column Chart | Data comparison, rankings | **Prefer CSS-styled HTML over SVG** (HTML has text wrapping) |
| Comparison Table | Side-by-side options, feature matrix | **Prefer CSS-styled HTML over SVG** (use `<table>`) |

Bar Chart, Comparison Table, and Donut are valid visual argument types but are better implemented as CSS-styled HTML. When the heuristic recommends these, set `diagram_type: "none"` in the brief and use CSS-native layout.

---

## B. Content-to-Diagram Selection Heuristic

| Post describes... | Recommended diagram | Notes |
|-------------------|-------------------|-------|
| Process with numbered steps | Chain, Pipeline, Road, Staircase | SVG diagram |
| Overlapping concepts | Venn, Packed Circles | SVG diagram |
| Central idea with supporting elements | Hub / Solar System, Bullseye | SVG diagram |
| Before vs after transformation | Versus, Slope | SVG diagram or CSS split layout |
| Hierarchical layers or priorities | Pyramid, Bullseye | SVG diagram |
| Narrowing/filtering from many to few | Funnel, Pipeline | SVG diagram |
| 2x2 categorization | Quadrant | SVG diagram |
| Decision with branches | Flowchart | SVG diagram |
| Recurring/cyclical process | Circular / Cycle | SVG diagram |
| Hidden complexity beneath a surface | Iceberg | SVG diagram |
| Journey or roadmap with phases | Road, Timeline | SVG diagram |
| Interconnected components | Puzzle | SVG diagram |
| Criteria list or readiness checks | none — use CSS checklist layout | CSS-native |
| Side-by-side comparison | none — use CSS comparison layout | CSS-native |
| Data with specific numbers to compare | none — use CSS bar/stat layout | CSS-native |
| Single hero metric | none — use stat_poster layout | Different layout_profile |

When the heuristic outputs "none", set `diagram_type: "none"` in the brief and build a CSS-native visual argument.

---

## C. SVG Sizing and Font Rules

**Sizing:** SVG width = canvas width minus 2x safe padding (e.g., `width="920"` at 80px padding). No `height` attribute. ViewBox height 340-600. Elements span `x=40` to `x=(width-40)`.

**ViewBox containment:** Calculate `max(y + height)` across all children, set viewBox height >= that + 10px padding.

**Font sizes:**

- 29-36px — standard labels
- 39px — section headers
- 22-26px — tight secondary text
- Floor: 22px (nothing smaller)

**Stroke widths:**

- 2.1-2.8px — borders, axes, arrows
- 3.4-4.4px — emphasis strokes

---

## D. SVG Opacity Rules

### Programmatically enforced

| Check | Rule |
|-------|------|
| Shape fill 0.01-0.04 | Hard reject (CSS card-class range, invisible without backdrop-filter) |
| Shape fill 0.05-0.19 without `data-tier="container"` | Warn |
| Text (neutral fills) below 0.65 | Hard reject |
| Text (accent fills, marked with `data-accent="true"`) below 0.85 | Hard reject |

### Advisory guidance (for agent judgment, not enforced)

| Element type | Typical opacity range |
|-------------|----------------------|
| Container/ambient shapes | 5-18% |
| Content shapes | 20-50% |
| Accent/primary shapes | 40-65% |
| Primary text | 85-100% |
| Secondary text | 65-85% |

---

## E. Accent Color Detection

- Elements using tenant accent colors must be marked with `data-accent="true"` by the composing agent.
- The validator checks this attribute, not RGB values — this keeps validation theme-agnostic.
- The composing agent knows the tenant's accent colors from brand materials.

---

## F. Auto-Sizing Rule

Never hardcode rect, badge, or container widths behind text. Text length varies by content and font rendering.

Every infographic with SVG content diagrams must include a `<script>` block that runs after `document.fonts.ready` to:

1. For each SVG `<text>` element, measure its `getBBox()`
2. Find the nearest enclosing `<rect>` (walk up to 15 previous siblings, match by center proximity)
3. If the text getBBox extends past the rect, expand the rect width and/or height with padding (16-20px)
4. Cap expansion at viewBox bounds — never expand a rect past the viewBox width or height
5. After all resizing, check for bounding-box overlap between sibling SVG elements and log a console warning for each collision detected

If collision is detected, fix the layout spacing — never revert to hardcoded widths.

This eliminates the manual text-fitting cycle (shorten text, re-render, still overflows, shorten more, re-render) that wastes hours. Cards derive from text, not the other way around.
