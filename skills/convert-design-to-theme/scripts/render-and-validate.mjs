#!/usr/bin/env node
/**
 * Render a fixed-size artboard, validate it, and report the measurements you
 * need to judge the layout — in one pass.
 *
 * Exists because this gets hand-written on every theme conversion otherwise,
 * slightly differently each time, usually without the font check and always
 * without the section measurements that reveal dead space.
 *
 * Usage:
 *   node render-and-validate.mjs <path-to-html> [options]
 *
 * Options:
 *   --out <path>        PNG output path (default: alongside the HTML, same basename)
 *   --selector <sel>    Canvas selector (default: .infographic)
 *   --width <n>         Viewport width (default: 1080)
 *   --height <n>        Viewport height (default: 1350)
 *   --scale <n>         deviceScaleFactor (default: 2)
 *   --measure <a,b,c>   Extra CSS selectors to measure, comma-separated
 *   --force             Write the PNG even when validation fails
 *
 * The PNG is written only when validation passes, so a failing render can't be
 * mistaken for a finished asset. Pass --force when you deliberately want to look
 * at a broken layout.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';

// ---------------------------------------------------------------- args

const argv = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const has = (name) => argv.includes(`--${name}`);

const htmlArg = argv.find((a) => !a.startsWith('--') && /\.html?$/i.test(a));
if (!htmlArg) {
  console.error('Usage: node render-and-validate.mjs <path-to-html> [--out <png>] [--measure sel,sel]');
  process.exit(1);
}

const htmlPath = resolve(htmlArg);
if (!existsSync(htmlPath)) {
  console.error(`No such file: ${htmlPath}`);
  process.exit(1);
}

const selector = flag('selector', '.infographic');
const width = Number(flag('width', 1080));
const height = Number(flag('height', 1350));
const scale = Number(flag('scale', 2));
const outPath = resolve(flag('out', join(dirname(htmlPath), basename(htmlPath).replace(/\.html?$/i, '.png'))));
const extraSelectors = (flag('measure', '') || '').split(',').map((s) => s.trim()).filter(Boolean);

// ---------------------------------------------------------------- runtime discovery
// Reuse whatever is already on the machine. Installing a browser to render one
// artboard is a minutes-long detour for something almost always already present.

const HOME = process.env.HOME || '';

function subdirs(dir) {
  try { return readdirSync(dir); } catch { return []; }
}

function playwrightCandidates() {
  const out = ['playwright', `${process.cwd()}/node_modules/playwright/index.js`];
  for (const v of subdirs(`${HOME}/.nvm/versions/node`)) {
    out.push(`${HOME}/.nvm/versions/node/${v}/lib/node_modules/@playwright/cli/node_modules/playwright/index.js`);
  }
  for (const h of subdirs(`${HOME}/.npm/_npx`)) {
    out.push(`${HOME}/.npm/_npx/${h}/node_modules/playwright/index.js`);
  }
  return out;
}

async function loadPlaywright() {
  for (const c of playwrightCandidates()) {
    if (c !== 'playwright' && !existsSync(c)) continue;
    try {
      const mod = await import(c);
      const pw = mod.chromium ? mod : mod.default;
      if (pw?.chromium) return { pw, source: c };
    } catch { /* try the next candidate */ }
  }
  return { pw: null, source: null };
}

function findChromium() {
  const root = `${HOME}/.cache/ms-playwright`;
  const dirs = subdirs(root)
    .filter((d) => d.startsWith('chromium-'))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  for (const d of dirs) {
    for (const rel of ['chrome-linux64/chrome', 'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
      const p = `${root}/${d}/${rel}`;
      if (existsSync(p)) return p;
    }
  }
  return null;
}

// ---------------------------------------------------------------- main

const { pw, source } = await loadPlaywright();
if (!pw) {
  console.error('Playwright not found. Looked for a machine-level install before suggesting one.');
  console.error('Install with: npm i -g @playwright/cli && npx playwright install chromium');
  process.exit(1);
}

const executablePath = findChromium();
const browser = await pw.chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });

const consoleMessages = [];
page.on('console', (m) => consoleMessages.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => consoleMessages.push(`pageerror: ${e.message}`));

await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1000);

