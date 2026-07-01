import test from 'node:test';
import assert from 'node:assert/strict';

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
test('planTracks: block target produces dim->natural opacity + rise transform', () => {
  const targets = [
    { id: 'b0', kind: 'block', index: 0, count: 4, naturalOpacity: 1 },
  ];
  const tracks = planTracks(targets, TIMELINE_CONFIG);
  const op = tracks.find((t) => t.id === 'b0' && t.prop === 'opacity');
  const tr = tracks.find((t) => t.id === 'b0' && t.prop === 'transform');
  assert.ok(op, 'opacity track exists');
  assert.ok(tr, 'transform track exists');
  assert.equal(op.from, TIMELINE_CONFIG.dimFactor); // 0.15 * naturalOpacity(1)
  assert.equal(op.to, 1);
  assert.equal(op.startMs, 0); // index 0
  assert.ok(op.endMs > op.startMs);
  assert.equal(tr.fromPx, TIMELINE_CONFIG.blockRisePx);
  assert.equal(tr.toPx, 0);
});

test('planTracks: block natural opacity below 1 scales the dim floor proportionally', () => {
  const targets = [{ id: 'f', kind: 'fill', index: 0, count: 3, naturalOpacity: 0.1 }];
  const [op] = planTracks(targets, TIMELINE_CONFIG).filter((t) => t.prop === 'opacity');
  assert.ok(Math.abs(op.from - 0.15 * 0.1) < 1e-9, 'dim floor is 0.15 * natural');
  assert.equal(op.to, 0.1);
});

test('planTracks: stroke target draws on via strokeDashoffset length -> 0', () => {
  const targets = [
    { id: 's', kind: 'stroke', index: 0, count: 2, naturalOpacity: 1, strokeLength: 240, hasExistingDash: false },
  ];
  const tracks = planTracks(targets, TIMELINE_CONFIG);
  const dash = tracks.find((t) => t.prop === 'strokeDashoffset');
  assert.ok(dash, 'strokeDashoffset track exists');
  assert.equal(dash.from, 240);
  assert.equal(dash.to, 0);
});

test('planTracks: stroke with an existing dash pattern is faded, not drawn-on', () => {
  const targets = [
    { id: 'd', kind: 'stroke', index: 0, count: 1, naturalOpacity: 0.55, strokeLength: 800, hasExistingDash: true },
  ];
  const tracks = planTracks(targets, TIMELINE_CONFIG).filter((t) => t.id === 'd');
  assert.ok(!tracks.some((t) => t.prop === 'strokeDashoffset'), 'no draw-on for intentional dash');
  assert.ok(tracks.some((t) => t.prop === 'opacity'), 'falls back to opacity fade');
});

// ---------------------------------------------------------------------------
// seekValue: frame-0 = dimmed (from); end = REMOVE (restore natural).
// ---------------------------------------------------------------------------
test('seekValue: at/below start returns the dimmed `from` value', () => {
  const [op] = planTracks(
    [{ id: 'b', kind: 'block', index: 2, count: 4, naturalOpacity: 1 }],
    TIMELINE_CONFIG,
  ).filter((t) => t.prop === 'opacity');
  assert.equal(seekValue(op, 0), op.from);
  assert.equal(seekValue(op, op.startMs), op.from);
});

test('seekValue: at or beyond end returns REMOVE sentinel (restore static state)', () => {
  const [op] = planTracks(
    [{ id: 'b', kind: 'block', index: 0, count: 4, naturalOpacity: 1 }],
    TIMELINE_CONFIG,
  ).filter((t) => t.prop === 'opacity');
  assert.equal(seekValue(op, op.endMs), REMOVE);
  assert.equal(seekValue(op, op.endMs + 5000), REMOVE);
});

test('seekValue: monotonic increase across the reveal window for opacity', () => {
  const [op] = planTracks(
    [{ id: 'b', kind: 'block', index: 0, count: 4, naturalOpacity: 1 }],
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
    [{ id: 's', kind: 'stroke', index: 0, count: 1, naturalOpacity: 1, strokeLength: 100, hasExistingDash: false }],
    TIMELINE_CONFIG,
  ).filter((t) => t.prop === 'strokeDashoffset');
  assert.equal(seekValue(dash, dash.startMs), 100);
  const mid = seekValue(dash, (dash.startMs + dash.endMs) / 2);
  assert.ok(mid < 100 && mid > 0, 'mid draw is partial');
  assert.equal(seekValue(dash, dash.endMs), REMOVE);
});

test('seekValue: deterministic — identical t yields identical value', () => {
  const [op] = planTracks(
    [{ id: 'b', kind: 'block', index: 1, count: 4, naturalOpacity: 1 }],
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
    { id: 'b0', kind: 'block', index: 0, count: 4, naturalOpacity: 1 },
    { id: 'b3', kind: 'block', index: 3, count: 4, naturalOpacity: 1 },
    { id: 'a', kind: 'accent', index: 0, count: 1, naturalOpacity: 1 },
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
