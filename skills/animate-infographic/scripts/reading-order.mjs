/**
 * Reading-order choreography for animated infographics.
 *
 * WHY THIS EXISTS
 * ---------------
 * The original timeline scheduled by element *kind*: every SVG fill animated,
 * then every stroke, then every text. An element's start time was therefore a
 * function of how many same-tagged elements preceded it in the DOM — a number
 * with no relationship to where it sits on the canvas. Two shapes 900px apart
 * shared a start time; a shape and its own label were always ~1.2s apart. The
 * result reads as random accumulation because nothing travels.
 *
 * This module makes position the scheduling key. `kind` still decides HOW an
 * element animates (draw-on vs fade); it no longer decides WHEN.
 *
 * These functions are PURE and dependency-free so they can be (a) unit-tested in
 * plain Node and (b) serialised via Function.prototype.toString() into the page
 * by inject-timeline.mjs — one implementation, two execution contexts. Keep them
 * free of closures over module scope, or serialisation breaks silently.
 */

export const READING_ORDER_CONFIG = {
  // A band is one visual row. Two targets belong to the same row when their
  // vertical centres are within (median target height x this factor). Using the
  // median makes the threshold adapt to the composition's own scale instead of
  // hardcoding a pixel value that only suits one layout.
  bandToleranceFactor: 1.0,
  // A target joins another target's unit only when this much of its own area
  // lies inside the other. Deliberately strict: the real failure mode is a
  // generously-padded card swallowing the NEIGHBOURING card's label.
  containmentThreshold: 0.9,

  // --- pacing -------------------------------------------------------------
  unitRevealMs: 900,        // how long one reading beat takes to arrive
  connectorRevealMs: 520,   // connectors are transitions, not elements
  // Each unit starts this far into its predecessor's reveal. Must stay < 1 or
  // beats queue instead of overlapping and the build reads as separate events.
  overlapRatio: 0.35,
  maxBuildMs: 4500,         // clarity over speed, but not unbounded

  // Time is allocated by how far the READING HEAD travels down the artboard, not
  // by unit count. A uniform per-unit step silently hands the timeline to whichever
  // region happens to decompose into the most targets: a diagram whose SVG resolves
  // into 14 strokes and polygons spanning 30px took 4.1s, while the 800px of cards
  // below it — 4 units — got 0.95s. The guide then fails its one job, because it
  // dwells where there is little to read and races where there is much.
  //
  // Cost of moving from one beat to the next = minStepMs + advanceMsPerPx x the
  // downward travel. Beats sharing a row cost the minimum, so a left-to-right run
  // (a 3-step diagram, a chip row) still reads as one quick sweep; descending to a
  // new row costs in proportion to the distance the eye actually moves.
  minStepMs: 150,
  advanceMsPerPx: 2.4,

  // --- craft --------------------------------------------------------------
  risePx: 10,               // everything settles upward: the premium convention
  driftPx: 6,               // horizontal drift, in the reading direction
  heroScaleFrom: 0.98,      // the title settles rather than appears
  ease: 'easeOutQuint',     // signature ease for the build
  connectorEase: 'easeInOutSine', // a drawn line must not snap dead at the end
  accentEase: 'easeOutBack',      // sparingly: emphasis only, never body copy
};

/** Pure: median of a numeric array. Returns 0 for an empty array. */
export function median(values) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Pure: targets -> the same targets, sorted into reading order, each carrying
 * `band` (visual row index) and `order` (dense zero-based sequence).
 *
 * Input:  [{ id, rect: {x, y, width, height}, ... }]
 * Output: new objects, sorted. The input array and its members are untouched.
 *
 * Banding rather than a raw y-sort is load-bearing: a card's top edge and its
 * neighbour's text baseline are never at the same y, so a raw sort zigzags
 * between rows. Bands collapse "close enough vertically" into one row, and only
 * then does x decide.
 */
export function assignReadingOrder(targets, cfg = READING_ORDER_CONFIG) {
  if (!targets.length) return [];

  const centred = targets.map((t) => ({
    ...t,
    _cy: t.rect.y + t.rect.height / 2,
  }));
  const tolerance = median(centred.map((t) => t.rect.height)) * cfg.bandToleranceFactor;

  // Greedy banding against each band's FIRST member, not the previous member, so
  // a long run of slightly-descending elements cannot chain into one giant band.
  const byY = centred.slice().sort((a, b) => a._cy - b._cy);
  let band = 0;
  let bandAnchor = byY[0]._cy;
  for (const t of byY) {
    if (t._cy - bandAnchor > tolerance) {
      band++;
      bandAnchor = t._cy;
    }
    t.band = band;
  }

  const sorted = byY.slice().sort((a, b) => (a.band - b.band) || (a.rect.x - b.rect.x));
  return sorted.map((t, i) => {
    const { _cy, ...rest } = t;
    return { ...rest, order: i };
  });
}

/** Pure: fraction of `inner`'s area that lies inside `outer` (0..1). */
export function containmentRatio(inner, outer) {
  const area = inner.width * inner.height;
  if (area <= 0) return 0;
  const ox = Math.max(0, Math.min(inner.x + inner.width, outer.x + outer.width) - Math.max(inner.x, outer.x));
  const oy = Math.max(0, Math.min(inner.y + inner.height, outer.y + outer.height) - Math.max(inner.y, outer.y));
  return (ox * oy) / area;
}

