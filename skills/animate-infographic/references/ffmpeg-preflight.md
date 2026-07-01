# ffmpeg Preflight Gate

Producing a LinkedIn-ready MP4 requires a **system ffmpeg built with `libx264`**, plus `ffprobe` for output validation. This is a hard gate — there is no in-tree fallback.

## Why the Playwright-bundled ffmpeg cannot be used

Playwright vendors a binary at `~/.cache/ms-playwright/ffmpeg-*/ffmpeg-linux`, but it is built `--disable-everything` and exposes only:

- encoders: `libvpx_vp8`, `png`
- muxers: `webm`, `image2`

It has **no H.264 encoder, no mp4/mov muxer, and ships no `ffprobe` at all**. It is useless for this skill. Do not attempt to use it.

## Gate (binary)

1. System `ffmpeg` on PATH **with `libx264`** and a sibling `ffprobe` on PATH → proceed.
   - `ffmpeg -hide_banner -encoders | grep -q libx264`
   - `ffprobe -hide_banner -version`
2. Otherwise **STOP** and tell the user:

   ```bash
   sudo apt-get update && sudo apt-get install -y ffmpeg
   ```

   Never fall back to the Playwright binary or emit WebM.

`scripts/render-animation.mjs` runs this gate via its `detectFfmpeg()` export before launching Chromium, and `scripts/validate-animation-output.mjs` depends on the same PATH `ffprobe`.
