<overview>
Motion must **strengthen** the static deck, never compete with it. The end state of every slide is the exact static composition. This reference defines the pacing model, the motion families, and the transition vocabulary.
</overview>

<determinism_rule>
**No CSS-driven motion anywhere.** Every animated property is written as a concrete inline value by `window.__seek(t)`. The motion layer injects `.infographic * { transition: none !important; animation: none !important }`, and screenshots use `{ animations: 'disabled' }`. Identical `t` always yields an identical frame.

This is why a `--fast` pass (24fps, DSF1) is a trustworthy proxy for the full render: composition is identical, only resolution and frame rate differ. With CSS-driven motion it would not be.

At/after a track's end the inline override is **removed** (not zeroed), so the settled DOM equals the untouched static slide.
</determinism_rule>

<pacing_model>
The single most important section. The binding constraint is **reading time**, not motion taste.

<cadence_is_the_setting>
```
stagger = FIXED          # gap between one block landing and the next starting
build   = derived        # (blocks - 1) x stagger + tail
```

**Never invert this.** Pinning total build time and solving for stagger:

```
stagger = (targetBuild - tail) / (slots - 1)     # WRONG
```

produces a cadence that *shrinks as a slide gets denser*. A 6-element slide inside a 2.4s build gets 200ms per bullet; an 11-element CTA slide gets 109ms. The densest, hardest-to-read slide animates the fastest — precisely backwards. Tested against a real viewer, this reads as bullets "thrown at your face."

A slide with six bullets **should** take longer to build than one with two. That is not an inconsistency to normalize away.

`maxBuildMs` exists only as a safety cap for pathological slides, never as a target.
</cadence_is_the_setting>

<split_build_and_hold>
- **build** = motion. The viewer is tracking arrival, not comprehending.
- **hold** = comprehension. The only stretch where the slide is settled and readable.

Loading all reading time onto the hold produces a slide that snaps together then sits still. Splitting it — a steady build plus a settled dwell — reads better at the same total duration.

Defaults that survived real review: `stagger 650ms`, `reveal 800ms`, `hold 2500ms`. A 3-bullet slide builds ~5.0s and dwells 2.5s.
</split_build_and_hold>

<duration_expectations>
Expect **90–120s for 13 slides**. This is arithmetic, not padding. Confirm it with the user before rendering. If they want it shorter, the honest lever is `--hold`, because the build is doing most of the reading work.

The hold is free at capture time — ffmpeg `tpad=stop_mode=clone` duplicates the final frame, so a longer, more readable video costs almost nothing to render. Build time costs real screenshots.
</duration_expectations>
</pacing_model>

<motion_families>
| Target | Detection | Motion |
|---|---|---|
| Text block | `.c-tag`, `.c-page-num`, `.slide-title`, `.c-cover-hook`, `.c-cover-sub`, `.c-quote`, `.c-attribution`, `.slide-body` | fade (dim→natural) + 12px rise, staggered in reveal order |
| Slide visual | `.viz-wrap img` | painted band reveal |
| CTA action pill | a `<div>` whose text is exactly Save / Repost / Follow / Share | revealed as a block, then emphasised after settle |
| Persistent chrome | `.author-footer` | **none — deliberately excluded** |
| Live SVG interior | `svg` not inside a revealed block | fills → strokes (draw-on) → text, per the sibling's vocabulary |

<persistent_chrome>
The author footer (photo, name, logo) is identical on every slide. Animating it re-fades the brand chrome once per slide — 13 flickers of the same element. Left untouched it stays rock-solid while content moves around it, and reads as a fixed frame around the deck.

Generalise: **anything identical across slides should be excluded from per-slide reveals.**
</persistent_chrome>

<reveal_order>
Chrome (tag, page number) → headline → body copy → CTA pills → visual last.

Selected explicitly, not by DOM walk, so decorative layers (`.c-ct-dots`) and chrome stay untouched.
</reveal_order>
</motion_families>

<painted_image_reveal>
The visual is laid down in **horizontal bands**, each sweeping left→right, each starting ~130ms after the band above. The result is a diagonal cascade that reads as brush strokes rather than a shutter.

Mechanics:

- The image is revealed by a **feathered gradient mask** whose stop position is driven per frame (`linear-gradient(to right, #000 X-feather%, transparent X%)`). Generous feather (~20%) — a hard edge reads mechanical.
- Each band is a **clone of the whole image clipped to its strip**. Bands are therefore seamless by construction: they are the same picture uncovered at different moments, not tiles that must align. Overlap clip rects slightly (~0.4%) as insurance against sub-pixel hairlines.
- The mask overshoots past 100% so the feathered trailing edge clears the right side before the mask is removed, avoiding a snap on the final frame.

