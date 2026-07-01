# Animation Render Workflow

`scripts/render-animation.mjs` is the driver. It reuses the static skill's render-environment conventions and the post-render validator.

## Invocation

```bash
node scripts/render-animation.mjs <path/to/infographic.html> [--out <dir>] [--fast]
```

- `--out <dir>` — output folder (default: the source HTML's folder)
- `--fast` — iteration profile: 24fps, deviceScaleFactor 1, faster x264 preset

## Stages

1. **ffmpeg preflight** (`detectFfmpeg()`) — system `libx264` + `ffprobe` or stop (see `ffmpeg-preflight.md`).
2. **Resolve Playwright** — reuse a machine-level install. The ESM entry is `playwright/index.mjs` (the package's `import` condition); `index.js` is CJS and does **not** expose `chromium`. The driver discovers global `@playwright/cli` and npx-cache installs by absolute path.
3. **Load** the artboard at viewport 1080×1350, deviceScaleFactor 2 (1 in `--fast`), `waitUntil: 'networkidle'`.
4. **Self-derive layout readiness** (`waitForLayoutStable`) — await `document.fonts.ready`, then poll until SVG rect/text `getBBox` geometry is unchanged across 2 consecutive `requestAnimationFrame`s. The static getBBox auto-sizing script is a one-shot that mutates rect dimensions and emits **no** signal, so we detect stability ourselves instead of using a blind delay (avoids a mid-capture geometry pop).
5. **Re-validate** the settled static composition with `validatePostRenderOnPage(page)`. Fail fast if the static layout is already broken.
6. **Inject** `buildInjectionScript(TIMELINE_CONFIG)` once via `page.evaluate`. It defines `window.__seek(ms)`, `window.__animLastEndMs`, `window.__animHoldMs`, `window.__animReady`.
7. **Capture** frames: for `i` in `0..ceil(lastEndMs/frameMs)`, `window.__seek(min(i*frameMs, lastEndMs))` then `page.screenshot({ clip, type:'jpeg', quality:100, animations:'disabled' })`. Clip is the `.infographic` bounding box. JPEG (not PNG) because losslessness is wasted ahead of a yuv420p H.264 encode and JPEG is far faster — roughly halving capture time/footprint. The capture window stops at `lastEndMs`; the trailing hold is NOT re-screenshotted.
8. **Poster** — seek to `lastEndMs` and screenshot `poster.png` (PNG).
9. **Stitch** with ffmpeg:

   ```bash
   ffmpeg -y -framerate <fps> -i frames/f-%05d.jpg \
     -vf "scale=1080:1350:flags=lanczos,tpad=stop_mode=clone:stop_duration=<holdSec>" \
     -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart \
     -r <fps> animation.mp4
   ```

   `scale=...:flags=lanczos` downscales the supersampled (2×) frames for clean antialiasing; `tpad=stop_mode=clone` freezes the final frame for the hold (frame duplication, not extra screenshots).
10. **Probe + manifest** — ffprobe the result, write `animation-manifest.yaml`, remove the temp frames dir.

## Determinism notes

- Frames are a pure function of `t` — no wall-clock dependence.
- Temp frames live under the OS temp dir and are removed in a `finally` block (no debug artifacts in the output folder).
- The driver pins the Chromium it resolves so frame rendering is consistent within a run.
