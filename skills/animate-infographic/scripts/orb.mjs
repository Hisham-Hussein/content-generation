/**
 * Guide orb — the reading path made visible.
 *
 * A small luminous point travels the same sequence the choreography already
 * uses, arriving at each reading beat just BEFORE that beat lights up. It is the
 * only "flourish" here that does not trade against clarity: it does not decorate
 * the composition, it performs the guidance.
 *
 * Three layers ride the same path:
 *   - halo   — a soft radial glow. This is the focus falloff: instead of
 *              manipulating every unit's opacity (which needs piecewise tracks,
 *              because two sequential tracks on one property clobber each
 *              other), one travelling light brightens whatever it is over.
 *   - trail  — N lagging samples along the path, fainter and smaller with age.
 *   - core   — the orb itself.
 *
 * PURE and dependency-free, for the same reason as reading-order.mjs: unit
 * testable in Node, and serialisable into the page via toString().
 *
 * The orb is fully faded out before the build ends, so the final frame is still
 * exactly the static composition.
 */

export const ORB_CONFIG = {
  // Arrive this far ahead of the beat it guides. Arriving after would make the
  // orb read as a follower rather than the cause of the reveal.
  leadMs: 140,
  fadeMs: 320,      // fade in before the first beat / out after the last

  // --- visual weight ------------------------------------------------------
  // ONE knob for the orb's presence. At full strength the orb competed with the
  // composition: a saturated dot with a hard glow, trailed by six half-opaque
  // dots that read as a marching-ants line straight across the cards. That is a
  // cursor, not a guide — it pulled attention to itself and away from the
  // message it exists to serve.
  //
  // The orb should be felt more than seen: enough presence to lead the eye,
  // never enough to become the subject. Turn this down further to soften, up to
  // strengthen; every alpha below scales with it.
  intensity: 0.4,

  coreAlpha: 0.9,
  coreGlowAlpha: 0.42,
  haloInnerAlpha: 0.14,
  haloMidAlpha: 0.055,
  trailAlpha: 0.5,

  trailCount: 4,    // was 6 — fewer samples read as a wake, not a dotted rule
  trailGapMs: 52,   // spacing between trail samples, in path time

  // --- movement quality ---------------------------------------------------
  // Waypoints are evenly spaced in TIME but not in DISTANCE, so a naive linear
  // path moves fastest on the longest hop — the return sweep from the right
  // column to the next row's left column, which carries no information at all.
  // Repeated ten times down a two-column layout that reads as aggressive
  // left-right-left-right motion rather than gentle guidance.
  //
  // Two damping mechanisms, which compose:
  //   1. ease within each segment, so the orb decelerates into every waypoint
  //      and accelerates out of it instead of cornering at speed;
  //   2. opacity tied to speed, so fast transits fade toward travelFadeFloor
  //      and the orb is brightest exactly where it arrives.
  // The net effect is a soft pulse at each beat rather than a dot flying about.
  calmSpeedPxPerMs: 0.25,  // at or below this the orb is at full strength
  fastSpeedPxPerMs: 1.40,  // at or above this it is down to travelFadeFloor
  travelFadeFloor: 0.18,   // never fully invisible — it must stay followable
  coreRadiusPx: 5,
  // The halo is also the single biggest cost in the encoded GIF: a large box of
  // changing pixels every frame is exactly what diff_mode=rectangle cannot
  // compress. 110 produced a 6.7MB file. 60 both softens the orb and shrinks it.
  haloRadiusPx: 60,
  trailMinScale: 0.2,
};

/**
 * Pure: a base alpha scaled by the orb's global intensity, clamped to [0,1].
 * Every orb alpha goes through here so "tone it down" is one number, not six.
 */
export function orbAlpha(base, cfg) {
  const i = typeof cfg.intensity === 'number' ? cfg.intensity : 1;
  const v = base * i;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Pure: timed units -> [{x, y, tMs}] path waypoints at unit centres. */
export function orbWaypoints(units, cfg = ORB_CONFIG) {
  return units.map((u) => ({
    x: u.rect.x + u.rect.width / 2,
    y: u.rect.y + u.rect.height / 2,
    tMs: u.startMs - cfg.leadMs,
  }));
}

/**
 * Pure: smoothstep. Zero derivative at both ends, so the orb comes to rest at
 * every waypoint rather than cornering through it at full speed.
 * EXPORTED for the same serialisation reason as pointAt.
 */
export function smoothstep(p) {
  const c = p < 0 ? 0 : p > 1 ? 1 : p;
  return c * c * (3 - 2 * c);
}

/**
 * Pure: position + cumulative path distance at time t.
 * EXPORTED because orbStateAt references it and both are serialised into the
 * page — an unexported helper resolves fine in Node and is undefined in the
 * browser, which every unit test would still pass.
 */
export function pointAt(t, wp) {
  if (t <= wp[0].tMs) return { x: wp[0].x, y: wp[0].y, distance: 0 };
  let distance = 0;
  for (let i = 1; i < wp.length; i++) {
    const a = wp[i - 1];
    const b = wp[i];
    const seg = Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
    if (t <= b.tMs) {
      const span = b.tMs - a.tMs;
      const raw = span > 0 ? (t - a.tMs) / span : 1;
      const p = smoothstep(raw);
      return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, distance: distance + seg * p };
    }
    distance += seg;
  }
  const last = wp[wp.length - 1];
  return { x: last.x, y: last.y, distance };
}

/**
 * Pure: full orb state at time t.
 * Returns { x, y, distance, opacity, trail: [{x, y, distance, opacity, scale}] }.
 */
export function orbStateAt(t, wp, cfg = ORB_CONFIG) {
  if (!wp.length) return { x: 0, y: 0, distance: 0, opacity: 0, trail: [] };

  const first = wp[0].tMs;
  const last = wp[wp.length - 1].tMs;

  let opacity = 1;
  if (t < first) opacity = Math.max(0, 1 - (first - t) / cfg.fadeMs);
  else if (t > last) opacity = Math.max(0, 1 - (t - last) / cfg.fadeMs);

  const head = pointAt(t, wp);

  // Speed-linked attenuation. Sampled by central difference rather than derived
  // analytically so it stays correct whatever easing pointAt uses. Combined with
  // the smoothstep above, speed is ~0 at every waypoint, so the orb is brightest
  // exactly where it is telling you to look and faintest while it is merely
  // getting there.
  const H = 8;
  const p0 = pointAt(t - H, wp);
  const p1 = pointAt(t + H, wp);
  const speed = Math.sqrt((p1.x - p0.x) * (p1.x - p0.x) + (p1.y - p0.y) * (p1.y - p0.y)) / (2 * H);
  const range = cfg.fastSpeedPxPerMs - cfg.calmSpeedPxPerMs;
  let over = range > 0 ? (speed - cfg.calmSpeedPxPerMs) / range : 0;
  over = over < 0 ? 0 : over > 1 ? 1 : over;
  opacity *= 1 - over * (1 - cfg.travelFadeFloor);
  const trail = [];
  for (let i = 1; i <= cfg.trailCount; i++) {
    const tt = t - i * cfg.trailGapMs;
    const p = pointAt(tt, wp);
    const decay = 1 - i / (cfg.trailCount + 1);
    trail.push({
      x: p.x,
      y: p.y,
      distance: p.distance,
      opacity: opacity * decay * decay,
      scale: cfg.trailMinScale + (1 - cfg.trailMinScale) * decay,
    });
  }

  return { x: head.x, y: head.y, distance: head.distance, opacity, trail };
}
