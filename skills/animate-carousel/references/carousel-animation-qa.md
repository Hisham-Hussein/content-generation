<overview>
A clean encode is not QA success. Neither is a passing SSIM. **Measure the motion.**
</overview>

<central_lesson>
**Endpoint checks cannot verify motion.**

Frame 0, the settled frame, and the format probe all passed on a render where the painted reveal was broken on 12 of 13 slides. They also passed on a render where the image un-painted itself band by band, and on a render where the deck played in scrambled order.

Motion is a *transition between two correct states*. Verifying both states proves nothing about the path between them. Every defect in this skill's history lived in the intermediate frames, where nothing was asserting anything.
</central_lesson>

<validation name="output_format">
```bash
node ../animate-infographic/scripts/validate-animation-output.mjs <animation.mp4>
```

Checks `codec_name = h264`, `pix_fmt = yuv420p`, exactly `1080 × 1350`, duration ≥ 3s, and `+faststart`. Necessary, nowhere near sufficient.
</validation>

<validation name="paint_ramp">
Catches pop-in. Sample mean luminance of the image region across the video. A **ramp** means it paints; a **step** means it pops.

```bash
M=animation/animation.mp4
for t in $(seq 11.5 0.25 14.5); do
  avg=$(ffmpeg -v error -ss $t -i "$M" -frames:v 1 \
        -vf "crop=1080:520:0:580,scale=1:1" -f rawvideo -pix_fmt rgb24 - 2>/dev/null | xxd -p)
  echo "$t $avg"
done
```

Broken — a step, the image pops in one frame:
```
11.60 0c070d   12.60 0c070d   13.20 0c070d   13.80 acada7
```

Working — a ramp, strokes landing:
```
11.50 0d090e   12.25 201c20   12.50 524f4f   12.75 898783   13.00 a5a59f   13.50 adada7
```

**Deck-wide version.** Sample the whole video every 0.25s and count intermediate samples — values neither near-black nor near-final. A working 13-slide deck yields ~139 mid-paint samples across ~75 distinct luminance values. A broken one yields ~2 values per slide and no intermediates. This covers all 13 slides instead of the one you happen to screenshot.
</validation>

<validation name="settled_frame_fidelity">
Each slide's settled state must be perceptually equal to its static PNG. SSIM ≥ ~0.95 (residual is encode/resample loss; pixel equality is brittle across Chromium builds).

```bash
ffmpeg -v error -i settled-frame.png -i slide-06.png \
  -filter_complex "[1:v]scale=1080:1350[b];[0:v][b]ssim=stats_file=-" -f null -
```

Two traps, both hit during development:

**Sample a genuinely settled moment.** A mid-build frame *should* differ from the settled static. Find the hold by stepping forward until consecutive frames stop changing, then compare that frame. Comparing a mid-build frame produced 0.75 and looked like a defect that did not exist.

**Compare against the right static.** Timestamps guessed from arithmetic land on the wrong slide. Verify which slide is on screen (crop the page-number chrome) before trusting the number. A 0.62 SSIM once meant "slide 6 compared against slide-05.png," not "slide 6 is broken."
</validation>

<validation name="playback_order">
Crop the page-number chrome at several timestamps. Halfway through should be roughly the middle slide; the end must be the final slide.

```bash
ffmpeg -v error -ss 58 -i "$M" -frames:v 1 -vf "crop=1080:130:0:20,scale=540:-1" check.png
```

The driver's identity guard catches renumbering at render time; this confirms it in the encoded file.
</validation>

<visual_checks>
Still required, but only **after** the measurements:

- **Poster legibility** — open `poster.png` alone. It must read as a complete slide at thumbnail size. Many viewers never see motion.
- **Frame 0** — text a legible dimmed ghost of the full layout; the image *fully* dark (intended, not a bug).
- **Mid-build frame** — bullets landing one at a time, earlier ones settled while later ones are still dim.
- **Mid-paint frame** — the banded cascade visible, upper bands ahead of lower ones.
- **A page turn** — perspective correct, shadow receding, incoming page unbuilt.
- **CTA emphasis** — one pill at a time, both back at rest afterwards.
</visual_checks>

<linkedin_delivery_facts>
- Container/codec **MP4 / H.264**; portrait up to **4:5** in-feed (1080×1350 ✓).
- **Autoplay is muted.** Audio is near-useless for effect — a page-turn sound will not be heard by the overwhelming majority. Say this plainly before anyone invests in sound design. Muxing audio is trivial (`adelay` + `amix`); *hearing* it is the problem.
- **Frame 0 is the still preview** — always tell the user to set `poster.png` as the thumbnail.
- Re-check LinkedIn's current video requirements for a new client rather than trusting these numbers.
</linkedin_delivery_facts>

<disposition>
- Fixable (timing, a distracting motion) → tune flags, re-render `--fast`, re-measure.
- Technically valid but muddy or too dense in motion → treat as revise, not pass.
- Still failing after bounded retries → stop and escalate. Do not present as accepted.
</disposition>

<iteration_discipline>
Always iterate at `--fast`. Determinism makes it a faithful proxy, and a full-quality 13-slide pass costs ~10 minutes against ~5. Confirm pacing with the user at fast quality **before** spending a full render.
</iteration_discipline>
