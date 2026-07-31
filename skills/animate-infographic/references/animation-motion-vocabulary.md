# Animation Motion Vocabulary

Motion must **strengthen** the static composition, never compete with it. It has exactly two jobs:

1. **Guide the reader** through the artboard in the order it should be read — top to bottom, left to right.
2. **Add appeal** — the build should feel considered, not mechanical.

Anything that serves neither is decoration and does not belong. The end state is the exact static composition.

## The scheduling rule (the one that matters)

**Position decides WHEN. `kind` decides only HOW.**

Every animatable element is placed in the sequence by its rendered position on the artboard. Its tag decides what motion it gets (draw-on vs fade), never when it happens.

This replaced a model that scheduled by element kind — all SVG fills, then all strokes, then all text labels. That produced motion which looked random because it *was* sorted by the wrong key: two shapes 900px apart shared a start time, while a card and its own label were guaranteed ~1.2s apart. Nothing travelled, so the eye had nothing to follow.

### How the order is derived (`reading-order.mjs`)

1. **Cluster into units.** A card, its border and its label are **one reading beat**, not three. Elements group when ≥90% of one's area sits inside another (union-find, so nesting is transitive). Post 61 collapses ~25 elements into ~15 beats. Without this you get 15 events per second, which nobody can read.
2. **Band into visual rows.** Units whose vertical centres fall within one median-height of each other are the same row. Banding rather than a raw y-sort is load-bearing: a card's top edge and its neighbour's text baseline are never at the same y, so a raw sort zigzags between rows.
3. **Sort by `(band, x)`.** Top to bottom, then left to right.

**Connectors need no special handling.** An arrow between two cards physically sits between them, so banding already schedules it there. It only needs detection so it gets a shorter reveal and its own ease — the positional work is free.

## Motion is selected per element by geometry

| Target | Detection | Motion |
|--------|-----------|--------|
| HTML content box | outermost element containing no `<svg>` | fade + entrance travel, as one beat |
| SVG filled shape | `polygon/rect/circle/…` with a `fill` | fade |
| SVG stroked shape | has a `stroke`, **no** existing `stroke-dasharray` | draw-on via `stroke-dashoffset` |
| SVG dashed stroke | has a `stroke-dasharray` (intentional, e.g. a seam) | fade only — never hijack the dash |
| SVG text | `<text>` | fade, `intraUnitOffsetMs` behind its shape |
| Accent | `[data-accent]` | fade on the accent ease |

### Binding coverage is a correctness concern

The scan walks down from `.infographic` and binds the **outermost element containing no `<svg>`**; a container that wraps an SVG is descended into, not skipped.

This is not a detail. The previous scan took `[data-content-block]` and skipped any block containing an `<svg>`, meaning to animate its interior part-by-part — but it only descended to *SVG* interiors. On a layout like `.seam[data-content-block] > .row > (.hole, .cross>svg, .fix)` the ten HTML cards were never bound at all and sat at full opacity from frame 0. It bound 12 of 25 elements and passed every other check, because a GIF of a mostly-static composition is still a valid GIF.

**`validate-motion-coverage.mjs` is the permanent gate.** Run it on any new layout.

## The guide orb

A small luminous point travels the reading path, arriving at each beat `leadMs` (140ms) *before* that beat lights up. It is the only flourish here that does not trade against clarity: it does not decorate the composition, it **performs** the guidance.

Three layers ride one path (`orb.mjs`):

