<overview>
`scripts/render-carousel-animation.mjs` is the driver. This reference covers invocation, stages, the two encoder paths, and capture economics.
</overview>

<invocation>
```bash
node scripts/render-carousel-animation.mjs <carousel.html> [--out <dir>] [--fast] [flags]
```

| Flag | Default | Meaning |
|---|---|---|
| `--out <dir>` | folder of the source HTML | output folder (convention: an `animation/` subfolder) |
| `--fast` | off | 24fps, deviceScaleFactor 1, faster x264 preset — **always iterate here** |
| `--stagger <ms>` | 650 | gap between blocks landing — **the pacing dial** |
| `--hold <ms>` | 2500 | settled dwell per slide — the reading window |
| `--reveal <ms>` | 800 | one block's fade+rise |
| `--wipe <ms>` | 2000 | painted image reveal |
| `--flip <ms>` | 700 | page-turn duration |
| `--build <ms>` | 6200 | max build cap — safety only, never a target |
| `--transition` | `flip` | `flip` (captured page turn) or `fade` (xfade chain) |
| `--xfade <sec>` | 0.75 | crossfade length, only with `--transition fade` |
</invocation>

<stages>
1. **ffmpeg preflight** (`detectFfmpeg()`, imported from the sibling skill) — system `libx264` + `ffprobe` or stop.
2. **Resolve Playwright** — reuse a machine-level install, never auto-install. ESM entry is `playwright/index.mjs`; `index.js` is CJS and does not expose `chromium`.
3. **Load** `carousel.html` at viewport 1080×1350, deviceScaleFactor 2 (1 in `--fast`), `waitUntil: 'networkidle'`.
4. **Layout readiness** — await `document.fonts.ready`, `decode()` every image (raster visuals must not pop mid-capture), then poll until slide geometry is unchanged across 2 consecutive rAFs.
5. **Per-slide bounds check** — every slide: footer present, not collapsed, not clipped; content inside the canvas. This replaces the sibling's `validatePostRenderOnPage()`, which inspects only the first `.infographic` and cannot validate a deck.
6. **Per slide:** bind → identity guard → capture build frames via `__seek(t)` → settled.
7. **Between slides:** bind the *incoming* slide (frame-0 state), bind the flip, capture transition frames.
8. **Poster** — the settled cover slide, as PNG.
9. **Encode** (one ffmpeg pass), probe, write `animation-manifest.yaml`, remove temp frames.
</stages>

<encoder_paths>
Captured page turns and composited crossfades need different graphs.

**Page turns → concatenate.** Transitions are already frames, so segments simply follow one another:

```
[i:v] scale=1080:1350:flags=lanczos, [tpad if slide], fps, format=yuv420p, setsar=1 [sN]
[s0][s1]...[sN] concat=n=N:v=1:a=0 [vout]
```

**Crossfades → overlap.** Segments must blend, requiring a chained `xfade` with cumulative offsets:

```
offset_1 = dur_0 - xfade
offset_k = offset_{k-1} + dur_k - xfade
```

Both paths lanczos-downscale the supersampled frames and clone-pad each slide's hold with `tpad=stop_mode=clone` rather than re-screenshotting it — which is why a longer hold is nearly free.
</encoder_paths>

<capture_economics>
- Build frames are real screenshots; hold frames are cloned by ffmpeg. **Lengthening the hold costs almost nothing; lengthening the build costs linearly.**
- Frames are JPEG quality 100, not PNG — losslessness is wasted ahead of a yuv420p H.264 encode, and JPEG roughly halves capture time.
- A 13-slide deck at default pacing is ~2200 frames at DSF2, about 10 minutes. `--fast` is roughly half.
</capture_economics>

<determinism_notes>
- Frames are a pure function of `t` — no wall-clock dependence.
- Temp frames live under the OS temp dir and are removed in a `finally` block.
- Because composition is identical between `--fast` and full quality, a fast pass is a faithful proxy for everything except resolution and frame rate.
</determinism_notes>

<manifest>
`animation-manifest.yaml` records probed values (codec, dimensions, duration from `ffprobe`) plus the pacing actually used (`block_stagger_ms`, `hold_ms`, `img_wipe_ms`, `flip_ms`, `transition`). It never mutates the carousel's own `manifest.yaml`.

Keep the `motion` list honest — it is provenance. If you add a motion family, add its label.
</manifest>
