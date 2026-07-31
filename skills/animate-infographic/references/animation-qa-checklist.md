# Animation QA Checklist

A clean encode is **not** QA success. Inspect the artifacts.

## Output format (automated — `validate-animation-output.mjs`)

- `GIF89a` signature (GIF87a has no animation extensions at all)
- `codec_name = gif`
- 4:5 portrait aspect ratio, at least 720px wide (a floor, not an equality check — the size ladder is allowed to step resolution down)
- more than one frame — i.e. it actually animates
- `NETSCAPE2.0` application extension present with loop count `0` (infinite)
- file size within the budget (default 8MB)

The frame-count check exists because a GIF encoded from a *broken* motion layer is a single settled still, and every other check here would still pass.

## Motion coverage (automated — `validate-motion-coverage.mjs`)

Run **before** spending a render:

- no substantial visual box (background/border, ≥12000px²) is left unbound
- bound targets reach ≥45% of the artboard

This catches the failure that no other check can see: a composition where the motion layer binds a handful of elements and everything else sits at full opacity from frame 0. It encodes cleanly, validates cleanly, and is simply not animated. If it fails, **fix the scan — never lower the threshold.**

## Reading order (manual, and the whole point)

- **Play it once. Did your eye go where you would read it?** Top to bottom, left to right, zigzagging across paired columns. If attention jumps around, the choreography is wrong no matter how smooth each individual reveal is.
- **A connector should arrive between the two things it joins**, not before both or after both.
- **The orb must lead.** At any frame, the element the orb is on should not yet be fully lit. If the orb trails behind the reveals, `leadMs` is wrong and the whole effect inverts — it stops looking like a cause and starts looking like a cursor chasing the animation.
- **The orb's travel must be calm.** If you notice it sweeping across the artboard — especially the long return from the right column to the next row's left — the transit fade is too weak. Raise `fastSpeedPxPerMs`'s aggressiveness by lowering it, or lower `travelFadeFloor`. You should register arrivals, not journeys.
- **The orb must not compete.** If your eye lands on the orb rather than on the content it is leading you to, it is too strong — turn `ORB_CONFIG.intensity` down. A guide you look *at* instead of *along* has inverted its own purpose.
- **The orb must be gone at the end.** Compare the final frame against `poster.png`: the diff should be scattered antialiasing, not a compact blob.
- **Count the beats.** If you perceive more than ~12 distinct events, clustering is under-grouping and the build will read as busy. Elements that belong together (a card, its border, its label) must arrive as one.

## Visual (manual inspection)

- **Poster legibility** — open `poster.png` alone. It must read as a complete, legible infographic at thumbnail size. This is the end state the loop keeps returning to.
- **First frame** — the composed-but-dimmed ghost should show the full *architecture* (how many rows, how many columns), not an empty artboard. Structural chrome sits at a higher floor than content, so the frame should read as a stage waiting to be filled. This matters more for GIF than it did for video: the first frame is what renders in previews, notification thumbnails and any client that does not animate.
- **Palette artefacts (GIF-specific, nothing automated catches these)** —
  - banding across gradients and soft shadows;
  - visible dither crosshatch on large flat fills;
  - brand accent colours shifting hue after quantisation — check the accent against the static `infographic.png`, not by memory.
  If any appear: raise `max_colors` on the ladder step, or change `GIF_DITHER` in `render-animation.mjs`.
- **Loop seam** — the GIF loops forever, so the cut from the held final frame back to the dimmed first frame is a real, repeating visual event. It should read as a deliberate restart, not a flicker. This did not matter for a play-once MP4.
- **Smoothness** — sample the first/mid/final frames. Motion should be calm and staggered, never frantic or simultaneous. No mid-animation geometry pop (would indicate the layout-stability gate was skipped).
- **No dead air** — there should be no moment where nothing is moving. Beats overlap by design (`overlapRatio`); a visible pause means a hardcoded start time has crept back in.
- **End state** — the final frame must be the exact static composition. Verify it is **perceptually** equal to the source `infographic.png` (SSIM / downscaled diff — not pixel-equality, which is brittle across Chromium builds and now also across palette quantisation).
- **Legibility-in-motion** — text must be readable while it settles. If the build feels crowded or the diagram is hard to follow in motion, the source infographic is too dense to animate — simplify the static first.

Extract frames for inspection with:

```bash
ffmpeg -i animation.gif -vf "select='eq(n\,0)+eq(n\,33)+eq(n\,65)'" -vsync 0 chk-%d.png
```

## LinkedIn GIF specs (cite, don't assume — verify against current LinkedIn help)

- GIF uploads as an **image**, not a video. It plays inline and loops. There is no thumbnail to select and no tap-to-play.
- aspect ratio: portrait up to **4:5** is supported in-feed (1080×1350 ✓)
- no duration minimum applies — a looping GIF is not subject to the feed-video minimum that governed the MP4 output
- audio: impossible in GIF, and not wanted here
- **file size**: the 8MB budget in this skill is a *guardrail*, not a documented LinkedIn limit. Re-check LinkedIn's current image upload limits before publishing for a new tenant, and weight the answer toward mobile: a heavy GIF stalls on a slow connection long before it is rejected.

## Disposition

- Fixable (timing, a distracting reveal) → tune `TIMELINE_CONFIG` and re-render within a bounded loop.
- Palette artefacts → raise `max_colors` / change the dither, re-render, re-inspect.
- Over budget → shorten the timeline. Do **not** just raise `--max-mb`.
- Technically valid but crowded/muddy/weak in motion → treat as revise, not pass.
- Still failing after bounded retries → stop and escalate; do not present as accepted.
