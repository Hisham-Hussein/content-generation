# Animation QA Checklist

A clean encode is **not** QA success. Inspect the artifacts.

## Output format (automated — `validate-animation-output.mjs`)

- `codec_name = h264`
- `pix_fmt = yuv420p`
- dimensions exactly `1080 × 1350` (4:5 portrait)
- duration ≥ 3s
- moov atom precedes mdat (`+faststart` took effect)

## Visual (manual inspection)

- **Poster legibility** — open `poster.png` alone. It must read as a complete, legible infographic at thumbnail size. This is the most important frame: many viewers never see motion.
- **First frame** — the composed-but-dimmed ghost should already show the full layout, not an empty artboard.
- **Smoothness** — sample the first/mid/final frames (or scrub the MP4). Motion should be calm and staggered, never frantic or simultaneous. No mid-animation geometry pop (would indicate the layout-stability gate was skipped).
- **End state** — the final frame must be the exact static composition. Verify it is **perceptually** equal to the source `infographic.png` (SSIM / downscaled diff — not pixel-equality, which is brittle across Chromium builds). The motion layer restores the static DOM, so they should match closely.
- **Legibility-in-motion** — text must be readable while it settles. If the build feels crowded or the diagram is hard to follow in motion, the source infographic is too dense for video — simplify the static first.

## LinkedIn video specs (cite, don't assume — verify against current LinkedIn help)

LinkedIn re-encodes uploads, but conservative, broadly-accepted targets are:

- container/codec: **MP4 / H.264** (this skill's output)
- aspect ratio: portrait up to **4:5** is supported in-feed (1080×1350 ✓)
- duration: feed video minimum **~3s** (our ~7–9s ✓); generous maximum
- audio: optional — LinkedIn accepts silent video (this skill produces no audio track)
- autoplay is **muted**; the first frame is the still preview

Before publishing for a new client, re-check LinkedIn's current video requirements rather than relying on these numbers.

## Disposition

- Fixable (timing, a distracting reveal) → tune `TIMELINE_CONFIG` and re-render within a bounded loop.
- Technically valid but crowded/muddy/weak in motion → treat as revise, not pass.
- Still failing after bounded retries → stop and escalate; do not present as accepted.
