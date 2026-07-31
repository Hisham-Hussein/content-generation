---
name: animate-infographic
description: Use when a user wants the static LinkedIn infographic turned into a short looping animated GIF (the autoplay "animated infographic" format) for LinkedIn, built from an already-generated infographic.html.
---

# Animate Infographic

Sibling to `generate-infographic`. It does **not** generate from source text — it **composes on top of** a validated static infographic, layering deterministic motion and exporting a LinkedIn-ready **looping animated GIF** plus a `poster.png` static still.

The core fact that defines this skill: **GIF is the format that performs as an animated infographic on LinkedIn.** A GIF uploads as an image, plays inline and loops forever — no video-post treatment, no thumbnail step, no tap-to-play. Uploading the same motion as an MP4 turns the post into a video post, which is a different unit with different reach behaviour.

Two consequences shape the whole pipeline:

- **GIF delays are stored in centiseconds**, so the capture frame rate must divide 100 evenly. This skill captures at **20fps** (5cs/frame) — 30fps quantises to 3cs and plays ~10% fast.
- **GIF has no inter-frame motion compensation**, so file size is a first-class constraint. The driver walks a quality ladder (resolution × palette size × fps) until the file fits the size budget, and records which step it landed on.

## Required Inputs

- a path to an existing, validated `infographic.html` (the output of `generate-infographic`)
- if the user only has source text, run `generate-infographic` first to produce the static HTML, then animate it

If no infographic.html exists, stop and ask — do not regenerate the composition here.

**Multi-slide carousel? Use `animate-carousel` instead.** This driver assumes ONE artboard: it walks a single `.infographic` root, and its reading-order engine bands elements into rows across that one artboard. Pointed at a `carousel.html` it would choreograph every slide as though they shared a page. (`animate-carousel` still emits MP4 and still schedules by element kind — it was not converted.)

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
2. **ffmpeg preflight gate** (`references/ffmpeg-preflight.md`). System ffmpeg with the `gif` encoder, the `palettegen`/`paletteuse` filters, **and** `ffprobe` on PATH are mandatory. If absent, STOP and instruct `sudo apt-get install -y ffmpeg`. Never fall back to the Playwright-bundled binary (no GIF muxer, no ffprobe).
3. Re-validate the input HTML against the mobile contract (`validate-mobile-linkedin-infographic.mjs`).
4. **Motion-coverage gate** — `scripts/validate-motion-coverage.mjs <infographic.html>`. Confirms the motion layer actually binds the composition's content instead of animating a handful of elements while the rest sit at full opacity. A layout that nests cards inside an SVG-wrapping container will fail here; fix the scan, never lower the threshold. Run this **before** spending a render.
5. Read `references/animation-motion-vocabulary.md`. Confirm the motion plan and total duration with the user before rendering.
6. Render with `scripts/render-animation.mjs <infographic.html> [--out <dir>] [--fast] [--max-mb <n>] [--width <px>]` (`references/animation-render-workflow.md`). The driver:
   - reuses a machine-level Playwright + Chromium (never auto-installs);
   - loads the artboard at 1080×1350 @ DSF2, waits for `document.fonts.ready`, then **derives layout-ready itself** (polls SVG rect geometry stable across 2 rAFs — the static getBBox one-shot has settled);
   - re-runs the post-render bounds validator on the settled static composition;
   - injects the deterministic motion layer — scheduling every element by its **rendered position**, clustered into reading beats, with a **guide orb** travelling that same path — and drives `window.__seek(t)` per frame at **20fps**, capturing supersampled JPEG frames;
   - exports `poster.png` = the final settled frame;
   - two-pass palette encodes (`palettegen stats_mode=diff` → `paletteuse diff_mode=rectangle`), stepping down the quality ladder until the GIF fits the size budget, with the hold applied as the muxer's `-final_delay` rather than cloned frames;
   - writes `animation-manifest.yaml` and cleans temp frames.
7. Validate the output with `scripts/validate-animation-output.mjs <animation.gif> [--max-mb <n>]` (GIF89a, codec gif, 4:5 aspect, ≥720px wide, more than one frame, infinite loop, within budget).
8. QA against `references/animation-qa-checklist.md` and `../../references/shared-art-direction-principles.md`:
   - inspect `poster.png` standalone — it must be legible as a still;
   - **play it once and ask: did your eye go where you would read?** Choreography is derived from layout, so it differs per infographic and no automated check substitutes for this;
   - inspect the GIF's first/mid/final frames — motion must be smooth and end on the full static composition;
   - check the **guide orb**: it must lead each beat (arrive before the element lights up, never after), and be fully gone by the final frame;
   - check for **palette artefacts**: banding in gradients, dither crosshatch on flat fills, colour shift in brand accents. These are GIF-specific and no automated check catches them;
   - the final captured frame must be **perceptually** equal to the source `infographic.png` (the motion layer restores the static DOM exactly).
9. If QA fails on something fixable (timing, a distracting motion), tune `TIMELINE_CONFIG` in `inject-timeline.mjs` and re-render within a bounded loop. If the failure is palette artefacts, raise `max_colors` or change `GIF_DITHER` in `render-animation.mjs`. If it still fails, stop and escalate.
10. Report the manifest's `size_mb` and which ladder step it landed on. If the ladder stepped below 1080px, say so — the user is uploading a downscaled asset and should know.
11. Tell the user to upload `animation.gif` **as an image**, not as a video. LinkedIn loops it inline; there is no thumbnail to pick.

## Output Bundle

Written alongside the source `infographic.html` (same asset folder) by default:

- `animation.gif` — GIF89a, infinite loop, 4:5 portrait (1080×1350 unless the size ladder stepped down)
- `poster.png` — final frame; the static still and the QA anchor, **not** a LinkedIn upload asset
- `animation-manifest.yaml` — separate manifest; does **not** mutate the infographic's `manifest.yaml`

## Do Not

- regenerate the infographic composition — consume the existing `infographic.html`
- mutate the on-disk `infographic.html` (motion is injected in-memory only)
- fall back to the Playwright-bundled ffmpeg when system ffmpeg is missing — stop instead
- emit MP4/WebM — a video post is a different unit on LinkedIn (use `animate-carousel` if you genuinely need video)
- capture at a frame rate that does not divide 100 (30fps, 24fps) — GIF centisecond delays cannot represent it
- use CSS transitions/keyframes for motion — every animated value is set imperatively by `window.__seek(t)` (see `references/animation-motion-vocabulary.md`)
- ship a GIF over the size budget by raising `--max-mb` instead of shortening the timeline — a heavy GIF stalls on mobile
- leave temp frames or `palette.png` in the output folder
- treat a successful encode as QA success — inspect the poster and the GIF's frames
- add audio, number-counter tick-up, or auto-upload (out of scope for v1)
