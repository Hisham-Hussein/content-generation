<overview>
A "binding" installs a motion layer on the page: it scans a slide, plans tracks, injects helper elements, and defines `window.__seek(t)`. The driver then drives frames.

Multi-slide plus transitions means **the same page is bound many times in one run** — 13 slide bindings, 12 flip bindings, and 12 extra incoming-slide bindings. Every silent-failure bug in this skill's history came from a binding inheriting state from a previous one.

These are not style rules. Each corresponds to a defect that shipped, passed every automated check, and had to be found by inspecting frames.
</overview>

<invariant name="bindings_are_idempotent">
**A binding must leave the document as if freshly loaded before installing itself.**

Two things persist across bindings:

1. **Injected helper elements** (band clones, shine overlays, flip containers). Mark every one with `data-anim-injected` and remove them all at the start of each binding, or they accumulate.
2. **Inline values written by `__seek`** on *real* elements. This is the subtle one.

<why_it_bites>
A binding that is seeked to 0 and then abandoned leaves frame-0 values on real elements. Not hypothetical — it is exactly what happens to the incoming slide of a page turn: it is bound (to show it unbuilt mid-turn), seeked to 0, then abandoned when the flip binding takes over.

When that slide is later bound for its own segment, the image still carries `opacity: 0`. The band reveal calls `cloneNode()` to build its strokes — **and `cloneNode` copies inline styles**. All six strokes are created at `opacity: 0`, paint nothing, and the picture appears only when the ghost's override is removed at the end of the track.

Result: a 2-second painted reveal replaced by a one-frame pop, on every slide except the first. The first slide escapes — it is the only one bound once, before any flip exists.
</why_it_bites>

<the_rule>
Clear the properties this driver writes (`opacity`, `transform`, `mask-image`, `-webkit-mask-image`) at the start of each binding — but **only on elements the driver marked** (`data-anim-props`). A blanket clear would destroy the source HTML's own inline styles, which carousels use heavily (`style="display:flex..."` on header rows).

Defensively: strip driven properties from every clone at creation. A clone must never inherit a value some earlier binding happened to leave behind.
</the_rule>
</invariant>

<invariant name="canonical_dom_order">
**Every index resolves through `querySelectorAll('.infographic')` — so that order *is* the slide numbering.**

The flip binding re-parents two slides into a 3D perspective container (perspective must live on a parent, so this is unavoidable). Restoring them with `document.body.appendChild(slide)` puts them at the **end** of `<body>`.

From that moment the deck is renumbered. After the first turn, index 2 no longer means slide 3. The rendered video played slides 1, …, 13, …, 5, …, 2 — every slide rendered perfectly, each under the wrong number.

<the_rule>
Stamp each slide's original order once (`data-anim-order`, derived from its `id` where possible), and re-sort to it at the start of every binding. Then add an **identity guard** in the driver: assert the element at index *N* has the id you expect, and throw if not.

A frame-count or "did it bind?" check cannot catch this class of bug. Everything binds; everything renders. Only identity reveals it.
</the_rule>
</invariant>

<invariant name="collect_targets_before_planning">
`planTracks(targets, cfg)` is a pure function over the target list. Any target appended **after** the call is silently dropped — no error, no warning, just missing motion.

Keep all scanning above the single `planTracks` call. When adding a new target category, check where it lands relative to that line.
</invariant>

<invariant name="query_the_element_not_the_ancestor">
`querySelector('.viz-wrap img, .viz-wrap')` returns the **wrapper**, always. A comma selector resolves in document order, and a parent necessarily precedes its own child.

This silently disabled the painted reveal on all 13 slides while everything still rendered "fine." The tell was a build-time log reading 1760ms instead of 2400ms — a number, not a picture.

Query the specific element: `querySelector('.viz-wrap img')`.
</invariant>

<invariant name="retire_on_the_group_clock">
See the painted-reveal section of the motion vocabulary. Any element whose completion is *part of* a larger composed effect must persist until the whole effect retires.

Generalise: when splitting one animated element into N staggered pieces, check every lifecycle assumption that was previously true "for free" because N was 1.
</invariant>

<debugging_protocol>
When motion is wrong, **instrument the DOM directly** — do not reason about it from the video.

Write a short Playwright script that imports the driver's own `buildSlideInjection` / `buildFlipInjection`, reproduces the exact binding sequence (including the re-bind), and dumps what you suspect: clone count, clone geometry, inline opacity, mask offsets at several `t` values.

This is what separated "the motion layer is broken" from "the motion layer is fine and the clones are invisible" in one run, after speculation had already produced one wrong fix.

<verify_before_shipping_a_fix>
A wrong diagnosis that *sounds* right will happily ship. Non-monotonic packet timestamps looked like the cause of the scrambled deck, so `setpts=PTS-STARTPTS` went in — then a synthetic three-segment test showed **no difference**, and the real cause turned out to be DOM re-parenting. The non-monotonic PTS were ordinary B-frame reordering.

Revert fixes whose rationale is disproven, even when harmless. Code justified by a false explanation teaches the next reader the wrong lesson.

Synthetic isolation tests are cheap: three directories of solid-colour frames answered a filter-graph question in 30 seconds that would have cost a 6-minute render to guess at.
</verify_before_shipping_a_fix>
</debugging_protocol>
