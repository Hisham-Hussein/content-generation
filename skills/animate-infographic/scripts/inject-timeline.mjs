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

import {
  READING_ORDER_CONFIG,
  median,
  containmentRatio,
  unionRect,
  assignReadingOrder,
  clusterUnits,
  planUnitTimeline,
} from './reading-order.mjs';
import { ORB_CONFIG, orbWaypoints, orbStateAt, pointAt, orbAlpha, smoothstep } from './orb.mjs';

export const REMOVE = '__ANIM_REMOVE__';

export const TIMELINE_CONFIG = {
  ...READING_ORDER_CONFIG,
  ...ORB_CONFIG,

  // Pacing. 4500 was too tight: post 61 produces 25 beats, which want ~7.9s at
  // the 0.35 overlap ratio, so the whole sequence was being compressed 0.51x —
  // every reveal ran at half its designed duration. That, not the easing, is
  // what read as "too fast". Clarity over speed.
  maxBuildMs: 7500,

  // Frame 0 is composed-but-dimmed, never blank — and the floor is HIERARCHICAL.
  // Structural scaffolding (rules, outlines, footer chrome) starts nearly
  // present; content arrives INTO that frame. A single flat floor made frame 0
  // read as a washed-out copy of the whole composition instead of an empty
  // stage waiting to be filled. Matters more now the output is a looping GIF,
  // where frame 0 is also the still preview.
  // 0.08 was tried and rejected on inspection: the artboard read as an empty
  // page for the first ~15 frames, throwing away the opening moment. At 0.16 the
  // ARCHITECTURE stays legible (you can see there are five rows in two columns)
  // while the content still visibly arrives. Chrome sits ~2x higher again.
  dimFactorContent: 0.16,
  dimFactorChrome: 0.35,

  // Within one reading beat, a label lands just behind the shape that holds it.
  // Small enough to read as one event, large enough to feel crafted.
  intraUnitOffsetMs: 80,

  // A shape this thin in either axis is a hairline rule or divider, i.e. chrome.
  chromeThinPx: 4,

  // Ignore decorative slivers when walking for HTML content boxes.
  minTargetAreaPx: 300,

  // Trailing freeze on the full composition. Longer than the old 1s because the
  // GIF loops forever: the eye needs to rest on the finished artboard before the
  // restart, or the loop reads as a stutter.
  holdMs: 1400,
};

export function easeOutCubic(p) {
  const c = p < 0 ? 0 : p > 1 ? 1 : p;
  return 1 - Math.pow(1 - c, 3);
}

/** Signature build ease: fast departure, long settle — reads as *arrived*. */
export function easeOutQuint(p) {
  const c = p < 0 ? 0 : p > 1 ? 1 : p;
  return 1 - Math.pow(1 - c, 5);
}

/** For drawn lines: no dead stop at the end of the stroke. */
export function easeInOutSine(p) {
  const c = p < 0 ? 0 : p > 1 ? 1 : p;
  return -(Math.cos(Math.PI * c) - 1) / 2;
}

/** Emphasis only. Slight overshoot. Never on body copy. */
export function easeOutBack(p) {
  const c = p < 0 ? 0 : p > 1 ? 1 : p;
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(c - 1, 3) + c1 * Math.pow(c - 1, 2);
}

export const EASES = { easeOutCubic, easeOutQuint, easeInOutSine, easeOutBack };

/**
 * Pure: target descriptors -> animation tracks.
 * target: { id, kind: 'block'|'fill'|'stroke'|'text'|'accent', index, count,
 *           naturalOpacity, strokeLength?, hasExistingDash? }
 * track:  { id, prop: 'opacity'|'transform'|'strokeDashoffset',
 *           from, to, startMs, endMs, [fromPx,toPx,axis] | [dashLen] }
 */
/**
 * Pure: targets -> timed reading units. Exposed separately from planTracks
 * because the guide orb must travel the EXACT sequence the tracks animate —
 * deriving the path twice would let the two drift apart.
 */
