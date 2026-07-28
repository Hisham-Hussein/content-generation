/**
 * Animated LinkedIn *carousel* render driver.
 *
 * Sibling of the content-generation `animate-infographic` skill's
 * render-animation.mjs, adapted for a multi-slide carousel.html.
 *
 * What is REUSED from the skill (single source of truth, do not fork):
 *   - detectFfmpeg()                        — the hard libx264/ffprobe preflight gate
 *   - easeOutCubic / planTracks / seekValue — the pure, unit-tested timeline math
 *
 * What is REPLACED (the skill's versions are infographic-specific):
 *   - the DOM scanner. The skill binds to `[data-content-block]`; a carousel slide
 *     has none of those. We scan the carousel's own block vocabulary instead
 *     (.slide-title, .slide-body, .viz-wrap, CTA pills). Persistent chrome
 *     (.author-footer) is deliberately NOT animated — it is identical on every
 *     slide, so per-slide reveals would flicker the brand mark 13 times.
 *   - the post-render bounds check. validatePostRenderOnPage() does
 *     querySelector('.infographic') — singular — so on a 13-slide deck it would
 *     validate slide 1 and silently pass the other 12. We check every slide.
 *
 * Pipeline:
 *   1. ffmpeg/ffprobe preflight (system libx264 build, or stop).
 *   2. Resolve a machine-level Playwright + Chromium (reuse, never auto-install).
 *   3. Load carousel.html at 1080x1350 @ DSF2, await fonts + layout stability.
 *   4. Per-slide bounds check (footer not clipped, content inside the canvas).
 *   5. Per slide: isolate it, inject the deterministic motion layer bound to THAT
 *      slide root, drive window.__seek(t) per frame, capture supersampled JPEGs.
 *   6. Between slides: bind the INCOMING slide to its frame-0 state, then bind the
 *      page turn and capture it as frames. A hinged 3D rotation cannot be an
 *      ffmpeg xfade (xfade blends matching coordinates of two inputs; a page turn
 *      needs warped sampling), so transitions are rendered, not composited.
 *   7. poster.png = the settled cover slide (the LinkedIn upload thumbnail).
 *   8. One ffmpeg pass: lanczos downscale -> per-slide hold (tpad clone) ->
 *      concat (page turns) or xfade chain (crossfades) -> H.264 yuv420p +faststart.
 *   9. Probe, write animation-manifest.yaml, clean temp frames.
 *
 * Usage:
 *   node scripts/render-carousel-animation.mjs <carousel.html> [--out <dir>] [--fast]
 *
 * Pacing flags (tune without editing this file):
 *   --stagger  gap between blocks landing, ms  (default 650) — THE pacing dial
 *   --hold     settled dwell per slide, ms     (default 2500) — reading window
 *   --reveal   one block's fade+rise, ms       (default 800)
 *   --wipe     image painted reveal, ms        (default 2000)
 *   --flip     page-turn duration, ms          (default 700)
 *   --build    max build length cap, ms        (default 6200) — safety only
 *   --transition  'flip' (default) | 'fade'
 *   --xfade    crossfade seconds               (only with --transition fade)
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// The timeline math and the ffmpeg preflight gate are OWNED by the sibling
// animate-infographic skill — imported, never forked, so both skills stay on one
// implementation. Resolved relative to this file: an absolute path would pin a
// plugin version and break on upgrade or on another machine.
const SIBLING = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../../animate-infographic/scripts',
);

async function loadSibling(file) {
  const local = path.join(SIBLING, file);
  if (existsSync(local)) return await import(pathToFileURL(local).href);
  throw new Error(
    `Cannot find sibling skill file: ${local}\n` +
    'animate-carousel imports the timeline math from animate-infographic; both must be installed.',
  );
}

const { detectFfmpeg } = await loadSibling('render-animation.mjs');
const { easeOutCubic, planTracks, seekValue, REMOVE } = await loadSibling('inject-timeline.mjs');

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;
const DEVICE_SCALE = 2;

/**
 * Carousel timing.
 *
 * The binding constraint is READING TIME, not motion taste. A slide carries a
 * title plus 2-3 bullets; a viewer needs roughly 4-5s of settled dwell to read
 * that. `holdMs` is what buys that dwell — the build is motion, the hold is
 * comprehension — so it dominates the budget and the deck runs ~60s, not ~30s.
 * Override per-run with --hold / --xfade / --stagger rather than editing this.
 */