/** Pure: smallest rect containing all of `rects`. */
export function unionRect(rects) {
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  const right = Math.max(...rects.map((r) => r.x + r.width));
  const bottom = Math.max(...rects.map((r) => r.y + r.height));
  return { x, y, width: right - x, height: bottom - y };
}

/**
 * Pure: targets -> reading UNITS (beats). A card, its border and its label are
 * one beat, not three.
 *
 * Grouping is by containment, not mere overlap: a target joins another when
 * >= cfg.containmentThreshold of its own area sits inside the other. Grouping is
 * transitive (card > inner box > label collapses to one unit) via union-find.
 *
 * Output: [{ members: [target], rect: unionRect }] — no order yet. Run
 * assignReadingOrder over the units to sequence them.
 */
export function clusterUnits(targets, cfg = READING_ORDER_CONFIG) {
  if (!targets.length) return [];

  // Union-find gives transitivity for free and is order-independent.
  const parent = targets.map((_, i) => i);
  const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const union = (a, b) => { const ra = find(a); const rb = find(b); if (ra !== rb) parent[rb] = ra; };

  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const a = targets[i].rect;
      const b = targets[j].rect;
      if (containmentRatio(a, b) >= cfg.containmentThreshold ||
          containmentRatio(b, a) >= cfg.containmentThreshold) {
        union(i, j);
      }
    }
  }

  const groups = new Map();
  targets.forEach((t, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(t);
  });

  return Array.from(groups.values()).map((members) => ({
    members,
    rect: unionRect(members.map((m) => m.rect)),
  }));
}

/**
 * Pure: ordered units -> units carrying start/end times and entrance craft.
 *
 * Pacing is a fixed overlap RATIO rather than a fixed stagger, which is what
 * removes dead air by construction: every beat begins partway into its
 * predecessor's reveal, so there is never a frame with nothing moving. If the
 * build would exceed cfg.maxBuildMs the whole sequence is compressed uniformly
 * — relative rhythm is preserved, only the tempo changes.
 *
 * Entrance direction encodes the reading path: everything settles upward, and
 * anything the eye reaches by moving RIGHT also drifts in from the left. The
 * first unit of each band arrives after a downward eye movement, so it gets a
 * pure rise with no horizontal component.
 */
export function planUnitTimeline(units, cfg = READING_ORDER_CONFIG) {
  if (!units.length) return [];

  const step = cfg.unitRevealMs * cfg.overlapRatio;
  const firstOfBand = new Set();
  const seenBands = new Set();
  for (const u of units) {
    if (!seenBands.has(u.band)) { seenBands.add(u.band); firstOfBand.add(u); }
  }

  // The hero is the LARGEST TYPE, not the first beat. A composition that opens
  // with an eyebrow pill above the headline would otherwise hand the hero
  // treatment to the pill and leave the headline with none. Falls back to the
  // first beat when no type information was captured.
  let heroIdx = 0;
  let heroFont = -1;
  units.forEach((u, i) => {
    const f = Math.max(...u.members.map((m) => m.maxFontPx || 0), 0);
    if (f > heroFont) { heroFont = f; heroIdx = i; }
  });
  if (!(heroFont > 0)) heroIdx = 0;

  // Start times accumulate travel cost rather than a fixed step, so the build's
  // tempo tracks the reader's eye down the page. `step` remains the fallback for
  // callers that pass a cfg predating minStepMs/advanceMsPerPx.
  const minStep = cfg.minStepMs >= 0 ? cfg.minStepMs : step;
  const perPx = cfg.advanceMsPerPx >= 0 ? cfg.advanceMsPerPx : 0;
  const centreY = (u) => u.rect.y + u.rect.height / 2;
  const starts = [];
  for (let i = 0; i < units.length; i++) {
    if (i === 0) { starts.push(0); continue; }
    const drop = Math.max(0, centreY(units[i]) - centreY(units[i - 1]));
    starts.push(starts[i - 1] + minStep + perPx * drop);
  }

  let planned = units.map((u, i) => {
    const reveal = u.isConnector ? cfg.connectorRevealMs : cfg.unitRevealMs;
    const startMs = starts[i];
    const isHero = i === heroIdx;
    return {
      ...u,
      startMs,
      endMs: startMs + reveal,
      ease: u.isConnector ? cfg.connectorEase : (u.isAccent ? cfg.accentEase : cfg.ease),
      enterDy: cfg.risePx,
      enterDx: firstOfBand.has(u) ? 0 : -cfg.driftPx,
      isHero,
      scaleFrom: isHero ? cfg.heroScaleFrom : 1,
    };
  });

  const lastEnd = Math.max(...planned.map((u) => u.endMs));
  if (lastEnd > cfg.maxBuildMs) {
    const k = cfg.maxBuildMs / lastEnd;
    planned = planned.map((u) => ({ ...u, startMs: u.startMs * k, endMs: u.endMs * k }));
  }
  return planned;
}