// Fonts: a dropped @import silently falls back to serif and nobody notices
// until the PNG looks wrong. Report what actually resolved.
const fonts = await page.evaluate((sel) => {
  const canvas = document.querySelector(sel);
  const probe = canvas?.querySelector('h1, .m-hook, [class*="hook"]') || canvas;
  if (!probe) return null;
  const cs = getComputedStyle(probe);
  const family = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
  return {
    computedFamily: cs.fontFamily,
    primary: family,
    loaded: document.fonts.check(`${cs.fontWeight} ${cs.fontSize} "${family}"`),
  };
}, selector);

// Section geometry: where each block starts and ends, and how much empty canvas
// is left above the footer. Dead space is invisible in a pass/fail check and is
// the single most common reason a technically-valid render looks unfinished.
const layout = await page.evaluate(({ sel, extras }) => {
  const canvas = document.querySelector(sel);
  if (!canvas) return null;
  const top = canvas.getBoundingClientRect().top;
  const rows = {};
  const seen = new Set();

  const record = (label, el) => {
    if (!el || seen.has(el)) return;
    seen.add(el);
    const r = el.getBoundingClientRect();
    rows[label] = { top: Math.round(r.top - top), bottom: Math.round(r.bottom - top), h: Math.round(r.height) };
  };

  for (const el of canvas.children) {
    const cs = getComputedStyle(el);
    if (cs.position === 'absolute' || cs.display === 'none' || el.offsetHeight === 0) continue;
    const label = el.className ? `.${String(el.className).split(' ')[0]}` : el.tagName.toLowerCase();
    record(label, el);
  }
  for (const s of extras) record(s, canvas.querySelector(s));

  const entries = Object.values(rows);
  const lastBottom = entries.length ? Math.max(...entries.map((e) => e.bottom)) : 0;
  const footer = canvas.querySelector('.author-footer, .m-footer, [class*="footer"]');
  let gapAboveFooter = null;
  if (footer) {
    const fRect = footer.getBoundingClientRect();
    const above = entries
      .filter((e) => e.bottom <= Math.round(fRect.top - top) + 1)
      .reduce((m, e) => Math.max(m, e.bottom), 0);
    gapAboveFooter = Math.round(fRect.top - top) - above;
  }
  return { rows, lastBottom, gapAboveFooter };
}, { sel: selector, extras: extraSelectors });

// Validators from the sibling generate-infographic skill, when present.
const html = readFileSync(htmlPath, 'utf8');
const validation = { preRender: null, postRender: null };
const skillsRoot = resolve(new URL('.', import.meta.url).pathname, '..', '..');

try {
  const pre = await import(`${skillsRoot}/generate-infographic/scripts/validate-mobile-linkedin-infographic.mjs`);
  validation.preRender = pre.validateInfographicHtml(html);
} catch { validation.preRender = { status: 'skipped', reason: 'validator not installed' }; }

try {
  const post = await import(`${skillsRoot}/generate-infographic/scripts/validate-post-render.mjs`);
  validation.postRender = await post.validatePostRenderOnPage(page);
} catch { validation.postRender = { status: 'skipped', reason: 'validator not installed' }; }

const failed =
  validation.preRender?.status === 'fail' || validation.postRender?.status === 'fail';

let wrote = false;
if (!failed || has('force')) {
  await page.locator(selector).screenshot({ path: outPath });
  wrote = true;
}

await browser.close();

// ---------------------------------------------------------------- report

const report = {
  html: htmlPath,
  png: wrote ? outPath : null,
  runtime: { playwright: source, chromium: executablePath || 'bundled' },
  fonts,
  layout,
  validation,
  console: consoleMessages,
};

console.log(JSON.stringify(report, null, 2));

const notes = [];
if (fonts && !fonts.loaded) notes.push(`FONT: "${fonts.primary}" did not load — check for an @import after a style rule; use <link> in <head>.`);
if (layout?.gapAboveFooter > 100) notes.push(`DEAD SPACE: ${layout.gapAboveFooter}px of empty canvas above the footer. Scale the hero up rather than leaving it.`);
if (consoleMessages.some((m) => /icon name was not found/i.test(m))) notes.push('ICON: a Lucide name did not resolve — it renders as nothing. Check the name against the installed version.');
if (!wrote) notes.push('PNG NOT WRITTEN: validation failed. Fix the errors above, or pass --force to inspect the broken layout.');
if (notes.length) console.error(`\n${notes.map((n) => `! ${n}`).join('\n')}`);

process.exit(failed && !has('force') ? 1 : 0);
