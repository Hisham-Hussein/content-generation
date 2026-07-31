import test from 'node:test';
import assert from 'node:assert/strict';

import { ORB_CONFIG, orbWaypoints, orbStateAt, orbAlpha } from './orb.mjs';

const CFG = ORB_CONFIG;

/** Three timed units in a vertical line. */
function units() {
  return [
    { rect: { x: 100, y: 100, width: 200, height: 100 }, startMs: 1000, endMs: 1900 },
    { rect: { x: 500, y: 100, width: 200, height: 100 }, startMs: 2000, endMs: 2900 },
    { rect: { x: 100, y: 500, width: 200, height: 100 }, startMs: 3000, endMs: 3900 },
  ];
}

test('orbWaypoints: one waypoint per unit, at the unit centre', () => {
  const wp = orbWaypoints(units(), CFG);
  assert.equal(wp.length, 3);
  assert.deepEqual({ x: wp[0].x, y: wp[0].y }, { x: 200, y: 150 });
  assert.deepEqual({ x: wp[1].x, y: wp[1].y }, { x: 600, y: 150 });
});

test('orbWaypoints: the orb LEADS the reveal it is guiding', () => {
  // Arriving after the element lit up would make the orb look like a follower.
  // It must arrive first, so the reveal reads as caused by it.
  const wp = orbWaypoints(units(), CFG);
  assert.equal(wp[0].tMs, 1000 - CFG.leadMs);
  assert.equal(wp[1].tMs, 2000 - CFG.leadMs);
});

test('orbStateAt: sits exactly on a waypoint at that waypoint time', () => {
  const wp = orbWaypoints(units(), CFG);
  const s = orbStateAt(wp[1].tMs, wp, CFG);
  assert.ok(Math.abs(s.x - 600) < 1e-6);
  assert.ok(Math.abs(s.y - 150) < 1e-6);
});

test('orbStateAt: interpolates between consecutive waypoints', () => {
  const wp = orbWaypoints(units(), CFG);
  const mid = (wp[0].tMs + wp[1].tMs) / 2;
  const s = orbStateAt(mid, wp, CFG);
  assert.ok(s.x > 200 && s.x < 600, `x ${s.x} is between the two waypoints`);
});

test('orbStateAt: travels monotonically along the path', () => {
  const wp = orbWaypoints(units(), CFG);
  let prev = -Infinity;
  for (let t = wp[0].tMs; t <= wp[wp.length - 1].tMs; t += 25) {
    const d = orbStateAt(t, wp, CFG).distance;
    assert.ok(d >= prev - 1e-9, `path distance never goes backwards at t=${t}`);
    prev = d;
  }
});

test('orbStateAt: fades in before the first waypoint and out after the last', () => {
  const wp = orbWaypoints(units(), CFG);
  const first = wp[0].tMs;
  const last = wp[wp.length - 1].tMs;
  assert.equal(orbStateAt(first - CFG.fadeMs - 1, wp, CFG).opacity, 0);
  assert.ok(orbStateAt(first, wp, CFG).opacity > 0.9, 'fully present on arrival');
  assert.ok(orbStateAt(last + CFG.fadeMs / 2, wp, CFG).opacity < 1, 'fading after the last beat');
  assert.equal(orbStateAt(last + CFG.fadeMs + 1, wp, CFG).opacity, 0);
});

test('orbStateAt: is gone by the end of the build so the final frame is the static composition', () => {
  const u = units();
  const wp = orbWaypoints(u, CFG);
  const buildEnd = Math.max(...u.map((x) => x.endMs));
  assert.equal(orbStateAt(buildEnd, wp, CFG).opacity, 0);
});

test('orbStateAt: deterministic — identical t yields identical state', () => {
  const wp = orbWaypoints(units(), CFG);
  assert.deepEqual(orbStateAt(2345, wp, CFG), orbStateAt(2345, wp, CFG));
});

test('orbStateAt: trail samples lag the orb along the path', () => {
  const wp = orbWaypoints(units(), CFG);
  const s = orbStateAt(wp[2].tMs, wp, CFG);
  assert.equal(s.trail.length, CFG.trailCount);
  for (let i = 1; i < s.trail.length; i++) {
    assert.ok(s.trail[i].distance <= s.trail[i - 1].distance, 'each trail sample is further behind');
    assert.ok(s.trail[i].opacity <= s.trail[i - 1].opacity, 'and fainter');
  }
});

test('orbWaypoints: a single unit still yields a usable path', () => {
  const wp = orbWaypoints([{ rect: { x: 0, y: 0, width: 100, height: 100 }, startMs: 500, endMs: 1400 }], CFG);
  assert.equal(wp.length, 1);
  const s = orbStateAt(wp[0].tMs, wp, CFG);
  assert.equal(s.x, 50);
  assert.equal(s.y, 50);
});

