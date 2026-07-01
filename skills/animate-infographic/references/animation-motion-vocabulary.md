# Animation Motion Vocabulary

Motion must **strengthen** the static composition, never compete with it. Video infographics that work are *simpler* than their static cousins — density is unreadable in motion. The end state is the exact static composition.

## The determinism rule (load-bearing)

**No CSS-driven motion anywhere.** Every animated property is written as a concrete inline value by `window.__seek(t)` (`inject-timeline.mjs`). The motion layer injects `.infographic * { transition: none !important; animation: none !important }`, and screenshots use `{ animations: 'disabled' }`. Identical `t` always yields an identical frame. At/after a track's end, the inline override is **removed** (not zeroed) so the final DOM equals the untouched static composition.

This is why the renderer can capture pixel-deterministic frames at an exact fps without relying on wall-clock or compositor timing.

## Motion is selected per element by geometry

The static infographic's diagram is often **filled shapes with no stroke** (e.g. the iceberg `<polygon>`s). `stroke-dashoffset` draw-on animates *nothing* on those. So each element gets the motion its geometry supports:

| Target | Detection | Motion |
|--------|-----------|--------|
| Content block | `[data-content-block]` not wrapping an `<svg>` | fade (dim→natural) + 10px rise, staggered by DOM order |
| SVG filled shape | `polygon/rect/circle/ellipse` with a `fill` and no stroke | fade (dim→natural opacity) |
| SVG stroked shape | has a `stroke` ≠ none, **no** existing `stroke-dasharray` | draw-on via `stroke-dashoffset` (length→0) |
| SVG dashed stroke | has a `stroke-dasharray` (intentional dash, e.g. the waterline) | fade only — never hijack the dash for draw-on |
| SVG text | `<text>` | fade |
| Accent | `<text data-accent="true">` | fade, scheduled last ("key labels light up last") |

A content block that wraps an SVG is **not** block-faded — its interior parts animate individually, avoiding double-dimming.

## Frame 0 is composed-but-dimmed, not blank

Every element sits at its **final position** at ~0.15× its natural opacity at `t=0`, then builds up. So even LinkedIn's auto-generated thumbnail shows a legible ghost of the full layout rather than an empty artboard. `poster.png` (the final frame) is still exported for the user to set as the upload thumbnail.

## Timing

Driven by `TIMELINE_CONFIG` in `inject-timeline.mjs`. Defaults: blocks stagger by DOM order; SVG interior reveals in groups (fills → strokes → text); accents land last (~5.6s); ~1s final-frame hold (cloned by ffmpeg, not re-screenshotted) for a clean loop boundary. Tune these values to retune the motion; re-render and re-QA.

## Out of scope (v1)

- Number-counter tick-up (needs `data-count-to` metadata the static skill does not emit)
- Audio, clip-path/mask wipes (opacity reveal is the robust v1 default), auto-upload
