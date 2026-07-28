---
name: animate-carousel
description: Use when a user wants an already-generated multi-slide LinkedIn carousel turned into an animated MP4 — "animate the carousel", "make the carousel a video", "animated carousel", "carousel video for LinkedIn", "add page turns to the deck" — or when tuning an existing carousel animation's pacing, image reveal, page turns, or CTA emphasis.
---

<objective>
Sibling of `animate-infographic`. This skill does **not** generate slides — it **composes motion on top of** a validated multi-slide `carousel.html` and exports a LinkedIn-ready **H.264 MP4** plus a `poster.png` thumbnail.

The fact that defines this skill: **LinkedIn animates only native MP4 video.** An uploaded PDF carousel is swiped by hand; an "animated carousel" is a muted-autoplay MP4 that reads itself to the viewer.

Motion must strengthen the static deck, never compete with it. Every slide's end state is the exact static composition.
</objective>

<quick_start>
```bash
# 1. Preflight is enforced by the driver: system ffmpeg with libx264 + ffprobe, or it stops.

# 2. ALWAYS iterate at --fast (24fps, DSF1). Frames are a pure function of t,
#    so a fast pass is a faithful proxy at half the cost.
node scripts/render-carousel-animation.mjs <carousel.html> --out <dir>/animation --fast

# 3. Confirm pacing with the user, then render full quality (30fps, DSF2).
node scripts/render-carousel-animation.mjs <carousel.html> --out <dir>/animation

# 4. Validate the container.
node ../animate-infographic/scripts/validate-animation-output.mjs <dir>/animation/animation.mp4
```

Pacing overrides, no file edits needed:

```
--stagger 650   gap between blocks landing — THE pacing dial
--hold 2500     settled dwell per slide — the reading window
--wipe 2000     painted image reveal
--flip 700      page-turn duration
--transition fade --xfade 0.5    crossfade instead of page turns
```
</quick_start>

<why_not_animate_infographic>
Do not render a carousel with the sibling driver. It fails in ways that look like success.

| | animate-infographic | animate-carousel |
|---|---|---|
| Artboards | one `.infographic` | 13+ `.infographic` roots |
| Block selector | `[data-content-block]` | carousel classes (`.slide-title`, `.slide-body`, …) — carousels have **zero** `data-content-block` |
| Bounds check | `querySelector('.infographic')` — **singular** | every slide |
| Transitions | none | page turns / crossfades between slides |
| Pacing driver | one build, ~7s | reading time × N slides |

A carousel run through the sibling scanner binds **nothing**, captures a static video, and passes every format check.
</why_not_animate_infographic>

<reused_from_sibling>
Imported, never forked — one implementation across both skills:

- `easeOutCubic` / `planTracks` / `seekValue` — the pure timeline math
- `detectFfmpeg()` — the hard `libx264` + `ffprobe` preflight gate
- `scripts/validate-animation-output.mjs` — MP4 format validation

`scripts/render-carousel-animation.mjs` resolves these from the sibling by relative path. If timeline semantics change, change them **there**.
</reused_from_sibling>

<required_inputs>
- a path to an existing, validated `carousel.html` (output of `generate-carousel`)
- if only slides/caption exist, run `plan-carousel` then `generate-carousel` first

If no `carousel.html` exists, stop and ask. Never author slides here.
</required_inputs>

<required_reading>
1. `ffmpeg-preflight.md` in `../animate-infographic/references/` — the gate is identical
2. `references/carousel-motion-vocabulary.md` — motion families and the pacing model
3. `references/carousel-render-workflow.md` — pipeline, flags, encoder paths
4. `references/binding-lifecycle.md` — **the invariants that cause silent breakage**
5. `references/carousel-animation-qa.md` — measurement-based QA, not eyeballing
</required_reading>

<process>
1. Resolve the `carousel.html` path. Default output is an `animation/` folder beside it.
2. **ffmpeg preflight gate.** System ffmpeg with `libx264` **and** `ffprobe` on PATH. If absent, STOP and instruct `sudo apt-get install -y ffmpeg`. Never fall back to the Playwright-bundled binary (VP8/WebM-only) or to WebM.
3. Read `references/carousel-motion-vocabulary.md`. **Confirm pacing and total duration with the user before rendering** — a 13-slide deck at readable pace runs 90–120s, which is a decision, not a detail.
4. **Render `--fast` first.** Never iterate at full quality.
5. QA the fast pass against `references/carousel-animation-qa.md`. **Measure, do not eyeball.**
6. Render full quality (30fps, DSF2, `-preset slow`).
7. Validate the output with the sibling's `validate-animation-output.mjs`.
8. QA the final: poster legibility, paint ramp, settled-frame SSIM, playback order.
9. Tell the user to **set `poster.png` as the LinkedIn upload thumbnail** — LinkedIn shows frame 0 as the preview.
</process>

<non_negotiables>
**Cadence is the dial; build length is derived.** Never pin total build time and solve for stagger — that shrinks the gap between bullets as slides get denser, so the densest slide animates fastest. Exactly backwards.

**A finished reveal stays revealed.** Any element completing its motion before the group finishes must remain completed until the whole group retires. Retiring it at its own end time makes the composition visibly un-build.

**Bindings must be idempotent.** A slide may be bound more than once (page turns bind the incoming slide, then it is bound again for its own segment). A binding that is seeked and abandoned leaves inline values on real elements. Re-binding on top of that state is how `cloneNode()` silently inherits `opacity: 0` and paints nothing.

**Never re-parent a slide without restoring canonical order.** Every index resolves positionally through `querySelectorAll('.infographic')`. Moving a slide renumbers the deck from that point on, and every slide still renders — just under the wrong number.

**Endpoint checks cannot verify motion.** Frame 0, the settled frame, and the format probe all pass while the entire middle is broken. Motion is a transition *between* two correct states; verifying both proves nothing about the path. Measure the intermediate.

**Confirm before long renders.** A full-quality 13-slide pass is ~10 minutes. Agree pacing at `--fast` first.
</non_negotiables>

<output_bundle>
Written to the output folder (default `animation/` beside the source HTML):

- `animation.mp4` — H.264, yuv420p, +faststart, 1080×1350
- `poster.png` — settled cover slide, for the LinkedIn thumbnail
- `animation-manifest.yaml` — probed provenance; never mutates the carousel's own manifest
</output_bundle>

<anti_patterns>
- regenerating or re-authoring slides — consume the existing `carousel.html`
- mutating the on-disk `carousel.html` (all motion is injected in-memory)
- falling back to the Playwright-bundled ffmpeg or to WebM
- using CSS transitions/keyframes — every animated value is written imperatively by `window.__seek(t)`
- iterating at full quality
- treating a clean encode or a passing SSIM as QA success
- adding audio without telling the user LinkedIn autoplays muted
</anti_patterns>

<success_criteria>
- `validate-animation-output.mjs` returns `status: pass` (h264, yuv420p, 1080×1350, faststart)
- The paint ramp is measurably a **ramp, not a step**, across the whole deck
- Settled frames match their static PNGs at SSIM ≥ ~0.95
- Playback order is verified: midpoint lands mid-deck, final frame is the last slide
- `poster.png` is legible standalone at thumbnail size
- Frame 0 shows a dimmed but legible text layout, with the image fully dark
- The user has been told to set `poster.png` as the upload thumbnail
</success_criteria>
