/**
 * Deterministic motion-timeline builder for animated LinkedIn infographics.
 *
 * Two responsibilities, one source of truth:
 *   1. PURE timeline math (easeOutCubic / planTracks / seekValue / timelineTotalMs)
 *      — unit-tested in Node with no browser.
 *   2. buildInjectionScript() — serialises those SAME pure functions into a
 *      self-contained in-page IIFE that scans the static infographic DOM and
 *      defines a deterministic `window.__seek(ms)`. The render driver evaluates
 *      that string once per page; every frame is then `window.__seek(t)` +
 *      screenshot. No CSS transitions/keyframes are ever used (see D3a): every
 *      animated property is written as a concrete inline value by __seek, and
 *      at/after a track's end the inline override is REMOVED so the final DOM
 *      equals the untouched static composition.
 *
 * The sentinel REMOVE is a plain string (not a Symbol) so the pure functions
 * survive Function.prototype.toString() serialisation into the page intact.
 */

export const REMOVE = '__ANIM_REMOVE__';

export const TIMELINE_CONFIG = {
  // frame 0 is composed-but-dimmed (legible thumbnail), not blank
  dimFactor: 0.15,
  // HTML content blocks: fade + small rise, staggered by DOM order
  blockRisePx: 10,
  blockStaggerMs: 700,
  blockRevealMs: 1100,
  // SVG diagram interior parts animate in groups: fills, then strokes (draw-on),
  // then text labels. Each group is offset by diagramGroupGapMs.
  diagramStartMs: 800,
  diagramPartStaggerMs: 120,
  diagramPartRevealMs: 700,
  diagramGroupGapMs: 600,
  // accent emphasis (data-accent) lands last
  accentStartMs: 5600,
  accentStaggerMs: 150,
  accentRevealMs: 600,
  // trailing freeze on the full composition (clean loop boundary)
  holdMs: 1000,
  fps: 30,
};

export function easeOutCubic(p) {
  const c = p < 0 ? 0 : p > 1 ? 1 : p;
  return 1 - Math.pow(1 - c, 3);
}

/**
 * Pure: target descriptors -> animation tracks.
 * target: { id, kind: 'block'|'fill'|'stroke'|'text'|'accent', index, count,
 *           naturalOpacity, strokeLength?, hasExistingDash? }
 * track:  { id, prop: 'opacity'|'transform'|'strokeDashoffset',
 *           from, to, startMs, endMs, [fromPx,toPx,axis] | [dashLen] }
 */
export function planTracks(targets, cfg) {
  const tracks = [];
  for (const t of targets) {
    const nat = typeof t.naturalOpacity === 'number' ? t.naturalOpacity : 1;
    const dim = cfg.dimFactor * nat;

    if (t.kind === 'block') {
      const startMs = t.index * cfg.blockStaggerMs;
      const endMs = startMs + cfg.blockRevealMs;
      tracks.push({ id: t.id, prop: 'opacity', from: dim, to: nat, startMs, endMs });
      tracks.push({
        id: t.id, prop: 'transform', axis: 'translateY',
        from: cfg.blockRisePx, to: 0, fromPx: cfg.blockRisePx, toPx: 0, startMs, endMs,
      });
      continue;
    }

    if (t.kind === 'stroke' && !t.hasExistingDash && t.strokeLength > 0) {
      const startMs = cfg.diagramStartMs + cfg.diagramGroupGapMs + t.index * cfg.diagramPartStaggerMs;
      const endMs = startMs + cfg.diagramPartRevealMs;
      tracks.push({
        id: t.id, prop: 'strokeDashoffset',
        from: t.strokeLength, to: 0, dashLen: t.strokeLength, startMs, endMs,
      });
      continue;
    }

    // fill, text, accent, and dashed strokes all reveal via opacity in their group window
    let groupBase;
    if (t.kind === 'fill') groupBase = cfg.diagramStartMs;
    else if (t.kind === 'stroke') groupBase = cfg.diagramStartMs + cfg.diagramGroupGapMs;
    else if (t.kind === 'text') groupBase = cfg.diagramStartMs + 2 * cfg.diagramGroupGapMs;
    else groupBase = cfg.accentStartMs; // accent

    const stagger = t.kind === 'accent' ? cfg.accentStaggerMs : cfg.diagramPartStaggerMs;
    const reveal = t.kind === 'accent' ? cfg.accentRevealMs : cfg.diagramPartRevealMs;
    const startMs = groupBase + t.index * stagger;
    const endMs = startMs + reveal;
    tracks.push({ id: t.id, prop: 'opacity', from: dim, to: nat, startMs, endMs });
  }
  return tracks;
}

/** Pure: value of a track at time t. REMOVE means "drop the inline override". */
export function seekValue(track, t) {
  if (t >= track.endMs) return REMOVE;
  if (t <= track.startMs) return track.from;
  const p = (t - track.startMs) / (track.endMs - track.startMs);
  const e = easeOutCubic(p);
  return track.from + (track.to - track.from) * e;
}

