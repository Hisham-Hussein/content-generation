# Animated Asset Manifest Contract

`scripts/render-animation.mjs` writes `animation-manifest.yaml` into the output folder. It is a **separate** file — it never mutates the static infographic's `manifest.yaml`.

## Fields

```yaml
source_html: <absolute path to the input infographic.html>
outputs:
  mp4: <absolute path to animation.mp4>
  poster: <absolute path to poster.png>
render_method: playwright-chromium-seek-loop
fps: 30                      # 24 in --fast
supersample: 2              # deviceScaleFactor used for capture (1 in --fast)
frame_count: <int>          # captured frames (excludes the cloned hold)
capture_end_ms: <int>       # window.__animLastEndMs — build completes here
hold_ms: 1000               # trailing freeze, cloned by ffmpeg tpad
codec: h264                 # probed from the encoded file
pix_fmt: yuv420p
width: 1080
height: 1350
duration_sec: <float>       # probed; includes the hold
faststart: true
motion:                     # motion families applied
  - block-reveal
  - svg-fill-reveal
  - svg-stroke-draw-on
  - accent-emphasis
post_render_revalidated: pass   # status of the static post-render bounds re-check
```

## Notes

- `duration_sec` = `capture_end_ms/1000 + hold_ms/1000` (within encode rounding).
- `post_render_revalidated` records that the static composition passed the sibling bounds validator before animation — provenance that the animated output sits on a valid static base.
- Values are probed from the actual encoded file (ffprobe), not assumed.