export const CAROUSEL_TIMELINE_CONFIG = {
  dimFactor: 0.15,
  blockRisePx: 12,
  // blockStaggerMs is THE pacing dial: the gap between one bullet landing and
  // the next starting. It is fixed, and total build time is whatever falls out
  // of it — the reverse is a trap. Pinning total build instead forces stagger to
  // shrink as element count grows (a 6-element slide inside a 2.4s build gets
  // 200ms per bullet), which is precisely the rapid-fire effect to avoid.
  // maxBuildMs is only a safety cap for unusually dense slides.
  blockStaggerMs: 650,
  maxBuildMs: 6200,
  minStaggerMs: 200,
  blockRevealMs: 800,
  // Left-to-right painted reveal of the slide visual (see scanAndBindSlide).
  // The image is laid down in horizontal BANDS, each sweeping left-to-right and
  // each starting slightly after the one above it — brush strokes rather than a
  // single shutter. Feather is generous so no stroke has a machined edge.
  imgWipeMs: 2000,
  imgWipeBands: 6,
  imgBandStaggerMs: 130,
  imgWipeFeatherPct: 20,
  // The image ghost is fully OFF before its reveal. Any visible pre-state — even
  // 4.5% — makes the paint decorative rather than revealing, because the viewer
  // has already seen the picture and the stroke only raises its brightness.
  // The strokes therefore land on blank canvas. (Text still ghosts at
  // dimFactor, so frame 0 remains a legible layout for the thumbnail.)
  imgGhostDim: 0,
  // CTA emphasis: after the final slide settles, each action pill swells and
  // takes a light sweep in turn, then returns to rest. Sequential, never
  // simultaneous — two things pulsing at once reads as decoration, one at a
  // time reads as an instruction.
  ctaBreathMs: 400,
  ctaScaleUpMs: 340,
  ctaScaleDownMs: 380,
  ctaScalePeak: 1.075,
  ctaShineMs: 720,
  ctaGapMs: 260,
  // Page turn. The outgoing slide is a leaf hinged at its LEFT edge (the spine)
  // that swings away to 90deg — edge-on, i.e. zero projected width — revealing
  // the next page beneath. Stopping at 90 rather than 180 is deliberate: with a
  // single-card format there is no facing page for a turned leaf to land on, so
  // continuing past edge-on would drop the page's back flat over the new one.
  flipMs: 700,
  flipShade: 0.55,   // how dark the turning page's own face goes
  flipCastShadow: 1, // opacity of the shadow the leaf casts on the page beneath
  // SVG groups: kept for shape parity with planTracks. These slides use raster
  // <img> visuals, so no SVG track is normally emitted.
  diagramStartMs: 300,
  diagramPartStaggerMs: 90,
  diagramPartRevealMs: 500,
  diagramGroupGapMs: 300,
  accentStartMs: 1200,
  accentStaggerMs: 120,
  accentRevealMs: 450,
  // Per-slide freeze on the SETTLED slide, cloned by ffmpeg (not re-screenshotted).
  // Reading time is split between a steady ~2.4s build and this settled dwell,
  // rather than loaded entirely onto the hold.
  holdMs: 2500,
  fps: 30,
};

const DEFAULT_XFADE_SEC = 0.75;

// ---------------------------------------------------------------------------
// Playwright resolution — same reuse-never-install policy as the skill driver.
// ---------------------------------------------------------------------------
async function resolvePlaywright() {
  const candidates = ['playwright', '@playwright/cli/node_modules/playwright'];
  const home = process.env.HOME || '';
  const globs = [path.join(home, '.nvm/versions/node'), path.join(home, '.npm/_npx')];
  for (const base of globs) {
    try {
      for (const entry of readdirSync(base)) {
        candidates.push(
          path.join(base, entry, 'lib/node_modules/@playwright/cli/node_modules/playwright/index.mjs'),
          path.join(base, entry, 'node_modules/playwright/index.mjs'),
        );
      }
    } catch {}
  }
  for (const p of candidates) {
    try {
      const mod = await import(p.startsWith('/') ? pathToFileURL(p).href : p);
      if (mod && (mod.chromium || (mod.default && mod.default.chromium))) {
        return mod.chromium ? mod : mod.default;
      }
    } catch {}
  }
  throw new Error('Playwright not found. Reuse an existing machine-level install or `npm i -g @playwright/cli`.');
}

/** Await fonts, then poll until every slide's block geometry is stable across 2 rAFs. */
async function waitForLayoutStable(page) {
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) {}
    }
    // decode() every image so raster visuals cannot pop in mid-capture
    const imgs = Array.prototype.slice.call(document.images);
    await Promise.all(imgs.map((im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve())));
    const sig = () => Array.prototype.slice
      .call(document.querySelectorAll('.infographic .slide-content, .infographic .author-footer, .infographic img'))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return Math.round(r.x) + ':' + Math.round(r.y) + ':' + Math.round(r.width) + ':' + Math.round(r.height);
      }).join('|');
    const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
    let last = sig();
    let stable = 0;
    for (let i = 0; i < 120 && stable < 2; i++) {
      await raf();
      const now = sig();
      if (now === last) stable++; else { stable = 0; last = now; }
    }
  });
}

// ---------------------------------------------------------------------------
// Per-slide bounds check. Replaces validatePostRenderOnPage(), which only ever
// inspects the FIRST .infographic and therefore cannot validate a deck.
// ---------------------------------------------------------------------------
async function validateSlides(page) {
  return await page.evaluate((canvasH) => {
    const errors = [];
    const warnings = [];
    const slides = Array.prototype.slice.call(document.querySelectorAll('.infographic'));
    if (!slides.length) { errors.push('No .infographic slide roots found.'); return { errors, warnings, count: 0 }; }
    slides.forEach((slide, i) => {
      const id = slide.id || 'slide-' + (i + 1);
      const top = slide.getBoundingClientRect().top;
      const footer = slide.querySelector('.author-footer');
      if (!footer) { errors.push(`${id}: no .author-footer found.`); }
      else {
        const fr = footer.getBoundingClientRect();
        if (fr.height < 1) errors.push(`${id}: footer collapsed to zero height.`);
        if (Math.round(fr.bottom - top) > canvasH) {
          errors.push(`${id}: footer clipped — bottom at ${Math.round(fr.bottom - top)}px exceeds ${canvasH}px.`);
        }
      }
      const content = slide.querySelector('.slide-content');
      if (content) {
        const cr = content.getBoundingClientRect();
        if (Math.round(cr.bottom - top) > canvasH) {
          errors.push(`${id}: .slide-content clipped — bottom at ${Math.round(cr.bottom - top)}px exceeds ${canvasH}px.`);
        }
      }
      const r = slide.getBoundingClientRect();
      if (Math.round(r.width) !== 1080 || Math.round(r.height) !== canvasH) {
        warnings.push(`${id}: artboard is ${Math.round(r.width)}x${Math.round(r.height)}, expected 1080x${canvasH}.`);
      }
    });
    return { errors, warnings, count: slides.length };
  }, CANVAS_HEIGHT);
}

