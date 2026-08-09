import test from 'node:test';
import assert from 'node:assert/strict';

import { READING_ORDER_CONFIG, assignReadingOrder, clusterUnits, planUnitTimeline } from './reading-order.mjs';

const CFG = READING_ORDER_CONFIG;

/** Terse rect helper: r(id, x, y, w, h). */
function r(id, x, y, w, h) {
  return { id, rect: { x, y, width: w, height: h } };
}

/** Ids in the order the engine says they should animate. */
function orderedIds(targets, cfg = CFG) {
  return assignReadingOrder(targets, cfg).map((t) => t.id);
}

// ---------------------------------------------------------------------------
// The core defect this module exists to fix: scheduling must follow position,
// not DOM order and not element kind. Inputs below are deliberately shuffled.
// ---------------------------------------------------------------------------

test('assignReadingOrder: single column reads top to bottom', () => {
  const targets = [
    r('c', 100, 900, 800, 200),
    r('a', 100, 100, 800, 200),
    r('b', 100, 500, 800, 200),
  ];
  assert.deepEqual(orderedIds(targets), ['a', 'b', 'c']);
});

test('assignReadingOrder: one row reads left to right', () => {
  const targets = [
    r('right', 700, 100, 200, 200),
    r('left', 100, 100, 200, 200),
    r('mid', 400, 100, 200, 200),
  ];
  assert.deepEqual(orderedIds(targets), ['left', 'mid', 'right']);
});

test('assignReadingOrder: two-column zigzag alternates across then down', () => {
  // The post-61 shape: a left card and a right card per row, five rows.
  const targets = [];
  for (let row = 0; row < 3; row++) {
    targets.push(r(`R${row}`, 600, 100 + row * 300, 400, 200));
    targets.push(r(`L${row}`, 100, 100 + row * 300, 400, 200));
  }
  assert.deepEqual(orderedIds(targets), ['L0', 'R0', 'L1', 'R1', 'L2', 'R2']);
});

test('assignReadingOrder: a label sitting lower than its row-mate stays in its row', () => {
  // A card top-aligned at y=100 and its neighbour's text baseline at y=160 are
  // the SAME visual row. A naive y-sort would interleave the rows here.
  const targets = [
    r('row0-left', 100, 100, 400, 200),
    r('row0-right-label', 600, 160, 300, 40),
    r('row1-left', 100, 400, 400, 200),
    r('row1-right-label', 600, 460, 300, 40),
  ];
  assert.deepEqual(orderedIds(targets), [
    'row0-left', 'row0-right-label', 'row1-left', 'row1-right-label',
  ]);
});

test('assignReadingOrder: a full-width band below a two-column row comes last', () => {
  const targets = [
    r('footer', 100, 700, 800, 100),
    r('left', 100, 100, 400, 400),
    r('right', 600, 100, 400, 400),
  ];
  assert.deepEqual(orderedIds(targets), ['left', 'right', 'footer']);
});

test('assignReadingOrder: order is independent of input order', () => {
  const targets = [
    r('a', 100, 100, 200, 100),
    r('b', 500, 100, 200, 100),
    r('c', 100, 400, 200, 100),
  ];
  const forward = orderedIds(targets);
  const reversed = orderedIds([...targets].reverse());
  assert.deepEqual(forward, reversed);
  assert.deepEqual(forward, ['a', 'b', 'c']);
});

test('assignReadingOrder: assigns a dense zero-based order index', () => {
  const targets = [r('b', 100, 400, 200, 100), r('a', 100, 100, 200, 100)];
  const out = assignReadingOrder(targets, CFG);
  assert.deepEqual(out.map((t) => t.order), [0, 1]);
  assert.equal(out[0].id, 'a');
});

test('assignReadingOrder: targets on the same visual row share a band', () => {
  const targets = [
    r('left', 100, 100, 400, 200),
    r('right', 600, 130, 400, 200),
    r('below', 100, 500, 400, 200),
  ];
  const out = assignReadingOrder(targets, CFG);
  const band = (id) => out.find((t) => t.id === id).band;
  assert.equal(band('left'), band('right'), 'same row => same band');
  assert.notEqual(band('left'), band('below'), 'next row => different band');
});

test('assignReadingOrder: does not mutate its input', () => {
  const targets = [r('a', 100, 100, 200, 100)];
  const snapshot = JSON.stringify(targets);
  assignReadingOrder(targets, CFG);
  assert.equal(JSON.stringify(targets), snapshot);
});

test('assignReadingOrder: empty input yields empty output', () => {
  assert.deepEqual(assignReadingOrder([], CFG), []);
});

// ---------------------------------------------------------------------------
// clusterUnits: a card, its border and its label are ONE reading beat, not
// three. Post 61 has ~40 animatable elements; as 40 events in 2.6s that is 15
// events/second, which nobody can read. Clustering is what makes it legible.
// ---------------------------------------------------------------------------