<ghost_must_be_off>
`imgGhostDim: 0`.

A visible pre-state makes the reveal **decorative rather than revealing** — the viewer has already seen the picture, so the stroke only raises its brightness. This was tested at 15% (clearly visible) and 4.5% (still legible on a good screen); both drained the effect. Strokes must land on blank canvas.

Text still ghosts at `dimFactor` (0.15), so frame 0 remains a legible layout for the thumbnail — only the image is fully hidden.
</ghost_must_be_off>

<finished_stroke_stays>
Each band's clone must persist until **the whole image** is painted and the original is restored beneath it (`retireAtMs` = the last band's end, not the band's own end).

Retiring each clone at its own end time makes each strip fall back to the ghost as it completes — the picture appears to un-paint top-to-bottom, then snap to full. This is a real regression that the single-band version could not have: with one clone its end time *was* the ghost's end time, so they were synchronised by accident rather than by design.
</finished_stroke_stays>
</painted_image_reveal>

<cta_emphasis>
After the final slide settles, each action pill in turn: swell to ~107.5%, a bright diagonal band sweeps across its face, then ease back to rest. Sequential, with a beat of stillness between.

**Sequential, never simultaneous.** Two things pulsing at once reads as decoration; one at a time reads as an instruction.

Keep the swell modest (~7.5%). These pills sit under the author's name and logo — a big bouncy scale reads as a cheap ad. The light sweep does the attention-grabbing; the swell only points.

Implementation notes:

- A pulse needs **two abutting tracks** (1 → peak, then peak → 1), because the timeline interpolates monotonically between two endpoints. The down-track must be pushed **after** the up-track in the array and start exactly where it ends — the up-track fires `REMOVE` on the same frame the down-track sets its value, so array order is what prevents a one-frame snap at the apex.
- The pills carry **no class** — they are inline-styled divs. Identify them by their exact label text. This is also why they were originally missed by every selector and sat at full brightness from frame 0 while the rest of the slide built around them.
</cta_emphasis>

<page_turn>
The outgoing slide becomes a leaf hinged at its **left edge** (the spine) and rotates to **90°** — edge-on, zero projected width — revealing the next page beneath. A shadow anchored at the spine falls across the incoming page and recedes; the turning face darkens as it rotates out of the light.

Three deliberate choices:

**Stop at 90°, not 180°.** With a single-card format there is no facing page for a turned leaf to land on. Continuing past edge-on drops the page's back flat over the new one.

**Rotate away from the viewer, not toward.** Physically a real page lifts toward the reader — but at a 2400px perspective that magnifies the far edge ~1.8×, and the page balloons past the top and bottom of the canvas. Rotating away scales it to ~0.69× and stays in frame. A compromise for the format, worth stating rather than pretending it is physically correct.

**The incoming page is revealed in its frame-0 state**, not settled. The turn uncovers a page that has not built yet, which then builds. That is what makes the sequence read as reading rather than as a slideshow.

<not_an_ffmpeg_transition>
Verified against the local ffmpeg build: `xfade` ships 58 transitions (fade, wipes, slides, circles, dissolve, pixelize…) and **none is a page turn or curl**. `xfade=custom` cannot do it either — it evaluates each output pixel from the *same* coordinate in both inputs, while a page turn requires sampling warped coordinates.

So the turn is rendered in the browser and **captured as frames**. This changes the encoder: captured transitions concatenate, they do not overlap.

A true paper *curl* (bending sheet, curved fold highlight) needs WebGL mesh warping or a displacement pipeline — a different class of work, and heavy for a card that renders ~350px wide in-feed.
</not_an_ffmpeg_transition>
</page_turn>

<crossfade_alternative>
`--transition fade` keeps the xfade-chain path. Note what it costs on a text-heavy deck: during the blend, **both slides' text is superimposed**. Lengthening the crossfade makes this worse, not better — twice as much double-text. If a viewer says transitions feel too fast, the fix is almost always `--hold`, not `--xfade`.
</crossfade_alternative>

<out_of_scope>
- Audio (LinkedIn autoplays muted — see the QA reference before offering it)
- True paper curl, number-counter tick-up, auto-upload
</out_of_scope>