export function planUnits(targets, cfg) {
  if (!targets.length) return [];

  // Position decides WHEN. `kind` decides only HOW.
  const units = clusterUnits(targets, cfg).map((u) => ({
    ...u,
    // A unit of pure drawable strokes IS a connector — an arrow between two
    // cards, not an element in its own right. Banding already placed it between
    // the cards it joins (it physically sits there); all it needs from us is a
    // shorter reveal and its own ease so it reads as a transition.
    isConnector: u.members.every(
      (m) => m.kind === 'stroke' && !m.hasExistingDash && m.strokeLength > 0,
    ),
    isAccent: u.members.some((m) => m.kind === 'accent'),
  }));
  return planUnitTimeline(assignReadingOrder(units, cfg), cfg);
}

/** Pure: timed reading units -> animation tracks. */
export function tracksFromUnits(timed, cfg) {
  const tracks = [];
  for (const unit of timed) {
    for (const t of unit.members) {
      const isLabel = t.kind === 'text' || t.kind === 'accent';
      const offset = isLabel ? cfg.intraUnitOffsetMs : 0;
      const startMs = unit.startMs + offset;
      const endMs = unit.endMs + offset;

      const nat = typeof t.naturalOpacity === 'number' ? t.naturalOpacity : 1;
      const dim = (t.isChrome ? cfg.dimFactorChrome : cfg.dimFactorContent) * nat;
      const ease = t.kind === 'accent' ? cfg.accentEase : unit.ease;

      // Draw-on where the geometry supports it; an intentional dash pattern is
      // never hijacked for draw-on.
      if (t.kind === 'stroke' && !t.hasExistingDash && t.strokeLength > 0) {
        tracks.push({
          id: t.id, prop: 'strokeDashoffset',
          from: t.strokeLength, to: 0, dashLen: t.strokeLength,
          startMs, endMs, ease: cfg.connectorEase,
        });
        continue;
      }

      tracks.push({ id: t.id, prop: 'opacity', from: dim, to: nat, startMs, endMs, ease });

      // Entrance travel. `from`/`to` carry eased PROGRESS 0->1; the offsets ride
      // on it, so one track drives translate and scale together without three
      // tracks fighting over el.style.transform.
      const fromScale = unit.isHero ? unit.scaleFrom : 1;
      if (unit.enterDx || unit.enterDy || fromScale !== 1) {
        tracks.push({
          id: t.id, prop: 'transform', from: 0, to: 1, startMs, endMs, ease,
          fromX: unit.enterDx, fromY: unit.enterDy, fromScale,
        });
      }
    }
  }
  return tracks;
}

/** Pure: targets -> tracks. The composition of planUnits + tracksFromUnits. */
export function planTracks(targets, cfg) {
  if (!targets.length) return [];
  return tracksFromUnits(planUnits(targets, cfg), cfg);
}