test('clusterUnits: a label inside a card joins the card as one unit', () => {
  const units = clusterUnits([
    r('card', 100, 100, 400, 200),
    r('label', 120, 150, 200, 40),
  ], CFG);
  assert.equal(units.length, 1);
  assert.deepEqual(units[0].members.map((m) => m.id).sort(), ['card', 'label']);
});

test('clusterUnits: two separate cards stay two units', () => {
  const units = clusterUnits([
    r('a', 100, 100, 400, 200),
    r('b', 600, 100, 400, 200),
  ], CFG);
  assert.equal(units.length, 2);
});

test('clusterUnits: a box only half-overlapping a neighbour does not join it', () => {
  // Guards the real failure mode: a generously-padded card swallowing the
  // NEIGHBOURING card's label and dragging it into the wrong beat.
  const units = clusterUnits([
    r('card', 100, 100, 400, 200),
    r('straddler', 400, 100, 400, 200),
  ], CFG);
  assert.equal(units.length, 2);
});

test('clusterUnits: nesting is transitive (card > inner box > label)', () => {
  const units = clusterUnits([
    r('card', 100, 100, 400, 300),
    r('inner', 120, 120, 360, 200),
    r('label', 140, 140, 200, 40),
  ], CFG);
  assert.equal(units.length, 1);
  assert.equal(units[0].members.length, 3);
});

test('clusterUnits: unit rect is the union of its members', () => {
  const units = clusterUnits([
    r('card', 100, 100, 400, 200),
    r('label', 120, 150, 200, 40),
  ], CFG);
  assert.deepEqual(units[0].rect, { x: 100, y: 100, width: 400, height: 200 });
});

test('clusterUnits: reading order over units, not raw elements', () => {
  // Two cards each with a label. Correct beats: card A (+label), then card B.
  // The OLD kind-based scheduler would have produced fill,fill,text,text.
  const units = assignReadingOrder(clusterUnits([
    r('cardB', 600, 100, 400, 200),
    r('labelB', 620, 150, 200, 40),
    r('cardA', 100, 100, 400, 200),
    r('labelA', 120, 150, 200, 40),
  ], CFG), CFG);
  assert.equal(units.length, 2);
  assert.deepEqual(units.map((u) => u.members.map((m) => m.id).sort()), [
    ['cardA', 'labelA'],
    ['cardB', 'labelB'],
  ]);
});

test('clusterUnits: a lone element becomes a unit of one', () => {
  const units = clusterUnits([r('solo', 100, 100, 200, 100)], CFG);
  assert.equal(units.length, 1);
  assert.deepEqual(units[0].members.map((m) => m.id), ['solo']);
});

test('clusterUnits: empty input yields no units', () => {
  assert.deepEqual(clusterUnits([], CFG), []);
});

// ---------------------------------------------------------------------------
// planUnitTimeline: sequencing + the craft layer (G2.1-G2.3).
// ---------------------------------------------------------------------------

/** Build n ordered content units in a single column. */
function column(n) {
  return assignReadingOrder(
    Array.from({ length: n }, (_, i) => r(`u${i}`, 100, 100 + i * 250, 800, 200)),
    CFG,
  ).map((t) => ({ members: [t], rect: t.rect, order: t.order, band: t.band }));
}

test('planUnitTimeline: units start in reading order', () => {
  const timed = planUnitTimeline(column(4), CFG);
  for (let i = 1; i < timed.length; i++) {
    assert.ok(timed[i].startMs > timed[i - 1].startMs, `unit ${i} starts after ${i - 1}`);
  }
});

test('planUnitTimeline: consecutive units overlap rather than queue', () => {
  // The polish fix: a unit must begin before its predecessor has finished,
  // otherwise the build reads as a series of separate events.
  const timed = planUnitTimeline(column(4), CFG);
  for (let i = 1; i < timed.length; i++) {
    assert.ok(timed[i].startMs < timed[i - 1].endMs, `unit ${i} overlaps ${i - 1}`);
  }
});

test('planUnitTimeline: no dead air anywhere in the build', () => {
  // The latent accentStartMs:5600 bug produced ~2.9s of frozen frames. This
  // asserts something is always moving between t=0 and the end of the build.
  const timed = planUnitTimeline(column(8), CFG);
  const lastEnd = Math.max(...timed.map((u) => u.endMs));
  for (let t = 0; t <= lastEnd; t += 50) {
    const active = timed.some((u) => t >= u.startMs && t <= u.endMs);
    assert.ok(active, `something must be animating at t=${t}ms`);
  }
});