/** Pure: total timeline length including the trailing hold. */
export function timelineTotalMs(tracks, cfg) {
  const lastEnd = tracks.length ? Math.max(...tracks.map((t) => t.endMs)) : 0;
  return lastEnd + cfg.holdMs;
}

// ---------------------------------------------------------------------------
// Browser-side bootstrap. Runs INSIDE the page. Receives the pure functions as
// arguments (serialised by buildInjectionScript) so there is one implementation.
// ---------------------------------------------------------------------------
function scanAndBind(CFG, REMOVE, planTracks, seekValue) {
  const root = document.querySelector('.infographic');
  if (!root) { window.__animError = 'no .infographic root'; return; }

  // Kill any CSS-driven motion — every value is set imperatively by __seek.
  const killer = document.createElement('style');
  killer.textContent = '.infographic *{transition:none !important;animation:none !important}';
  document.head.appendChild(killer);

  const targets = [];
  const idToEl = {};
  let n = 0;
  const add = (el, kind, index, count, extra) => {
    const id = 'a' + (n++);
    idToEl[id] = el;
    let naturalOpacity = 1;
    try { naturalOpacity = parseFloat(getComputedStyle(el).opacity); } catch (e) {}
    if (!(naturalOpacity >= 0)) naturalOpacity = 1;
    targets.push(Object.assign({ id, kind, index, count, naturalOpacity }, extra || {}));
    return id;
  };

  // 1) HTML content blocks (skip any block that wraps an SVG — its interior is
  //    animated part-by-part instead, avoiding double-dimming).
  const blocks = Array.prototype.slice.call(root.querySelectorAll('[data-content-block]'));
  blocks.forEach((b, domIndex) => {
    if (b.querySelector('svg')) return;
    add(b, 'block', domIndex, blocks.length);
  });

  // 2) SVG interior parts, grouped by geometry.
  const svgs = Array.prototype.slice.call(root.querySelectorAll('svg'));
  let fillI = 0, strokeI = 0, textI = 0, accentI = 0;
  svgs.forEach((svg) => {
    const kids = Array.prototype.slice.call(
      svg.querySelectorAll('polygon, rect, circle, ellipse, line, polyline, path, text')
    );
    kids.forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'text') {
        const isAccent = el.hasAttribute('data-accent');
        add(el, isAccent ? 'accent' : 'text', isAccent ? accentI++ : textI++, 0);
        return;
      }
      let stroke = '';
      try { stroke = getComputedStyle(el).stroke; } catch (e) {}
      const hasStroke = stroke && stroke !== 'none' && el.getAttribute('stroke') !== 'none' && el.getAttribute('stroke');
      if (hasStroke) {
        let len = 0; try { len = el.getTotalLength ? el.getTotalLength() : 0; } catch (e) {}
        add(el, 'stroke', strokeI++, 0, {
          strokeLength: len,
          hasExistingDash: !!el.getAttribute('stroke-dasharray'),
        });
      } else {
        const fill = el.getAttribute('fill');
        if (fill === 'none') return;
        add(el, 'fill', fillI++, 0);
      }
    });
  });

  const tracks = planTracks(targets, CFG);
  window.__animDebug = { root: !!root, blocks: blocks.length, svgs: svgs.length, targets: targets.length, tracks: tracks.length };
  const lastEnd = tracks.length ? Math.max.apply(null, tracks.map((t) => t.endMs)) : 0;
  // capture window ends at lastEnd (the fully-built static composition); the
  // trailing hold is cloned by ffmpeg, NOT re-screenshotted.
  window.__animLastEndMs = lastEnd;
  window.__animHoldMs = CFG.holdMs;
  window.__animTotalMs = lastEnd + CFG.holdMs;

  window.__seek = function (t) {
    for (let i = 0; i < tracks.length; i++) {
      const tr = tracks[i];
      const el = idToEl[tr.id];
      if (!el) continue;
      const v = seekValue(tr, t);
      if (v === REMOVE) {
        if (tr.prop === 'opacity') el.style.removeProperty('opacity');
        else if (tr.prop === 'transform') el.style.removeProperty('transform');
        else if (tr.prop === 'strokeDashoffset') {
          el.style.removeProperty('stroke-dashoffset');
          el.style.removeProperty('stroke-dasharray');
        }
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

  window.__seek(0); // settle into the composed-but-dimmed frame 0
  window.__animReady = true;
}

/**
 * Returns a self-contained script string that defines window.__seek(ms) and
 * window.__animTotalMs against the loaded infographic. Evaluate it once after
 * layout is stable, then drive frames with window.__seek(t).
 */
export function buildInjectionScript(cfg = TIMELINE_CONFIG) {
  return (
    '(function(){' +
    'var REMOVE=' + JSON.stringify(REMOVE) + ';' +
    'var CFG=' + JSON.stringify(cfg) + ';' +
    'var easeOutCubic=' + easeOutCubic.toString() + ';' +
    'var planTracks=' + planTracks.toString() + ';' +
    'var seekValue=' + seekValue.toString() + ';' +
    'var scanAndBind=' + scanAndBind.toString() + ';' +
    'scanAndBind(CFG,REMOVE,planTracks,seekValue);' +
    '})();'
  );
}
