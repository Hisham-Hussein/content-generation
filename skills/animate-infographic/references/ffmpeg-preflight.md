# ffmpeg Preflight Gate

Producing a LinkedIn-ready animated GIF requires a **system ffmpeg with the `gif` encoder and the `palettegen`/`paletteuse` filters**, plus `ffprobe` for output validation. This is a hard gate — there is no in-tree fallback.

A default distro build (`apt-get install ffmpeg`) has all four. The gate exists to catch minimal/stripped builds and the Playwright binary.

## Why the Playwright-bundled ffmpeg cannot be used

Playwright vendors a binary at `~/.cache/ms-playwright/ffmpeg-*/ffmpeg-linux`, but it is built `--disable-everything` and exposes only:

- encoders: `libvpx_vp8`, `png`
- muxers: `webm`, `image2`

It has **no GIF encoder or muxer, and ships no `ffprobe` at all**. It is useless for this skill. Do not attempt to use it.

## Gate (binary)

1. All four present → proceed.
   - `ffmpeg -hide_banner -encoders | grep -E '^\s*V\S*\s+gif\s'`
   - `ffmpeg -hide_banner -filters | grep -w palettegen`
   - `ffmpeg -hide_banner -filters | grep -w paletteuse`
   - `ffprobe -hide_banner -version`
2. Otherwise **STOP** and tell the user:

   ```bash
   sudo apt-get update && sudo apt-get install -y ffmpeg
   ```

   Never fall back to the Playwright binary.

`scripts/render-animation.mjs` runs this gate via its `detectFfmpeg()` export before launching Chromium, and `scripts/validate-animation-output.mjs` depends on the same PATH `ffprobe`.

## Not required

- **`libx264`** — no longer needed; this skill emits no H.264.
- **`gifsicle`** — an optional external optimiser. The two-pass palette encode with `diff_mode=rectangle` already produces sizes in range (measured: 1.47MB at 1080×1350 / 256 colours / 25fps / 3.6s), so the driver does not shell out to it and must not start depending on it.