// ---------------------------------------------------------------------------
// Browser-side scanner. Runs INSIDE the page against ONE slide root.
// Carousel block vocabulary, in reveal order.
// ---------------------------------------------------------------------------
function scanAndBindSlide(slideIndex, CFG, REMOVE, planTracks, seekValue) {
  // Undo any previous binding first. Slide bindings inject helper elements
  // (band clones, CTA overlays) and a flip binding re-parents two slides into a
  // 3D container — re-binding must return the document to a clean, flat state
  // or injections accumulate across the 13 slides and 12 transitions.
  const flipBox = document.getElementById('__flip');
  if (flipBox) {
    Array.prototype.slice.call(flipBox.querySelectorAll('.infographic')).forEach((s) => {
      s.style.position = ''; s.style.left = ''; s.style.top = ''; s.style.margin = '';
      document.body.appendChild(s);
    });
    if (flipBox.parentNode) flipBox.parentNode.removeChild(flipBox);
  }
  Array.prototype.slice.call(document.querySelectorAll('[data-anim-injected]')).forEach((el) => {
    if (el.parentNode) el.parentNode.removeChild(el);
  });
  // Bindings must be IDEMPOTENT. A binding that is seeked to 0 and then
  // abandoned (which is exactly what happens to the incoming slide of a page
  // turn) leaves its frame-0 inline values on the real elements. Re-binding on
  // top of that state is how a cloned <img> silently inherits opacity:0 and
  // paints nothing. Clear only the properties this driver ever writes, on only
  // the elements it marked — the source HTML uses inline styles of its own.
  Array.prototype.slice.call(document.querySelectorAll('[data-anim-props]')).forEach((el) => {
    el.style.removeProperty('opacity');
    el.style.removeProperty('transform');
    el.style.removeProperty('mask-image');
    el.style.removeProperty('-webkit-mask-image');
    el.removeAttribute('data-anim-props');
  });

  // CANONICAL ORDER. Every index in this driver — the caller's slide number, the
  // clip lookup, the flip's (from,to) pair — resolves through
  // querySelectorAll('.infographic'), so that order IS the slide numbering.
  // Restoring a flip's re-parented slides appends them at the end of <body>,
  // which silently renumbers the whole deck from that point on. Stamp the
  // original order once, then re-sort to it on every bind.
  let all = Array.prototype.slice.call(document.querySelectorAll('.infographic'));
  all.forEach((s, i) => {
    if (!s.hasAttribute('data-anim-order')) {
      const m = /(\d+)\s*$/.exec(s.id || '');
      s.setAttribute('data-anim-order', m ? String(parseInt(m[1], 10) - 1) : String(i));
    }
  });
  all.sort((a, b) => (+a.getAttribute('data-anim-order')) - (+b.getAttribute('data-anim-order')));
  all.forEach((s) => { document.body.appendChild(s); });

  const slides = Array.prototype.slice.call(document.querySelectorAll('.infographic'));
  const root = slides[slideIndex];
  if (!root) { window.__animError = 'no slide at index ' + slideIndex; return; }

  // Isolate: only this slide is laid out, so it sits at 0,0 and the clip is exact.
  slides.forEach((s, i) => { s.style.display = i === slideIndex ? '' : 'none'; });

  // Kill any CSS-driven motion — every animated value is written by __seek.
  if (!document.getElementById('__anim_killer')) {
    const killer = document.createElement('style');
    killer.id = '__anim_killer';
    killer.textContent = '.infographic *{transition:none !important;animation:none !important}';
    document.head.appendChild(killer);
  }

  const targets = [];
  const idToEl = {};
  let n = 0;
  const add = (el, kind, index, extra) => {
    const id = 'a' + (n++);
    idToEl[id] = el;
    let naturalOpacity = 1;
    try { naturalOpacity = parseFloat(getComputedStyle(el).opacity); } catch (e) {}
    if (!(naturalOpacity >= 0)) naturalOpacity = 1;
    el.setAttribute('data-anim-props', '1');
    targets.push(Object.assign({ id, kind, index, count: 0, naturalOpacity }, extra || {}));
  };

  // Reveal order: chrome (tag/page number) -> headline -> body copy -> visual -> footer.
  // Selected explicitly rather than by DOM walk so decorative layers (.c-ct-dots)
  // and the persistent brand chrome stay untouched between slides.
  const ordered = [];
  const push = (sel) => {
    Array.prototype.slice.call(root.querySelectorAll(sel)).forEach((el) => {
      if (ordered.indexOf(el) === -1) ordered.push(el);
    });
  };
  push('.c-tag, .c-page-num');
  push('.c-cover-hook, .slide-title');
  push('.c-cover-sub, .c-quote, .c-attribution');
  push('.slide-body');

  // CTA action pills ("Save" / "Repost"). They carry no class — they are
  // inline-styled divs — so nothing above matches them, which left them at FULL
  // brightness from frame 0 while the rest of the slide built around them.
  // Identify them by their label and fold them into the reveal.
  const ctaPills = Array.prototype.slice.call(root.querySelectorAll('div')).filter((d) => {
    if (!d.children.length) return false;
    return /^(save|repost|follow|share)$/i.test((d.textContent || '').trim());
  });
  ctaPills.forEach((p) => { if (ordered.indexOf(p) === -1) ordered.push(p); });

  // .viz-wrap is handled separately below (paint wipe, not fade).
  // NOT .author-footer: it is identical on every slide, so animating it would
  // re-fade the brand chrome 13 times. Left untouched, it stays rock-solid
  // through the crossfades and reads as a fixed frame around the deck.

  // Query the <img> directly. A combined '.viz-wrap img, .viz-wrap' selector
  // returns the WRAPPER (it precedes its own child in document order), which
  // silently skips the wipe on every slide.
  const vizImg = root.querySelector('.viz-wrap img');

  // Cadence is FIXED at blockStaggerMs; build length is derived from it. A slide
  // with more bullets simply takes longer to build, which is correct — six
  // bullets cannot be delivered readably in the same time as two. Stagger is
  // compressed only if a dense slide would otherwise exceed maxBuildMs.
  const slots = ordered.length + (vizImg ? 1 : 0);
  const tail = vizImg ? CFG.imgWipeMs : CFG.blockRevealMs;
  let stagger = CFG.blockStaggerMs;
  if (slots > 1 && (slots - 1) * stagger + tail > CFG.maxBuildMs) {
    stagger = (CFG.maxBuildMs - tail) / (slots - 1);
    if (stagger < CFG.minStaggerMs) stagger = CFG.minStaggerMs;
  }
  const CFG2 = {};
  for (const k in CFG) CFG2[k] = CFG[k];
  CFG2.blockStaggerMs = stagger;

  ordered.forEach((el, i) => add(el, 'block', i));

  // Any live SVG interior (none expected on raster slides, but handled for
  // parity). MUST be collected before planTracks — targets added afterwards
  // would never be planned.
  let fillI = 0, strokeI = 0, textI = 0, accentI = 0;
  Array.prototype.slice.call(root.querySelectorAll('svg')).forEach((svg) => {
    if (ordered.some((o) => o.contains(svg))) return; // already block-revealed as a whole
    Array.prototype.slice
      .call(svg.querySelectorAll('polygon, rect, circle, ellipse, line, polyline, path, text'))
      .forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (tag === 'text') {
          const isAccent = el.hasAttribute('data-accent');
          add(el, isAccent ? 'accent' : 'text', isAccent ? accentI++ : textI++);
          return;
        }
        let stroke = '';
        try { stroke = getComputedStyle(el).stroke; } catch (e) {}
        const hasStroke = stroke && stroke !== 'none' && el.getAttribute('stroke') !== 'none' && el.getAttribute('stroke');
        if (hasStroke) {
          let len = 0; try { len = el.getTotalLength ? el.getTotalLength() : 0; } catch (e) {}
          add(el, 'stroke', strokeI++, { strokeLength: len, hasExistingDash: !!el.getAttribute('stroke-dasharray') });
        } else {
          if (el.getAttribute('fill') === 'none') return;
          add(el, 'fill', fillI++);
        }
      });
  });

  const tracks = planTracks(targets, CFG2);

  // ---- paint wipe on the slide visual -------------------------------------
  // The image is revealed left-to-right by a feathered gradient mask, as if
  // painted on. Two layers are needed: the ORIGINAL stays at dim opacity so
  // frame 0 is still a legible ghost of the full slide (the thumbnail rule),
  // and a pinned CLONE at full opacity carries the wipe over the top. At the
  // end of the track the clone is hidden and the original's inline opacity is
  // dropped, so the settled DOM is byte-identical to the static slide.
  if (vizImg) {
    const wrap = vizImg.closest('.viz-wrap') || vizImg.parentElement;
    if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
    const ir = vizImg.getBoundingClientRect();
    const wr = wrap.getBoundingClientRect();
    const startMs = ordered.length * stagger;
    const endMs = startMs + CFG.imgWipeMs;

    let vizNat = 1;
    try { vizNat = parseFloat(getComputedStyle(vizImg).opacity); } catch (e) {}
    if (!(vizNat >= 0)) vizNat = 1;

    const ghostId = 'a' + (n++);
    idToEl[ghostId] = vizImg;
    vizImg.setAttribute('data-anim-props', '1');
    // from === to: holds the ghost at its (very dark) rest value for the whole
    // reveal, then REMOVE at endMs restores natural opacity underneath the
    // completed strokes.
    tracks.push({
      id: ghostId, prop: 'opacity',
      from: CFG.imgGhostDim * vizNat, to: CFG.imgGhostDim * vizNat,
      startMs: startMs, endMs: endMs,
    });

    // One clone per horizontal band. Each is the full image clipped to its own
    // strip, so the strips are seamless by construction — they are the same
    // picture, just uncovered at different moments. Bands overlap slightly so
    // no hairline gap can appear between adjacent clip rects.
    const bands = Math.max(1, CFG.imgWipeBands);
    const bandStagger = CFG.imgBandStaggerMs;
    const sweepMs = Math.max(300, CFG.imgWipeMs - (bands - 1) * bandStagger);
    const bandH = 100 / bands;

    for (let b = 0; b < bands; b++) {
      const top = b * bandH;
      const bottom = 100 - (b + 1) * bandH;
      const clone = vizImg.cloneNode(false);
      clone.removeAttribute('id');
      clone.style.position = 'absolute';
      clone.style.left = (ir.left - wr.left) + 'px';
      clone.style.top = (ir.top - wr.top) + 'px';
      clone.style.width = ir.width + 'px';
      clone.style.height = ir.height + 'px';
      clone.style.maxHeight = 'none';
      clone.style.maxWidth = 'none';
      clone.style.margin = '0';
      clone.style.pointerEvents = 'none';
      // cloneNode copies the ORIGINAL's inline style. If a prior binding left
      // the image at its ghost opacity, every stroke would paint invisibly.
      clone.style.removeProperty('opacity');
      clone.style.removeProperty('mask-image');
      clone.style.removeProperty('-webkit-mask-image');
      clone.removeAttribute('data-anim-props');
      clone.setAttribute('data-anim-injected', '1');
      clone.style.clipPath = 'inset(' + Math.max(0, top - 0.4).toFixed(3) + '% 0% ' +
        Math.max(0, bottom - 0.4).toFixed(3) + '% 0%)';
      wrap.appendChild(clone);

      const wipeId = 'a' + (n++);
      idToEl[wipeId] = clone;
      // Overshoot past 1 so the feathered trailing edge has cleared the right
      // side before the mask is removed — otherwise the last frame would snap.
      tracks.push({
        id: wipeId, prop: 'maskWipe',
        from: 0, to: 1 + CFG.imgWipeFeatherPct / 100,
        feather: CFG.imgWipeFeatherPct,
        startMs: startMs + b * bandStagger,
        endMs: startMs + b * bandStagger + sweepMs,
        // A finished stroke STAYS on the canvas. The clone is retired only when
        // the whole image is painted and the (dim) original is restored to full
        // opacity beneath it — retiring it at its own endMs instead would drop
        // that strip back to the ghost, re-darkening the picture band by band.
        retireAtMs: endMs,
      });
    }
  }

  // ---- CTA emphasis on the final slide's action pills ----------------------
  // Runs AFTER the whole slide has settled, one pill at a time: swell, a light
  // sweep across the face, then back to rest. Every value is removed at the end
  // of its track, so the slide still settles to the untouched static DOM (which
  // matters doubly here — this is the frame ffmpeg clones for the closing hold).
  if (ctaPills.length) {
    const settled = tracks.length ? Math.max.apply(null, tracks.map((t) => t.endMs)) : 0;
    let cursor = settled + CFG.ctaBreathMs;

    ctaPills.forEach((pill) => {
      const cs = getComputedStyle(pill);
      if (cs.position === 'static') pill.style.position = 'relative';

      // Light sweep: a bright diagonal band travelling across the pill face,
      // clipped to the pill's own rounded rect.
      const ov = document.createElement('div');
      ov.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;overflow:hidden;' +
        'pointer-events:none;border-radius:' + cs.borderRadius + ';';
      const inner = document.createElement('div');
      inner.style.cssText = 'position:absolute;top:-25%;bottom:-25%;left:0;width:55%;' +
        'background:linear-gradient(105deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.45) 50%,rgba(255,255,255,0) 100%);' +
        'transform:translateX(-180%);';
      ov.setAttribute('data-anim-injected', '1');
      ov.appendChild(inner);
      pill.appendChild(ov);

      const upStart = cursor;
      const upEnd = upStart + CFG.ctaScaleUpMs;
      const downEnd = upEnd + CFG.ctaScaleDownMs;

      // Swell. The down-track is pushed AFTER the up-track and starts exactly
      // where it ends, so the up-track's REMOVE is overwritten in the same
      // __seek pass — no one-frame snap back to rest at the apex.
      pill.setAttribute('data-anim-props', '1');
      const upId = 'a' + (n++);
      idToEl[upId] = pill;
      tracks.push({ id: upId, prop: 'scale', from: 1, to: CFG.ctaScalePeak, startMs: upStart, endMs: upEnd });

      const downId = 'a' + (n++);
      idToEl[downId] = pill;
      tracks.push({ id: downId, prop: 'scale', from: CFG.ctaScalePeak, to: 1, startMs: upEnd, endMs: downEnd });

      const shineId = 'a' + (n++);
      idToEl[shineId] = inner;
      tracks.push({ id: shineId, prop: 'shine', from: -1, to: 1, startMs: upStart, endMs: upStart + CFG.ctaShineMs });

      cursor = Math.max(downEnd, upStart + CFG.ctaShineMs) + CFG.ctaGapMs;
    });
  }

  const lastEnd = tracks.length ? Math.max.apply(null, tracks.map((t) => t.endMs)) : 0;
  window.__animDebug = { slideIndex: slideIndex, targets: targets.length, tracks: tracks.length };
  window.__animLastEndMs = lastEnd;
  window.__animHoldMs = CFG.holdMs;

  window.__seek = function (t) {
    for (let i = 0; i < tracks.length; i++) {
      const tr = tracks[i];
      const el = idToEl[tr.id];
      if (!el) continue;
      const v = seekValue(tr, t);
      if (v === REMOVE) {
        if (tr.prop === 'opacity') el.style.removeProperty('opacity');
        else if (tr.prop === 'transform') el.style.removeProperty('transform');
        else if (tr.prop === 'scale') el.style.removeProperty('transform');
        else if (tr.prop === 'shine') el.style.display = 'none';
        else if (tr.prop === 'maskWipe') {
          // This stroke has finished sweeping. Drop its mask so the strip stays
          // fully painted, and keep the clone on screen until retireAtMs — the
          // moment the whole image is done and the original is restored beneath.
          el.style.webkitMaskImage = '';
          el.style.maskImage = '';
          el.style.display = (tr.retireAtMs != null && t < tr.retireAtMs) ? '' : 'none';
        } else if (tr.prop === 'strokeDashoffset') {
          el.style.removeProperty('stroke-dashoffset');
          el.style.removeProperty('stroke-dasharray');
        }
      } else if (tr.prop === 'scale') {
        el.style.transform = 'scale(' + v + ')';
      } else if (tr.prop === 'shine') {
        // v: -1 (off the left edge) .. 1 (clear of the right edge)
        el.style.display = '';
        el.style.transform = 'translateX(' + (-180 + (v + 1) * 0.5 * 460).toFixed(2) + '%)';
      } else if (tr.prop === 'maskWipe') {
        const edge = v * 100;
        const grad = 'linear-gradient(to right, #000 ' + (edge - tr.feather).toFixed(2) + '%, ' +
          'rgba(0,0,0,0) ' + edge.toFixed(2) + '%)';
        el.style.display = '';
        el.style.webkitMaskImage = grad;
        el.style.maskImage = grad;
      } else if (tr.prop === 'opacity') {
        el.style.opacity = String(v);
      } else if (tr.prop === 'transform') {
        el.style.transform = 'translateY(' + v + 'px)';
      } else if (tr.prop === 'strokeDashoffset') {
        el.style.strokeDasharray = String(tr.dashLen);
        el.style.strokeDashoffset = String(v);
      }
    }
  };

  window.__seek(0);
  window.__animReady = true;
}

