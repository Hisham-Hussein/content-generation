# Animation Render Workflow

`scripts/render-animation.mjs` is the driver. It reuses the static skill's render-environment conventions and the post-render validator, and exports an animated GIF.

## Invocation

```bash
node scripts/render-animation.mjs <path/to/infographic.html> \
  [--out <dir>] [--fast] [--max-mb <n>] [--width <px>]
```

- `--out <dir>` — output folder (default: the source HTML's folder)
- `--fast` — iteration profile: 10fps capture, deviceScaleFactor 1
- `--max-mb <n>` — size budget (default 8). The ladder walks down until the GIF fits.
- `--width <px>` — pin the top of the quality ladder; the ladder then only steps **down** from there

## Frame rate is not free

GIF stores a per-frame delay in **centiseconds**, so only frame rates dividing 100 evenly round-trip without drift:

| fps | delay | exact? |
|-----|-------|--------|
| 25 | 4cs | ✅ |
| 20 | 5cs | ✅ |
| 12.5 | 8cs | ✅ |
| 10 | 10cs | ✅ |
| 30 | 3.33cs → 3cs | ❌ plays ~10% fast |
| 24 | 4.17cs → 4cs | ❌ plays ~4% fast |

The driver captures at **20fps** (10 in `--fast`). 25 was used before the guide orb: the orb's halo is a large block of changing pixels every single frame, which is precisely what `diff_mode=rectangle` cannot compress, and 25fps pushed post 61 to 5.1MB. Dropping to 20 brought it to 4.15MB with no visible cost — this choreography is slow drifting motion, which does not need the extra temporal resolution. Ladder steps may only *decimate* from the captured rate (via the `fps=` filter), never exceed it.

## Stages

1. **ffmpeg preflight** (`detectFfmpeg()`) — `gif` encoder + `palettegen`/`paletteuse` + `ffprobe`, or stop (see `ffmpeg-preflight.md`).
2. **Resolve Playwright** — reuse a machine-level install. The ESM entry is `playwright/index.mjs` (the package's `import` condition); `index.js` is CJS and does **not** expose `chromium`. The driver discovers global `@playwright/cli` and npx-cache installs by absolute path.
3. **Load** the artboard at viewport 1080×1350, deviceScaleFactor 2 (1 in `--fast`), `waitUntil: 'networkidle'`.
4. **Self-derive layout readiness** (`waitForLayoutStable`) — await `document.fonts.ready`, then poll until SVG rect/text `getBBox` geometry is unchanged across 2 consecutive `requestAnimationFrame`s. The static getBBox auto-sizing script is a one-shot that mutates rect dimensions and emits **no** signal, so we detect stability ourselves instead of using a blind delay (avoids a mid-capture geometry pop).
5. **Re-validate** the settled static composition with `validatePostRenderOnPage(page)`. Fail fast if the static layout is already broken.
6. **Inject** `buildInjectionScript(TIMELINE_CONFIG)` once via `page.evaluate`. It defines `window.__seek(ms)`, `window.__animLastEndMs`, `window.__animHoldMs`, `window.__animReady`.
7. **Capture** frames: for `i` in `0..ceil(lastEndMs/frameMs)`, `window.__seek(min(i*frameMs, lastEndMs))` then `page.screenshot({ clip, type:'jpeg', quality:100, animations:'disabled' })`. Clip is the `.infographic` bounding box. JPEG (not PNG) because losslessness is wasted ahead of a 256-colour palette quantisation and JPEG is far faster — roughly halving capture time/footprint. The capture window stops at `lastEndMs`; the trailing hold is NOT screenshotted.
8. **Poster** — seek to `lastEndMs` and screenshot `poster.png` (PNG).
9. **Encode** — two passes per ladder step:

   ```bash
   # pass 1: build the palette
   ffmpeg -y -framerate 20 -i frames/f-%05d.jpg \
     -vf "scale=1080:1350:flags=lanczos,palettegen=stats_mode=diff:max_colors=256" \
     -update 1 palette.png

   # pass 2: map frames onto it
   ffmpeg -y -framerate 20 -i frames/f-%05d.jpg -i palette.png \
     -lavfi "scale=1080:1350:flags=lanczos[s];[s][1:v]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" \
     -loop 0 -final_delay 100 animation.gif
   ```

   - `scale=...:flags=lanczos` downscales the supersampled (2×) frames for clean antialiasing.
   - `palettegen=stats_mode=diff` weights the palette toward the *moving* regions, which is what a build-on animation needs — `full` over-weights the large static background.
   - `paletteuse ... diff_mode=rectangle` stores only the changed rectangle of each frame. This is where most of the size saving comes from.
   - `dither=bayer:bayer_scale=3` — an ordered pattern. It is quiet on flat brand fills and compresses far better than error diffusion (`sierra2_4a`), which sprays fresh per-frame noise into LZW and inflates the file.
   - `-loop 0` — infinite loop.
   - `-final_delay <holdMs/10>` (centiseconds) — the trailing hold. Note this replaces the MP4 pipeline's `tpad=stop_mode=clone`: cloning ~25 frames to freeze the end would cost real bytes and buy nothing, since GIF can just extend the last frame's delay.

10. **Size ladder** — steps are tried best-first until the file fits `--max-mb`:

    | step | width | colours | fps |
    |------|-------|---------|-----|
    | 1 | 1080 | 256 | 20 |
    | 2 | 1080 | 160 | 20 |
    | 3 | 900 | 128 | 20 |
    | 4 | 800 | 128 | 12.5 |
    | 5 | 720 | 96 | 12.5 |

    If step 5 is still over budget, the driver **throws** rather than shipping an oversized asset. The fix is a shorter timeline, not a bigger budget.

11. **Probe + manifest** — ffprobe the result with `-count_frames` (GIF has no reliable header frame count), write `animation-manifest.yaml`, remove the temp frames dir (which also holds `palette.png`).

## Determinism notes

- Frames are a pure function of `t` — no wall-clock dependence.
- Temp frames and the palette live under the OS temp dir and are removed in a `finally` block (no debug artifacts in the output folder).
- The driver pins the Chromium it resolves so frame rendering is consistent within a run.
- The ladder makes size a *deterministic* function of the composition, not a manual tuning session — but it also means two different infographics can land on different resolutions. The manifest records which.

## Measured baseline

`61-claude-code-5-weak-spots/infographic.html` → ladder step 1, 1080×1350, 151 frames, 8.9s, **3.47MB** (with the guide orb at `intensity` 0.4; 1.47MB for the 3.6s base build before the orb and the pacing change). Flat brand art with few colours compresses well; a photo-heavy or gradient-heavy composition will step further down the ladder.
