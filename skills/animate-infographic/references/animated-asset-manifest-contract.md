# Animated Asset Manifest Contract

`scripts/render-animation.mjs` writes `animation-manifest.yaml` into the output folder. It is a **separate** file — it never mutates the static infographic's `manifest.yaml`.

## Fields

```yaml
source_html: <absolute path to the input infographic.html>
outputs:
  gif: <absolute path to animation.gif>
  poster: <absolute path to poster.png>
render_method: playwright-chromium-seek-loop
capture_fps: 20             # 10 in --fast; must divide 100 (see the workflow doc)
supersample: 2              # deviceScaleFactor used for capture (1 in --fast)
captured_frames: <int>      # frames screenshotted (excludes the hold)
capture_end_ms: <int>       # window.__animLastEndMs — build completes here
hold_ms: 1000               # trailing freeze, applied as the muxer's -final_delay
codec: gif                  # probed from the encoded file
gif_fps: 20                 # the ladder step's rate; <= capture_fps
max_colors: 256             # the ladder step's palette size
dither: bayer:bayer_scale=3
ladder_steps_tried: <int>   # 1 means the top quality step fit the budget
width: 1080                 # probed; < 1080 means the ladder stepped down
height: 1350
gif_frames: <int>           # ffprobe -count_frames; < captured_frames if decimated
duration_sec: <float>       # probed; includes the final_delay hold
size_bytes: <int>
size_mb: <float>
size_budget_mb: 8           # --max-mb
loop: infinite
motion:                     # motion families applied
  - block-reveal
  - svg-fill-reveal
  - svg-stroke-draw-on
  - accent-emphasis
post_render_revalidated: pass   # status of the static post-render bounds re-check
```

## Notes

- `duration_sec` ≈ `captured_frames/gif_fps + hold_ms/1000` (within centisecond quantisation).
- `ladder_steps_tried > 1` means the top-quality encode exceeded the budget and the driver stepped down. **Surface this to the user** — they are uploading a downscaled or colour-reduced asset. `width < 1080` is the visible symptom.
- `gif_frames < captured_frames` means a ladder step decimated with the `fps=` filter.
- `post_render_revalidated` records that the static composition passed the sibling bounds validator before animation — provenance that the animated output sits on a valid static base.
- Values are probed from the actual encoded file (ffprobe + `stat`), not assumed.
