import test from 'node:test';
import assert from 'node:assert/strict';

import { READING_ORDER_CONFIG } from './reading-order.mjs';
import {
  TIMELINE_CONFIG,
  REMOVE,
  easeOutCubic,
  planTracks,
  seekValue,
  timelineTotalMs,
} from './inject-timeline.mjs';

// ---------------------------------------------------------------------------
// easing
// ---------------------------------------------------------------------------
test('easeOutCubic is pinned at 0 and 1 and monotonic', () => {
  assert.equal(easeOutCubic(0), 0);
  assert.equal(easeOutCubic(1), 1);
  let prev = -Infinity;
  for (let p = 0; p <= 1.0001; p += 0.1) {
    const v = easeOutCubic(Math.min(p, 1));
    assert.ok(v >= prev, `monotonic at p=${p}`);
    prev = v;
  }
});

// ---------------------------------------------------------------------------
// planTracks: a content block yields an opacity track (dim -> natural) and a
// transform (rise) track, both inside the same staggered window.
// ---------------------------------------------------------------------------
/** Target helper: position is now the scheduling key, so every target needs one. */
function tgt(id, kind, x, y, w, h, extra) {
  return { id, kind, rect: { x, y, width: w, height: h }, naturalOpacity: 1, ...extra };
}
const startOf = (tracks, id) => tracks.find((t) => t.id === id && t.prop === 'opacity').startMs;

test('planTracks: position decides WHEN, not element kind', () => {
  // THE regression test. Old behaviour scheduled every fill at 800ms and every
  // text at 2000ms, so a fill at the bottom of the page animated 1.2s BEFORE a
  // heading at the top. Reading order must beat tag name.
  const tracks = planTracks([
    tgt('bottom-fill', 'fill', 100, 1000, 800, 200),
    tgt('top-text', 'text', 100, 100, 800, 80),
  ], TIMELINE_CONFIG);
  assert.ok(startOf(tracks, 'top-text') < startOf(tracks, 'bottom-fill'),
    'the heading at the top must animate before the shape at the bottom');
});

test('planTracks: a shape and the label inside it share one beat', () => {
  // Old behaviour put a card and its own label ~1.2s apart, in different groups.
  const tracks = planTracks([
    tgt('card', 'fill', 100, 100, 400, 200),
    tgt('label', 'text', 120, 150, 200, 40),
  ], TIMELINE_CONFIG);
  const gap = Math.abs(startOf(tracks, 'label') - startOf(tracks, 'card'));
  assert.ok(gap <= TIMELINE_CONFIG.intraUnitOffsetMs,
    `card and its label are one beat (gap ${gap}ms)`);
});

test('planTracks: produces dim->natural opacity + a compound entrance transform', () => {
  const tracks = planTracks([tgt('b0', 'block', 100, 100, 800, 200)], TIMELINE_CONFIG);
  const op = tracks.find((t) => t.id === 'b0' && t.prop === 'opacity');
  const tr = tracks.find((t) => t.id === 'b0' && t.prop === 'transform');
  assert.ok(op && tr, 'both tracks exist');
  assert.equal(op.from, TIMELINE_CONFIG.dimFactorContent);
  assert.equal(op.to, 1);
  assert.ok(op.endMs > op.startMs);
  // The transform interpolates eased progress 0->1; the offsets ride on it.
  assert.equal(tr.from, 0);
  assert.equal(tr.to, 1);
  assert.equal(tr.fromY, TIMELINE_CONFIG.risePx);
});

test('planTracks: chrome starts nearer to visible than content does', () => {
  // Structural scaffolding should already be there; content arrives INTO it.
  const tracks = planTracks([
    tgt('rule', 'fill', 100, 100, 800, 2, { isChrome: true }),
    tgt('body', 'fill', 100, 300, 800, 200),
  ], TIMELINE_CONFIG);
  const from = (id) => tracks.find((t) => t.id === id && t.prop === 'opacity').from;
  assert.equal(from('rule'), TIMELINE_CONFIG.dimFactorChrome);
  assert.equal(from('body'), TIMELINE_CONFIG.dimFactorContent);
  assert.ok(from('rule') > from('body'));
});

test('planTracks: natural opacity below 1 scales the dim floor proportionally', () => {
  const tracks = planTracks([tgt('f', 'fill', 100, 100, 400, 200, { naturalOpacity: 0.1 })], TIMELINE_CONFIG);
  const op = tracks.find((t) => t.prop === 'opacity');
  assert.ok(Math.abs(op.from - TIMELINE_CONFIG.dimFactorContent * 0.1) < 1e-9);
  assert.equal(op.to, 0.1);
});

test('planTracks: the first beat is the hero and settles from a sub-1 scale', () => {
  const tracks = planTracks([
    tgt('title', 'text', 100, 100, 800, 120),
    tgt('later', 'fill', 100, 600, 800, 200),
  ], TIMELINE_CONFIG);
  const tr = (id) => tracks.find((t) => t.id === id && t.prop === 'transform');
  assert.equal(tr('title').fromScale, TIMELINE_CONFIG.heroScaleFrom);
  assert.equal(tr('later').fromScale, 1);
});

test('planTracks: stroke target draws on via strokeDashoffset length -> 0', () => {
  const tracks = planTracks([
    tgt('s', 'stroke', 100, 100, 300, 8, { strokeLength: 240, hasExistingDash: false }),
  ], TIMELINE_CONFIG);
  const dash = tracks.find((t) => t.prop === 'strokeDashoffset');
  assert.ok(dash, 'strokeDashoffset track exists');
  assert.equal(dash.from, 240);
  assert.equal(dash.to, 0);
});