test('planUnitTimeline: time follows travel down the page, not unit count', () => {
  // The defect: a uniform per-unit step hands the timeline to whichever region
  // decomposes into the most targets. A diagram whose SVG resolved into 12 parts
  // spanning 30px took 4.1s of a 7.2s build, while the 800px of cards below it
  // (4 units) got 0.95s — the guide dwelt where there was nothing to read and
  // raced through everything there was.
  const row = Array.from({ length: 12 }, (_, i) => r(`d${i}`, 40 + i * 70, 300, 60, 20));
  const below = Array.from({ length: 4 }, (_, i) => r(`c${i}`, 60, 520 + i * 200, 900, 160));
  const units = assignReadingOrder([...row, ...below], CFG)
    .map((t) => ({ members: [t], rect: t.rect, order: t.order, band: t.band }));

  const timed = planUnitTimeline(units, CFG);
  const at = (id) => timed.find((u) => u.members[0].id === id).startMs;

  // The 12-part row shares one band, so it costs the per-beat minimum and reads
  // as one quick left-to-right sweep.
  const rowSpan = at('d11') - at('d0');
  // The four cards below span 600px of page and must not be crushed into the tail.
  const belowSpan = timed[timed.length - 1].startMs - at('c0');

  assert.ok(
    belowSpan > rowSpan,
    `600px of cards (${Math.round(belowSpan)}ms) must outlast a same-row run of 12 parts (${Math.round(rowSpan)}ms)`,
  );
});

test('planUnitTimeline: same-row beats cost less than a row change', () => {
  const sameRow = assignReadingOrder([r('a', 40, 300, 100, 40), r('b', 200, 300, 100, 40)], CFG)
    .map((t) => ({ members: [t], rect: t.rect, order: t.order, band: t.band }));
  const nextRow = assignReadingOrder([r('a', 40, 300, 100, 40), r('b', 40, 900, 100, 40)], CFG)
    .map((t) => ({ members: [t], rect: t.rect, order: t.order, band: t.band }));

  const flat = planUnitTimeline(sameRow, CFG);
  const deep = planUnitTimeline(nextRow, CFG);
  assert.ok(
    deep[1].startMs > flat[1].startMs,
    'descending 600px must cost more than stepping sideways within a row',
  );
});

test('planUnitTimeline: build fits the duration budget', () => {
  const timed = planUnitTimeline(column(10), CFG);
  const lastEnd = Math.max(...timed.map((u) => u.endMs));
  assert.ok(lastEnd <= CFG.maxBuildMs, `build ${lastEnd}ms <= ${CFG.maxBuildMs}ms`);
});

test('planUnitTimeline: every unit rises from below', () => {
  const timed = planUnitTimeline(column(3), CFG);
  for (const u of timed) assert.equal(u.enterDy, CFG.risePx);
});

test('planUnitTimeline: units reached by moving right drift in from the left', () => {
  // Direction of entry reinforces the direction the eye is travelling, so this
  // serves reading clarity and polish at the same time.
  const units = assignReadingOrder([
    r('first', 100, 100, 300, 200),
    r('second', 500, 100, 300, 200),
  ], CFG).map((t) => ({ members: [t], rect: t.rect, order: t.order, band: t.band }));
  const timed = planUnitTimeline(units, CFG);
  assert.equal(timed[0].enterDx, 0, 'first in band arrives by moving down: pure rise');
  assert.equal(timed[1].enterDx, -CFG.driftPx, 'later in band drifts from the left');
});

test('planUnitTimeline: the first unit is the hero and gets a settle scale', () => {
  const timed = planUnitTimeline(column(3), CFG);
  assert.equal(timed[0].isHero, true);
  assert.equal(timed[0].scaleFrom, CFG.heroScaleFrom);
  assert.equal(timed[1].isHero, false);
  assert.equal(timed[1].scaleFrom, 1);
});

test('planUnitTimeline: connectors are shorter and use the connector ease', () => {
  const units = column(2);
  units[1].isConnector = true;
  const timed = planUnitTimeline(units, CFG);
  assert.equal(timed[1].ease, 'easeInOutSine');
  assert.ok(timed[1].endMs - timed[1].startMs < timed[0].endMs - timed[0].startMs);
});

test('planUnitTimeline: at most two eases across non-accent units', () => {
  // "More than two eases in a build reads as noise."
  const timed = planUnitTimeline(column(10), CFG);
  const eases = new Set(timed.filter((u) => !u.isAccent).map((u) => u.ease));
  assert.ok(eases.size <= 2, `${eases.size} eases: ${[...eases].join(', ')}`);
});

test('planUnitTimeline: empty input yields no timeline', () => {
  assert.deepEqual(planUnitTimeline([], CFG), []);
});

test('planUnitTimeline: the hero is the largest type, not merely the first beat', () => {
  // Real bug: post 61 leads with an eyebrow pill above the title, so the pill
  // took the hero settle-scale and the actual headline got none.
  const units = assignReadingOrder([
    { ...r('eyebrow', 100, 60, 300, 40), maxFontPx: 24 },
    { ...r('title', 100, 140, 800, 120), maxFontPx: 64 },
    { ...r('body', 100, 400, 800, 200), maxFontPx: 20 },
  ], CFG).map((t) => ({ members: [t], rect: t.rect, order: t.order, band: t.band }));
  const timed = planUnitTimeline(units, CFG);
  const hero = timed.find((u) => u.isHero);
  assert.equal(hero.members[0].id, 'title');
  assert.equal(timed.filter((u) => u.isHero).length, 1, 'exactly one hero');
});

test('planUnitTimeline: with no type information the first beat is the hero', () => {
  const timed = planUnitTimeline(column(3), CFG);
  assert.equal(timed[0].isHero, true);
});
