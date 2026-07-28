---
name: animate-infographic
description: Use when a user wants the static LinkedIn infographic turned into a short animated MP4 (the autoplay "animated infographic" format) for LinkedIn, built from an already-generated infographic.html.
---

# Animate Infographic

Sibling to `generate-infographic`. It does **not** generate from source text — it **composes on top of** a validated static infographic, layering deterministic motion and exporting a LinkedIn-ready **H.264 MP4** plus a `poster.png` thumbnail.

The core fact that defines this skill: **LinkedIn animates only native MP4 video.** Uploaded images and GIFs render static. So an "animated infographic" is a short, muted-autoplay MP4 — not an animated image.

## Required Inputs

- a path to an existing, validated `infographic.html` (the output of `generate-infographic`)
- if the user only has source text, run `generate-infographic` first to produce the static HTML, then animate it

If no infographic.html exists, stop and ask — do not regenerate the composition here.

**Multi-slide carousel? Use `animate-carousel` instead.** This driver assumes ONE artboard: it binds `[data-content-block]` (carousels have none), and its bounds validator inspects only the first `.infographic`. Pointed at a `carousel.html` it binds nothing, produces a static video, and passes every format check.

## Read Before Generating

1. `references/ffmpeg-preflight.md`
2. `references/animation-motion-vocabulary.md`
3. `references/animation-render-workflow.md`
4. `references/animation-qa-checklist.md`
5. `references/animated-asset-manifest-contract.md`

## Reused from `generate-infographic` (do not duplicate)

- `../generate-infographic/scripts/validate-post-render.mjs` — re-run on the settled static composition before animating
- `../generate-infographic/scripts/validate-mobile-linkedin-infographic.mjs` — the input HTML must still satisfy the mobile contract
- `../../references/shared-art-direction-principles.md` — generic visual quality floor

## Workflow

1. Resolve inputs: tenant folder (if relevant) and the path to the validated `infographic.html`. Default output folder is the same folder as the source HTML.
2. **ffmpeg preflight gate** (`references/ffmpeg-preflight.md`). System ffmpeg with `libx264` **and** `ffprobe` on PATH are mandatory. If absent, STOP and instruct `sudo apt-get install -y ffmpeg`. Never fall back to the Playwright-bundled binary (it is VP8/WebM-only) or to WebM.
3. Re-validate the input HTML against the mobile contract (`validate-mobile-linkedin-infographic.mjs`).
4. Read `references/animation-motion-vocabulary.md`. Confirm the motion plan and total duration with the user before rendering.
5. Render with `scripts/render-animation.mjs <infographic.html> [--out <dir>] [--fast]` (`references/animation-render-workflow.md`). The driver:
   - reuses a machine-level Playwright + Chromium (never auto-installs);
   - loads the artboard at 1080×1350 @ DSF2, waits for `document.fonts.ready`, then **derives layout-ready itself** (polls SVG rect geometry stable across 2 rAFs — the static getBBox one-shot has settled);
   - re-runs the post-render bounds validator on the settled static composition;
   - injects the deterministic motion layer and drives `window.__seek(t)` per frame, capturing supersampled JPEG frames;
   - exports `poster.png` = the final settled frame;
   - ffmpeg lanczos-downscales to 1080×1350, clone-pads the final frame for the hold, encodes H.264 yuv420p +faststart;
   - writes `animation-manifest.yaml` and cleans temp frames.
6. Validate the output with `scripts/validate-animation-output.mjs <animation.mp4>` (codec h264, pix_fmt yuv420p, 1080×1350, duration ≥ 3s, faststart).
7. QA against `references/animation-qa-checklist.md` and `../../references/shared-art-direction-principles.md`:
   - inspect `poster.png` standalone — it must be legible as a thumbnail;
   - inspect the MP4's first/mid/final frames — motion must be smooth and end on the full static composition;
   - the final captured frame must be **perceptually** equal to the source `infographic.png` (the motion layer restores the static DOM exactly).
8. If QA fails on something fixable (timing, a distracting motion), tune `TIMELINE_CONFIG` in `inject-timeline.mjs` and re-render within a bounded loop. If it still fails, stop and escalate.
9. Tell the user to **set `poster.png` as the LinkedIn upload thumbnail** — LinkedIn shows frame 0 as the preview and its custom-thumbnail handling is inconsistent for short clips.

## Output Bundle

Written alongside the source `infographic.html` (same asset folder) by default:

- `animation.mp4` — H.264, yuv420p, +faststart, 1080×1350
- `poster.png` — final frame, for the LinkedIn thumbnail
- `animation-manifest.yaml` — separate manifest; does **not** mutate the infographic's `manifest.yaml`

## Do Not

- regenerate the infographic composition — consume the existing `infographic.html`
- mutate the on-disk `infographic.html` (motion is injected in-memory only)
- fall back to the Playwright-bundled ffmpeg or to WebM when system ffmpeg is missing — stop instead
- use CSS transitions/keyframes for motion — every animated value is set imperatively by `window.__seek(t)` (see `references/animation-motion-vocabulary.md`)
- leave temp frames in the output folder
- treat a successful encode as QA success — inspect the poster and the MP4
- add audio, number-counter tick-up, or auto-upload (out of scope for v1)