- **halo** — a soft radial glow. This *is* the focus falloff. The alternative (ramping every unit's opacity as the orb approaches) needs piecewise tracks, because two sequential tracks on the same property clobber each other: `seekValue` returns `track.from` for any `t <= startMs`, so the main track overwrites the anticipation ramp throughout its window. One travelling light is truer and far simpler.
- **trail** — `trailCount` lagging samples along the path, fainter and smaller with age.
- **core** — the orb itself.

Rules:

- **It must LEAD, never follow.** Arriving after the element lit up makes it read as a follower rather than the cause. This is asserted in `orb.test.mjs`.
- **The path is the unit sequence** — the same `planUnits()` output the tracks animate. `planUnits` is exported separately from `planTracks` precisely so the orb cannot derive its own path and drift out of sync with the choreography.
- **Colour comes from the composition**, not a constant: the most saturated text colour on the artboard, so the orb is always in the tenant's palette. Monochrome designs fall back to a neutral.
- **It lives on `<body>`** in viewport coordinates, so it cannot perturb artboard layout, and it is **fully faded out before the build ends** — the final frame is still exactly the static composition.
- **It is a hint, not a cursor.** `ORB_CONFIG.intensity` (0.4) scales every orb alpha at once — core, glow, halo, trail — so softening or strengthening it is a one-number change. It shipped at full strength once and was wrong: a saturated dot with a hard glow, trailed by six half-opaque dots that read as a marching-ants line straight across the cards. It pulled attention to itself and away from the message it exists to serve. **The orb should be felt more than seen.**
- **Its movement must be gentle, not just its colour.** Waypoints are evenly spaced in *time* but not in *distance*, so a naive linear path moves fastest on the longest hop — the return sweep from the right column to the next row's left column, which carries no information at all. Repeated ten times down a two-column layout, that reads as aggressive left-right-left-right motion. Two damping mechanisms fix it, and they compose:
  1. **`smoothstep` within each segment**, so the orb decelerates into every waypoint and accelerates out instead of cornering at speed.
  2. **Opacity tied to speed** (`calmSpeedPxPerMs` → `fastSpeedPxPerMs`, floored at `travelFadeFloor`). Because smoothstep makes speed ~0 at every waypoint, the orb is automatically brightest exactly where it is telling you to look and faintest while it is merely getting there.

  The net effect is a soft pulse at each beat rather than a dot flying about. Measured on post 61: opacity swings 0.18 → 1.00 across the path. Speed is sampled by central difference rather than derived analytically, so it stays correct whatever easing `pointAt` uses.
- **The halo is also the single biggest cost in the encoded GIF.** A large box of changing pixels every frame is exactly what `diff_mode=rectangle` cannot compress. `haloRadiusPx` and the capture fps are the levers: 110px/25fps produced 6.7MB; 60px/20fps with the toned-down alphas produces 3.5MB. Softening the orb and shrinking the file are the same change.

## The craft layer

- **Two eases, never more.** `easeOutQuint` is the signature build ease (fast departure, long settle — reads as *arrived* rather than *faded in*). `easeInOutSine` for drawn connectors so the line does not snap dead at the end. `easeOutBack` exists for accents only — emphasis, never body copy. More than two eases in a build reads as noise.
- **Overlap, never queue.** Each beat starts `overlapRatio` (0.35) into its predecessor's reveal, so there is never a frame with nothing moving. Dead air is what made the old build feel like a series of separate events — and the hardcoded `accentStartMs: 5600` could leave ~2.9s of frozen frames on any deck with accent labels.
- **Entrances travel in the reading direction.** Everything settles upward (`risePx`). Anything the eye reaches by moving *right* also drifts in from the left (`driftPx`); the first unit of a row arrives after a downward eye movement, so it gets a pure rise. This serves guidance and polish at once.
- **The hero settles.** The first beat scales from `heroScaleFrom` (0.98). The hero is the LARGEST TYPE, not the first beat — a deck that opens with an eyebrow pill above the headline would otherwise hand the treatment to the pill as it fades. One element only — motion hierarchy should mirror type hierarchy.
- **Compression preserves rhythm.** If the build would exceed `maxBuildMs` (7500), the whole sequence is scaled uniformly. Relative rhythm is kept; only tempo changes.

## Frame 0 is composed-but-dimmed, with a hierarchical floor

Structural chrome (hairline rules, dividers, outlines) starts at `dimFactorChrome` (0.35); content starts at `dimFactorContent` (0.16). The composition reads as *"the frame exists, the content arrives into it."*

0.08 was tried and rejected on inspection: the artboard read as an empty page for the first ~15 frames, throwing away the opening moment. At 0.16 the architecture stays legible — you can see there are five rows in two columns — while content still visibly arrives. This matters more for GIF than it did for MP4: frame 0 is also the still preview and the loop restart point.

## The determinism rule (load-bearing)

**No CSS-driven motion anywhere.** Every animated property is written as a concrete inline value by `window.__seek(t)`. The motion layer injects `.infographic * { transition: none !important; animation: none !important }`, and screenshots use `{ animations: 'disabled' }`. Identical `t` always yields an identical frame. At/after a track's end the inline override is **removed** (not zeroed) so the final DOM equals the untouched static composition.

The entrance transform carries eased *progress* (0→1) with the offsets riding on it, so one track drives translate and scale together rather than three tracks fighting over `el.style.transform`. When a scale is applied, `transform-box: fill-box` and `transform-origin: center` are set explicitly — without them, scaling an SVG child resolves against the viewport and throws the element across the artboard.

## Serialisation trap

The pure functions are stringified into the page via `Function.prototype.toString()`. **Every module-level identifier they reference must be declared as a `var` in `buildInjectionScript`** — `median`, `containmentRatio`, `unionRect`, the ease functions, `EASES`, `READING_ORDER_CONFIG`. Miss one and it is `undefined` inside the browser while every Node-side unit test still passes.

## Out of scope

- Number-counter tick-up (needs `data-count-to` metadata the static skill does not emit)
- Audio, clip-path/mask wipes (opacity reveal is the robust default), auto-upload
- A true loop crossfade (fading content back toward the dim floor before the restart). It needs piecewise tracks and would break the "final frame equals the static composition" invariant that `poster.png` and QA depend on. The trailing hold (`holdMs`, 1400ms) is the cheap substitute: the eye rests on the finished artboard before the cut.