// ---------------------------------------------------------------------------
// Page-turn binding. Runs INSIDE the page against a PAIR of slides — the only
// binding that touches two at once. Assumes scanAndBindSlide(toIdx) has just
// run, so the incoming page is sitting in its frame-0 state: the turn reveals a
// page that has not built yet, which is what makes the sequence read as reading.
// ---------------------------------------------------------------------------
function scanAndBindFlip(fromIdx, toIdx, CFG, REMOVE, seekValue) {
  const slides = Array.prototype.slice.call(document.querySelectorAll('.infographic'));
  const outgoing = slides[fromIdx];
  const incoming = slides[toIdx];
  if (!outgoing || !incoming) { window.__animError = 'flip: missing slide'; return; }

  slides.forEach((s, i) => { s.style.display = (i === fromIdx || i === toIdx) ? '' : 'none'; });

  const W = 1080, H = 1350;
  const box = document.createElement('div');
  box.id = '__flip';
  box.style.cssText = 'position:fixed;left:0;top:0;width:' + W + 'px;height:' + H + 'px;' +
    'perspective:2400px;perspective-origin:50% 50%;z-index:9999;';
  document.body.appendChild(box);

  // Incoming page sits flat underneath.
  incoming.style.position = 'absolute';
  incoming.style.left = '0'; incoming.style.top = '0'; incoming.style.margin = '0';
  box.appendChild(incoming);

  // Shadow the lifting leaf casts onto the page beneath — anchored at the spine
  // and falling off to the right, receding as the leaf clears the page.
  const cast = document.createElement('div');
  cast.setAttribute('data-anim-injected', '1');
  cast.style.cssText = 'position:absolute;left:0;top:0;width:' + W + 'px;height:' + H + 'px;' +
    'pointer-events:none;background:linear-gradient(to right,rgba(0,0,0,0.72) 0%,' +
    'rgba(0,0,0,0.34) 26%,rgba(0,0,0,0) 58%);';
  box.appendChild(cast);

  // The leaf: hinged at the spine, carrying the outgoing page.
  const leaf = document.createElement('div');
  leaf.setAttribute('data-anim-injected', '1');
  leaf.style.cssText = 'position:absolute;left:0;top:0;width:' + W + 'px;height:' + H + 'px;' +
    'transform-origin:left center;transform-style:preserve-3d;';
  box.appendChild(leaf);

  outgoing.style.position = 'absolute';
  outgoing.style.left = '0'; outgoing.style.top = '0'; outgoing.style.margin = '0';
  leaf.appendChild(outgoing);

  // The turning face darkens as it rotates out of the light.
  const shade = document.createElement('div');
  shade.setAttribute('data-anim-injected', '1');
  shade.style.cssText = 'position:absolute;left:0;top:0;width:' + W + 'px;height:' + H + 'px;' +
    'pointer-events:none;background:#000;opacity:0;';
  leaf.appendChild(shade);

  const idToEl = { leaf: leaf, shade: shade, cast: cast };
  const tracks = [
    { id: 'leaf', prop: 'rotateY', from: 0, to: -90, startMs: 0, endMs: CFG.flipMs },
    { id: 'shade', prop: 'opacity', from: 0, to: CFG.flipShade, startMs: 0, endMs: CFG.flipMs },
    { id: 'cast', prop: 'fadeOut', from: CFG.flipCastShadow, to: 0, startMs: 0, endMs: CFG.flipMs },
  ];

  window.__animDebug = { flip: fromIdx + '->' + toIdx, tracks: tracks.length };
  window.__animLastEndMs = CFG.flipMs;
  window.__animHoldMs = 0;

  window.__seek = function (t) {
    for (let i = 0; i < tracks.length; i++) {
      const tr = tracks[i];
      const el = idToEl[tr.id];
      const v = seekValue(tr, t);
      if (v === REMOVE) {
        // Leaf is edge-on and the shadow has cleared: both retire, leaving the
        // incoming page alone in frame-0 state — exactly where its own segment
        // begins, so the seam between transition and slide is invisible.
        el.style.display = 'none';
      } else if (tr.prop === 'rotateY') {
        el.style.transform = 'rotateY(' + v + 'deg)';
      } else {
        el.style.opacity = String(v);
      }
    }
  };

  window.__seek(0);
  window.__animReady = true;
}

