#!/usr/bin/env node
/**
 * Measure every foreground/background pair a theme permits, BEFORE writing the
 * spec — so the rules you write carry real numbers instead of "use sparingly".
 *
 * Exists because a promo accent that read as obviously-fine on paper measured
 * 2.69:1 against a pastel surface and hard-failed at render. Reading cannot
 * catch that; arithmetic can, in a second.
 *
 * Usage:
 *   node check-palette-contrast.mjs --palette '{"ink":"#000","lime":"#dceeb1"}' \
 *                                   --text ink,white --surface lime,canvas
 *
 *   node check-palette-contrast.mjs --pairs '#ff3d8b on #dceeb1, #000 on #fff'
 *
 *   node check-palette-contrast.mjs --file theme-palette.json
 *     where the JSON is { "palette": {...}, "text": [...], "surface": [...] }
 *
 * Verdicts follow WCAG 2.x:
 *   >= 4.5  any text
 *   >= 3.0  large display text only (>=24px bold / >=30px regular) and meaningful graphics
 *   <  3.0  not text — fills and decorative marks only
 */

import { readFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const flag = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : d;
};

// ---------------------------------------------------------------- colour math

function parseHex(input) {
  let h = String(input).trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function relLum({ r, g, b }) {
  const f = (v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a, b) {
  const la = relLum(a);
  const lb = relLum(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

function verdict(ratio) {
  if (ratio >= 4.5) return { level: 'PASS', use: 'any text' };
  if (ratio >= 3.0) return { level: 'LARGE-ONLY', use: 'large display text and meaningful graphics only' };
  return { level: 'FAIL', use: 'not text at any size — fills and decorative marks only' };
}

// ---------------------------------------------------------------- input

let palette = {};
let textRoles = [];
let surfaceRoles = [];
const explicitPairs = [];

const fileArg = flag('file');
if (fileArg) {
  const cfg = JSON.parse(readFileSync(fileArg, 'utf8'));
  palette = cfg.palette || cfg.colors || {};
  textRoles = cfg.text || [];
  surfaceRoles = cfg.surface || [];
}

const paletteArg = flag('palette');
if (paletteArg) palette = { ...palette, ...JSON.parse(paletteArg) };

const textArg = flag('text');
if (textArg) textRoles = textArg.split(',').map((s) => s.trim()).filter(Boolean);

const surfaceArg = flag('surface');
if (surfaceArg) surfaceRoles = surfaceArg.split(',').map((s) => s.trim()).filter(Boolean);

const pairsArg = flag('pairs');
if (pairsArg) {
  for (const chunk of pairsArg.split(',')) {
    const m = chunk.trim().match(/^(\S+)\s+on\s+(\S+)$/i);
    if (m) explicitPairs.push([m[1], m[2]]);
  }
}

// Sensible default: if roles were not named, test every colour against every
// other. Noisy, but on a small palette it surfaces the pair you forgot about.
if (!explicitPairs.length && !textRoles.length && !surfaceRoles.length && Object.keys(palette).length) {
  textRoles = Object.keys(palette);
  surfaceRoles = Object.keys(palette);
}

if (!explicitPairs.length && !Object.keys(palette).length) {
  console.error('Nothing to check. Pass --palette, --file, or --pairs. See the header for examples.');
  process.exit(1);
}

// ---------------------------------------------------------------- run

const resolveColour = (nameOrHex) => {
  const direct = parseHex(nameOrHex);
  if (direct) return { name: nameOrHex, rgb: direct };
  const named = palette[nameOrHex];
  const rgb = named ? parseHex(named) : null;
  return rgb ? { name: `${nameOrHex} (${named})`, rgb } : null;
};

const results = [];

for (const [fg, bg] of explicitPairs) {
  const F = resolveColour(fg);
  const B = resolveColour(bg);
  if (!F || !B) {
    console.error(`Could not resolve pair: ${fg} on ${bg}`);
    continue;
  }
  const ratio = contrast(F.rgb, B.rgb);
  results.push({ fg: F.name, bg: B.name, ratio, ...verdict(ratio) });
}

for (const t of textRoles) {
  for (const s of surfaceRoles) {
    if (t === s) continue;
    const F = resolveColour(t);
    const B = resolveColour(s);
    if (!F || !B) continue;
    const ratio = contrast(F.rgb, B.rgb);
    results.push({ fg: F.name, bg: B.name, ratio, ...verdict(ratio) });
  }
}

// Dedupe symmetric pairs — contrast(a,b) === contrast(b,a), so reporting both
// doubles the table for no information.
const seen = new Set();
const deduped = results.filter((r) => {
  const key = [r.fg, r.bg].sort().join('|');
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

deduped.sort((a, b) => a.ratio - b.ratio);

const pad = (s, n) => String(s).padEnd(n);
const widest = Math.max(12, ...deduped.map((r) => r.fg.length));
const widestBg = Math.max(12, ...deduped.map((r) => r.bg.length));

console.log(`\n${pad('TEXT', widest)}  ${pad('ON SURFACE', widestBg)}  RATIO   VERDICT`);
console.log('-'.repeat(widest + widestBg + 26));
for (const r of deduped) {
  console.log(`${pad(r.fg, widest)}  ${pad(r.bg, widestBg)}  ${r.ratio.toFixed(2).padStart(5)}   ${r.level}`);
}

const fails = deduped.filter((r) => r.level === 'FAIL');
const large = deduped.filter((r) => r.level === 'LARGE-ONLY');

console.log('');
if (large.length) {
  console.log('Write these into the theme spec as measured rules:');
  for (const r of large) console.log(`  ${r.fg} on ${r.bg} — ${r.ratio.toFixed(2)}:1, ${r.use}`);
}
if (fails.length) {
  console.log('\nThese cannot carry text. Say so explicitly in the spec, with the number:');
  for (const r of fails) console.log(`  ${r.fg} on ${r.bg} — ${r.ratio.toFixed(2)}:1, ${r.use}`);
}
if (!fails.length && !large.length) console.log('Every pair clears 4.5:1.');

console.log('');