test('planTracks: stroke with an existing dash pattern is faded, not drawn-on', () => {
  const tracks = planTracks([
    tgt('d', 'stroke', 100, 100, 300, 8, { naturalOpacity: 0.55, strokeLength: 800, hasExistingDash: true }),
  ], TIMELINE_CONFIG).filter((t) => t.id === 'd');
  assert.ok(!tracks.some((t) => t.prop === 'strokeDashoffset'), 'no draw-on for intentional dash');
  assert.ok(tracks.some((t) => t.prop === 'opacity'), 'falls back to opacity fade');
});

test('planTracks: a drawn-on connector uses the connector ease', () => {
  const tracks = planTracks([
    tgt('arrow', 'stroke', 100, 100, 300, 8, { strokeLength: 300, hasExistingDash: false }),
  ], TIMELINE_CONFIG);
  const dash = tracks.find((t) => t.prop === 'strokeDashoffset');
  assert.equal(dash.ease, READING_ORDER_CONFIG.connectorEase);
});

test('planTracks: every track carries a named ease', () => {
  const tracks = planTracks([
    tgt('a', 'fill', 100, 100, 400, 200),
    tgt('b', 'text', 600, 100, 300, 40),
  ], TIMELINE_CONFIG);
  for (const t of tracks) assert.ok(typeof t.ease === 'string' && t.ease, `${t.id}/${t.prop} has an ease`);
});

// ---------------------------------------------------------------------------
// seekValue: frame-0 = dimmed (from); end = REMOVE (restore natural).
// ---------------------------------------------------------------------------
test('seekValue: at/below start returns the dimmed `from` value', () => {
  const [op] = planTracks(
    [tgt('b', 'block', 100, 100, 800, 200)],
    TIMELINE_CONFIG,
  ).filter((t) => t.prop === 'opacity');
  assert.equal(seekValue(op, 0), op.from);
  assert.equal(seekValue(op, op.startMs), op.from);
});

test('seekValue: at or beyond end returns REMOVE sentinel (restore static state)', () => {
  const [op] = planTracks(
    [tgt('b', 'block', 100, 100, 800, 200)],
    TIMELINE_CONFIG,
  ).filter((t) => t.prop === 'opacity');
  assert.equal(seekValue(op, op.endMs), REMOVE);
  assert.equal(seekValue(op, op.endMs + 5000), REMOVE);
});

test('seekValue: monotonic increase across the reveal window for opacity', () => {
  const [op] = planTracks(
    [tgt('b', 'block', 100, 100, 800, 200)],
    TIMELINE_CONFIG,
  ).filter((t) => t.prop === 'opacity');
  let prev = -Infinity;
  for (let t = op.startMs; t < op.endMs; t += (op.endMs - op.startMs) / 10) {
    const v = seekValue(op, t);
    assert.notEqual(v, REMOVE);
    assert.ok(v >= prev, `opacity monotonic at t=${t}`);
    prev = v;
  }
});

test('seekValue: strokeDashoffset interpolates length -> 0', () => {
  const [dash] = planTracks(
    [tgt('s', 'stroke', 100, 100, 300, 8, { strokeLength: 100, hasExistingDash: false })],
    TIMELINE_CONFIG,
  ).filter((t) => t.prop === 'strokeDashoffset');
  assert.equal(seekValue(dash, dash.startMs), 100);
  const mid = seekValue(dash, (dash.startMs + dash.endMs) / 2);
  assert.ok(mid < 100 && mid > 0, 'mid draw is partial');
  assert.equal(seekValue(dash, dash.endMs), REMOVE);
});

test('seekValue: deterministic — identical t yields identical value', () => {
  const [op] = planTracks(
    [tgt('b', 'block', 100, 100, 800, 200)],
    TIMELINE_CONFIG,
  ).filter((t) => t.prop === 'opacity');
  const t = (op.startMs + op.endMs) / 2;
  assert.equal(seekValue(op, t), seekValue(op, t));
});

// ---------------------------------------------------------------------------
// total duration includes the final-frame hold.
// ---------------------------------------------------------------------------
test('timelineTotalMs = last track end + hold', () => {
  const targets = [
    tgt('b0', 'block', 100, 100, 800, 200),
    tgt('b3', 'block', 100, 900, 800, 200),
    tgt('a', 'accent', 100, 1300, 400, 60),
  ];
  const tracks = planTracks(targets, TIMELINE_CONFIG);
  const lastEnd = Math.max(...tracks.map((t) => t.endMs));
  assert.equal(timelineTotalMs(tracks, TIMELINE_CONFIG), lastEnd + TIMELINE_CONFIG.holdMs);
});

// ---------------------------------------------------------------------------
// cross-skill dependency smoke: the sibling validators we import at runtime
// must keep their named exports. Cheap insurance for the intra-plugin coupling.
// ---------------------------------------------------------------------------
test('import-smoke: sibling validators expose the expected named exports', async () => {
  const postRender = await import(
    '../../generate-infographic/scripts/validate-post-render.mjs'
  );
  const mobile = await import(
    '../../generate-infographic/scripts/validate-mobile-linkedin-infographic.mjs'
  );
  assert.equal(typeof postRender.validatePostRenderOnPage, 'function');
  assert.equal(typeof mobile.validateInfographicFile, 'function');
  assert.equal(typeof mobile.validateInfographicHtml, 'function');
});