export function buildFlipInjection(fromIdx, toIdx, cfg = CAROUSEL_TIMELINE_CONFIG) {
  return (
    '(function(){' +
    'window.__animReady=false;window.__animError=null;' +
    'var REMOVE=' + JSON.stringify(REMOVE) + ';' +
    'var CFG=' + JSON.stringify(cfg) + ';' +
    'var easeOutCubic=' + easeOutCubic.toString() + ';' +
    'var seekValue=' + seekValue.toString() + ';' +
    'var scanAndBindFlip=' + scanAndBindFlip.toString() + ';' +
    'scanAndBindFlip(' + JSON.stringify(fromIdx) + ',' + JSON.stringify(toIdx) + ',CFG,REMOVE,seekValue);' +
    '})();'
  );
}

/** Serialise the SAME pure timeline functions the skill uses into a page IIFE. */
export function buildSlideInjection(slideIndex, cfg = CAROUSEL_TIMELINE_CONFIG) {
  return (
    '(function(){' +
    'window.__animReady=false;window.__animError=null;' +
    'var REMOVE=' + JSON.stringify(REMOVE) + ';' +
    'var CFG=' + JSON.stringify(cfg) + ';' +
    'var IDX=' + JSON.stringify(slideIndex) + ';' +
    'var easeOutCubic=' + easeOutCubic.toString() + ';' +
    'var planTracks=' + planTracks.toString() + ';' +
    'var seekValue=' + seekValue.toString() + ';' +
    'var scanAndBindSlide=' + scanAndBindSlide.toString() + ';' +
    'scanAndBindSlide(IDX,CFG,REMOVE,planTracks,seekValue);' +
    '})();'
  );
}

