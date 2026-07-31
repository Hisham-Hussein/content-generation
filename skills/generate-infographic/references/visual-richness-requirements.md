# Visual Richness Requirements

The rest of this skill is written as ceilings — do not exceed 5 blocks, do not go
below 24px, remove copy before shrinking type. Ceilings prevent a bad asset. They
do not produce a good one.

This file is the floor. An asset that clears every ceiling and fails this file is
**not** publishable.

---

## A. Register Variety

A **visual register** is one way of encoding meaning visually. These are distinct
registers:

- a diagram (flow, funnel, venn, map)
- a comparison of two states
- a data or state strip (bars, cells, segments, ticks)
- a chip / token row (labelled containers, marks)
- an icon-led card set
- a rail or timeline with nodes
- a hero numeral with supporting labels

**Rule:** an asset needs **at least two, preferably three** distinct registers.

**The trap:** the same register repeated across a grid counts as **one**. Three
columns of headed text is one register shown three times, not three registers. A
four-card row where every card is `title + sentence` is one register.

**Why this exists:** the shared art-direction principles require "one dominant
visual element," which a single flowchart satisfies. That is how a page of boxes
and connector lines passes every gate and still reads as a diagram someone drew in
a hurry. Dominance governs *hierarchy*. This rule governs *interest*.

## B. Micro-Artwork

Every content block should carry a small graphic token that encodes something —
not decoration applied afterward.

Examples of encoding, by what the source gives you:

| Source has | Micro-visual |
|---|---|
| a quantity | bar, sparkline, proportional shape |
| a cadence or schedule | period strip with the active unit marked |
| a set of sources or tools | chip row carrying real marks |
| a progression or gate sequence | segmented bar deepening toward a terminal |
| a presence/absence pair | filled token vs its hollow or dashed negative |
| a ranking or tier | stepped blocks, stacked bars |

**When the source carries no numbers**, encode **state** rather than quantity.
Absence of data is not a licence for a text-only asset — it redirects which
micro-visuals are available.

**Reject:** a block whose only visual is its own text.

## C. Icon System

**Default to the icon library the tenant's brand materials specify.** Where the
tenant names a library (commonly Lucide), use it. Load it the way the tenant's
materials load it — CDN is acceptable: the render session has network access, the
same way remote webfonts resolve during render.

**Hand-authored SVG glyphs are a fallback, not a default.** Draw one only when the
library genuinely lacks the concept, and record which glyph and why in the manifest
under `artwork.icons`. Redrawing an icon the library already ships produces a
slightly-wrong, slightly-inconsistent shape for no gain.

**Third-party brand marks must be the real asset file.** When the source names a
product (Slack, Notion, GitHub, a cloud vendor), embed the actual logo file from
the tenant's brand-logo assets. **Never approximate a brand mark by hand in SVG
paths, and never substitute a generic library icon for a named product.** A
redrawn logo is wrong at a glance to anyone who knows the brand, and it misstates
a real company's identity.

If the tenant has no asset for a named brand, follow the tenant's own sourcing
rules if it has them; otherwise ask rather than approximate.

Brand marks keep their own colour — they are chrome, not part of the tenant
palette. Everything else in the icon system follows the tenant's icon treatment
(container shape, size, stroke, colour).

## D. Device Preconditions

A borrowed device only works when the layout supplies the condition that makes it
work. Check the precondition **before** building it:

| Device | Requires |
|---|---|
| ghost/watermark word | genuine negative space for it to occupy |
| bracket or callout annotation | an empty region or gap worth pointing at |
| hero numeral | an actual number in the source |
| before/after split | two genuinely comparable states |
| slope or trend line | two or more measured points |
| full-bleed anchor band | a light or low-density field to interrupt |

Applying a device without its precondition produces noise, not richness — a
watermark behind dense text reads as smudge, and a callout pointing at occupied
space reads as a collision.

## E. One Text Unit, One Colour

**A sentence, headline, label, or paragraph takes exactly one colour. Never
recolour part of it, and never apply a gradient to text.**

Recolouring a phrase inside a sentence — or fading a few words into a second hue —
is one of the loudest tells of machine-generated design. It reads as decoration
applied to language rather than as meaning, and readers who have seen a hundred
AI-made graphics recognise it instantly.

| Allowed | Not allowed |
|---|---|
| a section label entirely in the accent colour | a headline whose second sentence switches colour |
| a figure entirely in the ink colour | two words of a phrase carrying a gradient |
| an accent-coloured label beside an ink-coloured one | any single sentence containing two colours |

**Different units may take different colours** — that is how hierarchy is built.
An accent-coloured section label above an ink headline is correct. The accent
*inside* the headline is not.

A headline of two sentences is still **one unit**. A line break does not make its
parts separable.

**This governs TEXT only. Shapes may use gradients freely** — bar fills, orbs,
card surfaces, connectors, icon containers. That is often where depth comes from,
particularly in monochrome or flat layouts. The tell is gradient applied to
language, not to geometry.

Emphasis in text comes from size, weight, position, or an inverted container.

## F. Anti-Scaffold

Generic editorial scaffolding is not artwork. Avoid:

- numbered section markers (`01 / 02 / 03`) when the labels already carry identity
- an eyebrow chip on every section
- a bordered card around every line item
- **a thick coloured border on one edge of a card** (the "side-tab" accent) — a
  widely recognised AI-interface tell
- decorative gradients or glows doing work that hierarchy should do
- icons chosen for decoration rather than meaning

If a scaffold element carries no information the reader could not get from the
text beside it, remove it and spend the space on something that does.

## G. Hard Rejects

Reject and rebuild — not tweak — when:

- the asset is **boxes and connector lines only**: rectangles, arrows, and labels
  with no other register. This is the single most common failure mode of this
  skill
- every content block uses the same register
- no block carries a micro-visual
- a brand mark was hand-drawn instead of using the real asset
- an icon was hand-drawn while the tenant's icon library ships that concept
- a device was applied without its precondition
- the visual layer could be deleted and the asset would lose no meaning