/** Pure: value of a track at time t. REMOVE means "drop the inline override". */
export function seekValue(track, t) {
  if (t >= track.endMs) return REMOVE;
  if (t <= track.startMs) return track.from;
  const p = (t - track.startMs) / (track.endMs - track.startMs);
  const fn = EASES[track.ease] || easeOutCubic;
  const e = fn(p);
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
function scanAndBind(CFG, REMOVE, planUnits, tracksFromUnits, seekValue, orbWaypoints, orbStateAt) {
  const root = document.querySelector('.infographic');
  if (!root) { window.__animError = 'no .infographic root'; return; }

  // Kill any CSS-driven motion — every value is set imperatively by __seek.
  const killer = document.createElement('style');
  killer.textContent = '.infographic *{transition:none !important;animation:none !important}';
  document.head.appendChild(killer);

  // Geometry is the scheduling key, so it is captured per target here. This runs
  // AFTER waitForLayoutStable, so getBoundingClientRect reflects settled layout
  // (including the static getBBox auto-sizing pass).
  const rootRect = root.getBoundingClientRect();

  const targets = [];
  const idToEl = {};
  let n = 0;
  const add = (el, kind, extra) => {
    const id = 'a' + (n++);
    idToEl[id] = el;
    let naturalOpacity = 1;
    try { naturalOpacity = parseFloat(getComputedStyle(el).opacity); } catch (e) {}
    if (!(naturalOpacity >= 0)) naturalOpacity = 1;
    let rect = { x: 0, y: 0, width: 0, height: 0 };
    try {
      const r = el.getBoundingClientRect();
      rect = { x: r.x - rootRect.x, y: r.y - rootRect.y, width: r.width, height: r.height };
    } catch (e) {}
    // Largest type anywhere in this element's subtree — a container inherits a
    // body font-size, so its own computed value says nothing about whether it
    // holds the headline. This is what identifies the hero.
    let maxFontPx = 0;
    try {
      maxFontPx = parseFloat(getComputedStyle(el).fontSize) || 0;
      const kids = el.querySelectorAll('*');
      for (let i = 0; i < kids.length; i++) {
        const f = parseFloat(getComputedStyle(kids[i]).fontSize) || 0;
        if (f > maxFontPx) maxFontPx = f;
      }
    } catch (e) {}
    targets.push(Object.assign({ id, kind, naturalOpacity, rect, maxFontPx }, extra || {}));
    return id;
  };

  // Structural scaffolding gets a higher dim floor: hairline rules/dividers, and
  // outlines (stroked shapes with no fill). These frame the composition rather
  // than carrying its content, so they should already be present at frame 0.
  const isChromeRect = (rect) => Math.min(rect.width, rect.height) <= CFG.chromeThinPx;

  // 1) HTML content blocks (skip any block that wraps an SVG — its interior is
  //    animated part-by-part instead, avoiding double-dimming).
  // Walk down and bind the OUTERMOST atomic content box. "Atomic" = contains no
  // <svg>, so fading it fades its whole subtree as one beat.
  //
  // The original scan took `[data-content-block]` and skipped any block
  // containing an <svg>, meaning to animate that block's interior part-by-part.
  // But it only ever descended to SVG interiors — so on a layout like
  //   .seam[data-content-block] > .row > (.hole, .cross>svg, .fix)
  // the ten HTML cards were never bound at all and sat at full opacity from
  // frame 0. Descending through SVG-wrapping containers is what fixes that.
  // validate-motion-coverage.mjs is the permanent gate against a regression.
  const blocks = [];
  const walk = (el) => {
    const kids = Array.prototype.slice.call(el.children);
    for (let i = 0; i < kids.length; i++) {
      const child = kids[i];
      if (child.tagName.toLowerCase() === 'svg') continue; // the SVG pass owns these
      if (child.querySelector('svg')) { walk(child); continue; }
      let r;
      try { r = child.getBoundingClientRect(); } catch (e) { continue; }
      if (r.width * r.height < CFG.minTargetAreaPx) continue;
      blocks.push(child);
      add(child, 'block');
      const t = targets[targets.length - 1];
      if (isChromeRect(t.rect)) t.isChrome = true;
    }
  };
  walk(root);

  // 2) SVG interior parts. `kind` now selects only the MOTION each part gets;
  //    its place in the sequence comes from its position on the artboard.
  const svgs = Array.prototype.slice.call(root.querySelectorAll('svg'));
  svgs.forEach((svg) => {
    const kids = Array.prototype.slice.call(
      svg.querySelectorAll('polygon, rect, circle, ellipse, line, polyline, path, text')
    );
    kids.forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'text') {
        add(el, el.hasAttribute('data-accent') ? 'accent' : 'text');
        return;
      }
      let stroke = '';
      try { stroke = getComputedStyle(el).stroke; } catch (e) {}
      const hasStroke = stroke && stroke !== 'none' && el.getAttribute('stroke') !== 'none' && el.getAttribute('stroke');
      const fill = el.getAttribute('fill');
      if (hasStroke) {
        let len = 0; try { len = el.getTotalLength ? el.getTotalLength() : 0; } catch (e) {}
        add(el, 'stroke', {
          strokeLength: len,
          hasExistingDash: !!el.getAttribute('stroke-dasharray'),
        });
        // An outline (stroke, no fill) frames content rather than being content.
        const t = targets[targets.length - 1];
        if (fill === 'none' || isChromeRect(t.rect)) t.isChrome = true;
      } else {
        if (fill === 'none') return;
        add(el, 'fill');
        const t = targets[targets.length - 1];
        if (isChromeRect(t.rect)) t.isChrome = true;
      }
    });
  });

  const units = planUnits(targets, CFG);
  const tracks = tracksFromUnits(units, CFG);

  // ---------------------------------------------------------------------
  // Guide orb. Travels the SAME unit sequence the tracks animate, arriving
  // just ahead of each beat. Lives on <body>, positioned in viewport
  // coordinates, so it cannot perturb the artboard's layout at all.
  // ---------------------------------------------------------------------
  const waypoints = orbWaypoints(units, CFG).map((w) => ({
    x: w.x + rootRect.x, y: w.y + rootRect.y, tMs: w.tMs,
  }));

  // Accent colour is read from the composition rather than hardcoded, so the orb
  // is always in the tenant's brand palette: the most saturated text colour on
  // the artboard. Falls back to a neutral if the design is fully monochrome.
  const accent = (function () {
    let best = null; let bestChroma = 0;
    const els = Array.prototype.slice.call(root.querySelectorAll('*'));
    for (let i = 0; i < els.length; i++) {
      let c = '';
      try { c = getComputedStyle(els[i]).color; } catch (e) { continue; }
      const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || '');
      if (!m) continue;
      const r = +m[1], g = +m[2], b = +m[3];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const chroma = mx - mn;
      if (chroma > bestChroma && mx > 60) { bestChroma = chroma; best = [r, g, b]; }
    }
    return best && bestChroma > 30 ? best : [120, 120, 130];
  })();
  const rgba = (a) => 'rgba(' + accent[0] + ',' + accent[1] + ',' + accent[2] + ',' + a + ')';

  const orbLayer = document.createElement('div');
  orbLayer.setAttribute('data-anim-orb', '');
  orbLayer.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2147483647;';
  const mkDot = (size, css) => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;border-radius:50%;pointer-events:none;will-change:transform;' +
      'width:' + size + 'px;height:' + size + 'px;margin-left:' + (-size / 2) + 'px;margin-top:' + (-size / 2) + 'px;' + css;
    orbLayer.appendChild(d);
    return d;
  };
  // Halo first (behind), then trail oldest-to-newest, then the core on top.
  const A = (base) => rgba(orbAlpha(base, CFG));
  const halo = mkDot(CFG.haloRadiusPx * 2,
    'background:radial-gradient(circle,' + A(CFG.haloInnerAlpha) + ' 0%,' + A(CFG.haloMidAlpha) + ' 42%,' + rgba(0) + ' 70%);');
  const trailDots = [];
  for (let i = CFG.trailCount - 1; i >= 0; i--) {
    trailDots[i] = mkDot(CFG.coreRadiusPx * 2, 'background:' + A(CFG.trailAlpha) + ';');
  }
  const core = mkDot(CFG.coreRadiusPx * 2,
    'background:' + A(CFG.coreAlpha) + ';box-shadow:0 0 11px 3px ' + A(CFG.coreGlowAlpha) + ';');
  document.body.appendChild(orbLayer);

  const placeOrb = (t) => {
    const s = orbStateAt(t, waypoints, CFG);
    if (s.opacity <= 0) { orbLayer.style.display = 'none'; return; }
    orbLayer.style.display = '';
    core.style.transform = 'translate(' + s.x + 'px,' + s.y + 'px)';
    core.style.opacity = String(s.opacity);
    halo.style.transform = 'translate(' + s.x + 'px,' + s.y + 'px)';
    halo.style.opacity = String(s.opacity);
    for (let i = 0; i < trailDots.length; i++) {
      const tr = s.trail[i];
      trailDots[i].style.transform = 'translate(' + tr.x + 'px,' + tr.y + 'px) scale(' + tr.scale + ')';
      trailDots[i].style.opacity = String(tr.opacity);
    }
  };
  window.__animDebug = { root: !!root, blocks: blocks.length, svgs: svgs.length, targets: targets.length, tracks: tracks.length };
  // Exposed for validate-motion-coverage.mjs: which elements the layer actually
  // bound. Without this there is no way to tell an animated composition from a
  // mostly-static one that merely encoded successfully.
  window.__animElements = targets.map((t) => idToEl[t.id]);
  const lastEnd = tracks.length ? Math.max.apply(null, tracks.map((t) => t.endMs)) : 0;
  // capture window ends at lastEnd (the fully-built static composition); the
  // trailing hold is cloned by ffmpeg, NOT re-screenshotted.
  window.__animLastEndMs = lastEnd;
  window.__animHoldMs = CFG.holdMs;
  window.__animTotalMs = lastEnd + CFG.holdMs;

  window.__seek = function (t) {
    placeOrb(t);
    for (let i = 0; i < tracks.length; i++) {
      const tr = tracks[i];
      const el = idToEl[tr.id];
      if (!el) continue;
      const v = seekValue(tr, t);
      if (v === REMOVE) {
        if (tr.prop === 'opacity') el.style.removeProperty('opacity');
        else if (tr.prop === 'transform') {
          el.style.removeProperty('transform');
          el.style.removeProperty('transform-box');
          el.style.removeProperty('transform-origin');
        }
        else if (tr.prop === 'strokeDashoffset') {
          el.style.removeProperty('stroke-dashoffset');
          el.style.removeProperty('stroke-dasharray');
        }
      } else if (tr.prop === 'opacity') {
        el.style.opacity = String(v);
      } else if (tr.prop === 'transform') {
        // v is eased progress 0->1. Offsets decay to zero and scale rises to 1,
        // so one track drives translate + scale without three tracks fighting
        // over el.style.transform.
        var inv = 1 - v;
        var tx = (tr.fromX || 0) * inv;
        var ty = (tr.fromY || 0) * inv;
        var sc = (tr.fromScale || 1) + (1 - (tr.fromScale || 1)) * v;
        if (sc !== 1) {
          // Without an explicit box/origin, scaling an SVG child resolves
          // against the viewport and throws the element across the artboard.
          el.style.transformBox = 'fill-box';
          el.style.transformOrigin = 'center';
        }
        el.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + sc + ')';
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
  // Every module-level identifier that the serialised functions reference must
  // be declared here as a var, or it resolves to undefined INSIDE the page while
  // still passing every Node-side unit test. That is the silent-failure mode
  // this file's header warns about: the transitive deps (median,
  // containmentRatio, unionRect, the ease functions, EASES) are not optional.
  return (
    '(function(){' +
    'var REMOVE=' + JSON.stringify(REMOVE) + ';' +
    'var CFG=' + JSON.stringify(cfg) + ';' +
    // The pure functions carry `cfg = READING_ORDER_CONFIG` default params.
    // Every call site passes cfg explicitly today, so the default is never
    // evaluated — but if one ever stops, this is the difference between working
    // and a ReferenceError that only reproduces inside the browser.
    'var READING_ORDER_CONFIG=CFG;' +
    'var easeOutCubic=' + easeOutCubic.toString() + ';' +
    'var easeOutQuint=' + easeOutQuint.toString() + ';' +
    'var easeInOutSine=' + easeInOutSine.toString() + ';' +
    'var easeOutBack=' + easeOutBack.toString() + ';' +
    'var EASES={easeOutCubic:easeOutCubic,easeOutQuint:easeOutQuint,' +
    'easeInOutSine:easeInOutSine,easeOutBack:easeOutBack};' +
    'var median=' + median.toString() + ';' +
    'var containmentRatio=' + containmentRatio.toString() + ';' +
    'var unionRect=' + unionRect.toString() + ';' +
    'var assignReadingOrder=' + assignReadingOrder.toString() + ';' +
    'var clusterUnits=' + clusterUnits.toString() + ';' +
    'var planUnitTimeline=' + planUnitTimeline.toString() + ';' +
    'var planUnits=' + planUnits.toString() + ';' +
    'var tracksFromUnits=' + tracksFromUnits.toString() + ';' +
    'var smoothstep=' + smoothstep.toString() + ';' +
    'var pointAt=' + pointAt.toString() + ';' +
    'var orbAlpha=' + orbAlpha.toString() + ';' +
    'var orbWaypoints=' + orbWaypoints.toString() + ';' +
    'var orbStateAt=' + orbStateAt.toString() + ';' +
    'var ORB_CONFIG=CFG;' +
    'var seekValue=' + seekValue.toString() + ';' +
    'var scanAndBind=' + scanAndBind.toString() + ';' +
    'scanAndBind(CFG,REMOVE,planUnits,tracksFromUnits,seekValue,orbWaypoints,orbStateAt);' +
    '})();'
  );
}