test('orbWaypoints: no units yields no path and no orb', () => {
  assert.deepEqual(orbWaypoints([], CFG), []);
  assert.equal(orbStateAt(0, [], CFG).opacity, 0);
});

// ---------------------------------------------------------------------------
// Visual weight. The orb is a hint, not a cursor: at full strength it competed
// with the composition instead of guiding the eye through it. One scalar
// governs every alpha so "tone it down" stays a one-number change.
// ---------------------------------------------------------------------------

test('orbAlpha: intensity scales every alpha together', () => {
  assert.equal(orbAlpha(0.8, { intensity: 0.5 }), 0.4);
  assert.equal(orbAlpha(0.5, { intensity: 0.5 }), 0.25);
});

test('orbAlpha: intensity of 1 leaves the base alpha untouched', () => {
  assert.equal(orbAlpha(0.42, { intensity: 1 }), 0.42);
});

test('orbAlpha: a missing intensity defaults to full strength', () => {
  assert.equal(orbAlpha(0.42, {}), 0.42);
});

test('orbAlpha: clamps into the legal alpha range', () => {
  assert.equal(orbAlpha(2, { intensity: 1 }), 1);
  assert.equal(orbAlpha(0.5, { intensity: -3 }), 0);
});

test('ORB_CONFIG: ships toned down — the orb must not out-shout the content', () => {
  assert.ok(ORB_CONFIG.intensity < 0.6, `intensity ${ORB_CONFIG.intensity} is a hint, not a spotlight`);
  assert.ok(orbAlpha(ORB_CONFIG.coreAlpha, ORB_CONFIG) < 0.5, 'the core is a soft presence');
  assert.ok(orbAlpha(ORB_CONFIG.trailAlpha, ORB_CONFIG) < 0.25, 'the trail must not read as a dotted line');
});

// ---------------------------------------------------------------------------
// Movement quality. The path's job is gentle guidance. Constant-time segments
// over variable distances made the orb fastest on the longest, least
// informative traverse (right column -> next row's left column), and linear
// interpolation gave it hard corners at every waypoint.
// ---------------------------------------------------------------------------

test('orbStateAt: decelerates into each waypoint instead of arriving at speed', () => {
  const wp = orbWaypoints(units(), CFG);
  const a = wp[0].tMs, b = wp[1].tMs;
  const speedAt = (t) => {
    const h = 8;
    const p0 = orbStateAt(t - h, wp, CFG), p1 = orbStateAt(t + h, wp, CFG);
    return Math.hypot(p1.x - p0.x, p1.y - p0.y) / (2 * h);
  };
  const atWaypoint = speedAt(b);
  const midSegment = speedAt((a + b) / 2);
  assert.ok(atWaypoint < midSegment * 0.5,
    `arrival speed ${atWaypoint.toFixed(3)} must be well below mid-segment ${midSegment.toFixed(3)}`);
});

test('orbStateAt: eases in rather than leaving a waypoint at full speed', () => {
  const wp = orbWaypoints(units(), CFG);
  const a = wp[0].tMs, b = wp[1].tMs;
  const quarter = orbStateAt(a + (b - a) * 0.25, wp, CFG);
  const linearX = wp[0].x + (wp[1].x - wp[0].x) * 0.25;
  assert.ok(quarter.x < linearX, 'a quarter of the way through time is less than a quarter of the way through space');
});

test('orbStateAt: dims while transiting, brightens where it arrives', () => {
  // The long return sweep carries no information. Fading it is what stops the
  // path reading as aggressive left-right-left-right motion.
  const wp = orbWaypoints(units(), CFG);
  const a = wp[0].tMs, b = wp[1].tMs;
  const atWaypoint = orbStateAt(b, wp, CFG).opacity;
  const midSegment = orbStateAt((a + b) / 2, wp, CFG).opacity;
  assert.ok(midSegment < atWaypoint, `transit ${midSegment.toFixed(3)} must be fainter than arrival ${atWaypoint.toFixed(3)}`);
});

test('orbStateAt: transit fade never fully extinguishes the orb mid-path', () => {
  const wp = orbWaypoints(units(), CFG);
  const mid = orbStateAt((wp[0].tMs + wp[1].tMs) / 2, wp, CFG);
  assert.ok(mid.opacity >= CFG.travelFadeFloor * 0.9, 'still present enough to be followed');
});

test('ORB_CONFIG: ships with transit fading enabled', () => {
  assert.ok(CFG.travelFadeFloor < 1, 'the orb must fade while travelling fast');
  assert.ok(CFG.travelFadeFloor > 0, 'but never vanish completely');
});