const frameName = (i) => 'f-' + String(i).padStart(5, '0') + '.jpg';

async function renderCarouselAnimation(htmlPath, opts = {}) {
  const fast = !!opts.fast;
  const cfg = { ...CAROUSEL_TIMELINE_CONFIG, fps: fast ? 24 : CAROUSEL_TIMELINE_CONFIG.fps };
  if (opts.holdMs != null) cfg.holdMs = opts.holdMs;
  if (opts.staggerMs != null) cfg.blockStaggerMs = opts.staggerMs;
  if (opts.revealMs != null) cfg.blockRevealMs = opts.revealMs;
  if (opts.buildMs != null) cfg.maxBuildMs = opts.buildMs;
  if (opts.wipeMs != null) cfg.imgWipeMs = opts.wipeMs;
  const xfadeSec = opts.xfadeSec != null ? opts.xfadeSec : DEFAULT_XFADE_SEC;
  if (opts.flipMs != null) cfg.flipMs = opts.flipMs;
  const useFlip = opts.transition !== 'fade';
  const fps = cfg.fps;
  const scale = fast ? 1 : DEVICE_SCALE;
  const outDir = opts.outDir || path.dirname(path.resolve(htmlPath));
  mkdirSync(outDir, { recursive: true });

  const { ffprobe } = detectFfmpeg();
  const playwright = await resolvePlaywright();

  const framesRoot = mkdtempSync(path.join(tmpdir(), 'carousel-anim-'));
  const browser = await playwright.chromium.launch();
  let manifest;
  try {
    const page = await browser.newPage({
      deviceScaleFactor: scale,
      viewport: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    });
    await page.goto(pathToFileURL(path.resolve(htmlPath)).href, { waitUntil: 'networkidle' });
    await waitForLayoutStable(page);

    const bounds = await validateSlides(page);
    if (bounds.errors.length) {
      throw new Error('Static carousel fails per-slide bounds check; fix it before animating:\n' + bounds.errors.join('\n'));
    }
    for (const w of bounds.warnings) console.error('warn: ' + w);
    const slideCount = bounds.count;
    console.error(`slides: ${slideCount}`);

    const segments = [];
    for (let s = 0; s < slideCount; s++) {
      await page.evaluate(buildSlideInjection(s, cfg));
      const ready = await page.evaluate(() => ({
        ready: !!window.__animReady,
        lastEndMs: window.__animLastEndMs,
        holdMs: window.__animHoldMs,
        debug: window.__animDebug,
        err: window.__animError || null,
      }));
      if (!ready.ready) throw new Error(`Motion layer failed to bind on slide ${s + 1}: ${ready.err || 'unknown'}`);
      if (!ready.debug || ready.debug.tracks === 0) {
        throw new Error(`Slide ${s + 1} produced zero motion tracks — the scanner matched nothing.`);
      }

      const box = await page.evaluate((idx) => {
        const el = document.querySelectorAll('.infographic')[idx];
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height, id: el.id || '' };
      }, s);
      // Identity guard: index-to-slide resolution is positional, so any DOM
      // reordering renumbers the deck. A frame count check cannot catch that —
      // every slide still renders, just the wrong one under each number.
      const expectedId = 'slide-' + (s + 1);
      if (box.id && box.id !== expectedId) {
        throw new Error(`Slide order corrupted: index ${s} resolved to "${box.id}", expected "${expectedId}".`);
      }
      const clip = {
        x: Math.round(box.x), y: Math.round(box.y),
        width: Math.round(box.width), height: Math.round(box.height),
      };

      const dir = path.join(framesRoot, 's' + String(s).padStart(2, '0'));
      mkdirSync(dir, { recursive: true });
      const frameMs = 1000 / fps;
      const frameCount = Math.ceil(ready.lastEndMs / frameMs) + 1;
      for (let i = 0; i < frameCount; i++) {
        const t = Math.min(i * frameMs, ready.lastEndMs);
        await page.evaluate((tt) => window.__seek(tt), t);
        await page.screenshot({ path: path.join(dir, frameName(i)), clip, type: 'jpeg', quality: 100, animations: 'disabled' });
      }

      // Cover slide, fully settled, is the LinkedIn thumbnail.
      if (s === 0) {
        await page.evaluate((tt) => window.__seek(tt), ready.lastEndMs);
        await page.screenshot({ path: path.join(outDir, 'poster.png'), clip, type: 'png', animations: 'disabled' });
      }

      segments.push({ kind: 'slide', dir, frameCount, buildMs: ready.lastEndMs, holdMs: ready.holdMs, targets: ready.debug.targets });
      console.error(`slide ${s + 1}/${slideCount}: ${ready.debug.targets} targets, ${frameCount} frames, build ${ready.lastEndMs}ms`);

      // ----- page turn into the next slide -----
      // Captured as real frames rather than composited by ffmpeg: a hinged 3D
      // rotation cannot be expressed as an xfade (which only blends matching
      // coordinates of two inputs). Bind the incoming slide FIRST so the turn
      // reveals it in frame-0 state, then hand both slides to the flip binding.
      if (useFlip && s < slideCount - 1) {
        await page.evaluate(buildSlideInjection(s + 1, cfg));
        await page.evaluate(buildFlipInjection(s, s + 1, cfg));
        const fready = await page.evaluate(() => ({
          ready: !!window.__animReady,
          lastEndMs: window.__animLastEndMs,
          err: window.__animError || null,
        }));
        if (!fready.ready) throw new Error(`Flip ${s + 1}->${s + 2} failed to bind: ${fready.err || 'unknown'}`);

        const fdir = path.join(framesRoot, 'f' + String(s).padStart(2, '0'));
        mkdirSync(fdir, { recursive: true });
        const fClip = { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
        const fCount = Math.ceil(fready.lastEndMs / frameMs) + 1;
        for (let i = 0; i < fCount; i++) {
          const t = Math.min(i * frameMs, fready.lastEndMs);
          await page.evaluate((tt) => window.__seek(tt), t);
          await page.screenshot({ path: path.join(fdir, frameName(i)), clip: fClip, type: 'jpeg', quality: 100, animations: 'disabled' });
        }
        segments.push({ kind: 'flip', dir: fdir, frameCount: fCount, holdMs: 0 });
        console.error(`  flip ${s + 1}->${s + 2}: ${fCount} frames`);
      }
    }

    await browser.close();

    // ----- one ffmpeg pass -----
    // With page turns the transitions are already frames, so segments simply
    // concatenate. With crossfades they must overlap, which needs the xfade
    // chain. Both paths downscale the supersampled frames with lanczos and
    // clone-pad each slide's settled hold rather than re-screenshotting it.
    const args = ['-y'];
    for (const seg of segments) {
      args.push('-framerate', String(fps), '-i', path.join(seg.dir, 'f-%05d.jpg'));
    }
    const filters = [];
    const segDur = [];
    segments.forEach((seg, i) => {
      const holdSec = seg.holdMs / 1000;
      const pad = holdSec > 0 ? `tpad=stop_mode=clone:stop_duration=${holdSec.toFixed(3)},` : '';
      filters.push(
        `[${i}:v]scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:flags=lanczos,` + pad +
        `fps=${fps},format=yuv420p,setsar=1[s${i}]`,
      );
      segDur.push(seg.frameCount / fps + holdSec);
    });

    const mp4Path = path.join(outDir, 'animation.mp4');
    if (useFlip) {
      filters.push(segments.map((_, i) => `[s${i}]`).join('') + `concat=n=${segments.length}:v=1:a=0[vout]`);
      args.push(
        '-filter_complex', filters.join(';'),
        '-map', '[vout]',
        '-c:v', 'libx264', '-preset', fast ? 'medium' : 'slow', '-crf', '18',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(fps),
        mp4Path,
      );
      execFileSync('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } else {
      let prev = 's0';
      let offset = segDur[0] - xfadeSec;
      for (let i = 1; i < segments.length; i++) {
        const out = 'x' + i;
        filters.push(
          `[${prev}][s${i}]xfade=transition=fade:duration=${xfadeSec}:offset=${offset.toFixed(3)}[${out}]`,
        );
        prev = out;
        offset = offset + segDur[i] - xfadeSec;
      }
      args.push(
        '-filter_complex', filters.join(';'),
        '-map', '[' + prev + ']',
        '-c:v', 'libx264', '-preset', fast ? 'medium' : 'slow', '-crf', '18',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(fps),
        mp4Path,
      );
      execFileSync('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    }

    const probe = JSON.parse(execFileSync(ffprobe, [
      '-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name,width,height,pix_fmt:format=duration',
      '-of', 'json', mp4Path,
    ], { encoding: 'utf8' }));
    const stream = probe.streams[0];

    manifest = {
      source_html: path.resolve(htmlPath),
      outputs: { mp4: mp4Path, poster: path.join(outDir, 'poster.png') },
      render_method: 'playwright-chromium-seek-loop-per-slide',
      slides: segments.filter((x) => x.kind === 'slide').length,
      transition: useFlip ? 'page-turn' : 'crossfade',
      fps,
      supersample: scale,
      frame_count: segments.reduce((a, s) => a + s.frameCount, 0),
      per_slide_build_ms: segments[0].buildMs,
      segment_count: segments.length,
      hold_ms: cfg.holdMs,
      crossfade_sec: useFlip ? null : xfadeSec,
      flip_ms: useFlip ? cfg.flipMs : null,
      codec: stream.codec_name,
      pix_fmt: stream.pix_fmt,
      width: stream.width,
      height: stream.height,
      duration_sec: Number(parseFloat(probe.format.duration).toFixed(3)),
      faststart: true,
      motion: ['block-reveal', 'image-paint-wipe-ltr', 'cta-pill-swell-shine',
        useFlip ? 'page-turn-3d' : 'per-slide-crossfade'],
      block_stagger_ms: cfg.blockStaggerMs,
      max_build_ms: cfg.maxBuildMs,
      img_wipe_ms: cfg.imgWipeMs,
      slide_bounds_validated: 'pass',
    };
    writeFileSync(path.join(outDir, 'animation-manifest.yaml'), toYaml(manifest));
  } finally {
    try { await browser.close(); } catch {}
    rmSync(framesRoot, { recursive: true, force: true });
  }
  return manifest;
}

function toYaml(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  let out = '';
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) out += `${pad}${k}:\n` + v.map((x) => `${pad}  - ${x}`).join('\n') + '\n';
    else if (v && typeof v === 'object') out += `${pad}${k}:\n` + toYaml(v, indent + 1);
    else out += `${pad}${k}: ${v}\n`;
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const htmlPath = args.find((a) => !a.startsWith('--'));
  if (!htmlPath || !existsSync(htmlPath)) {
    console.error('Usage: node render-carousel-animation.mjs <carousel.html> [--out <dir>] [--fast]');
    process.exit(1);
  }
  const flag = (name) => {
    const i = args.indexOf(name);
    return i >= 0 && args[i + 1] != null ? args[i + 1] : undefined;
  };
  const num = (name) => {
    const v = flag(name);
    if (v === undefined) return undefined;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) throw new Error(`${name} expects a non-negative number, got "${v}"`);
    return n;
  };
  const manifest = await renderCarouselAnimation(htmlPath, {
    fast: args.includes('--fast'),
    outDir: flag('--out'),
    holdMs: num('--hold'),        // settled dwell per slide (ms) — the reading window
    xfadeSec: num('--xfade'),     // crossfade seconds (only when --transition fade)
    flipMs: num('--flip'),        // page-turn duration (ms)
    transition: flag('--transition'), // 'flip' (default) | 'fade'
    buildMs: num('--build'),      // target reveal length per slide (ms)
    wipeMs: num('--wipe'),        // image paint-wipe duration (ms)
    staggerMs: num('--stagger'),  // upper clamp on the solved block stagger (ms)
    revealMs: num('--reveal'),    // duration of a single block's fade+rise (ms)
  });
  console.log(JSON.stringify(manifest, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.message || e); process.exit(1); });
}

export { renderCarouselAnimation };
