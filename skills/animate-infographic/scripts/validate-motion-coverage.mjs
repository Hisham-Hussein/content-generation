/**
 * Motion-coverage validator.
 *
 * Asserts the motion layer actually BINDS the composition's content, rather than
 * silently animating a handful of elements while the rest sit at full opacity
 * from frame 0.
 *
 * This exists because of a real defect: `.seam[data-content-block]` wrapped the
 * five diagram SVGs, the scan skipped any content block containing an <svg>
 * intending to descend into it, but it only ever descended to SVG interiors —
 * never to the ten HTML cards inside. The result bound 12 of ~22 real elements
 * and passed every other check, because a GIF of a mostly-static composition is
 * still a valid GIF. Nothing caught it but the human eye.
 *
 * Checks:
 *   - a substantial visual box (background/border, area >= minBoxArea) must be
 *     covered by the motion layer: bound itself, or an ancestor/descendant of a
 *     bound target
 *   - total bound area must reach minCoverage of the artboard
 *
 * Usage: node validate-motion-coverage.mjs <infographic.html> [--json]
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync, readdirSync } from 'node:fs';

import { buildInjectionScript, TIMELINE_CONFIG } from './inject-timeline.mjs';

const DEFAULTS = {
  minBoxArea: 12000,   // ~110x110px: a card, not an icon or a hairline
  minCoverage: 0.45,   // fraction of the artboard reached by bound targets
};

async function resolvePlaywright() {
  const candidates = ['playwright', '@playwright/cli/node_modules/playwright'];
  const home = process.env.HOME || '';
  for (const base of [path.join(home, '.nvm/versions/node'), path.join(home, '.npm/_npx')]) {
    try {
      for (const entry of readdirSync(base)) {
        candidates.push(
          path.join(base, entry, 'lib/node_modules/@playwright/cli/node_modules/playwright/index.mjs'),
          path.join(base, entry, 'node_modules/playwright/index.mjs'),
        );
      }
    } catch {}
  }
  for (const p of candidates) {
    try {
      const mod = await import(p.startsWith('/') ? pathToFileURL(p).href : p);
      if (mod && (mod.chromium || (mod.default && mod.default.chromium))) return mod.chromium ? mod : mod.default;
    } catch {}
  }
  throw new Error('Playwright not found. Reuse a machine-level install or `npm i -g @playwright/cli`.');
}

export async function validateMotionCoverage(htmlPath, opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  const playwright = await resolvePlaywright();
  const browser = await playwright.chromium.launch();
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: 1080, height: 1350 } });
    await page.goto(pathToFileURL(path.resolve(htmlPath)).href, { waitUntil: 'networkidle' });
    await page.evaluate(async () => { if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} } });
    await page.evaluate(buildInjectionScript(TIMELINE_CONFIG));

    const report = await page.evaluate((minBoxArea) => {
      const root = document.querySelector('.infographic');
      const rootRect = root.getBoundingClientRect();
      const bound = window.__animElements || [];

      const isBoundOrRelated = (el) =>
        bound.some((b) => b === el || b.contains(el) || el.contains(b));

      const visible = (el) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        const bg = cs.backgroundColor || '';
        const hasBg = bg && bg !== 'transparent' && !/rgba\(0,\s*0,\s*0,\s*0\)/.test(bg);
        const hasBorder = parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0;
        const hasShadow = cs.boxShadow && cs.boxShadow !== 'none';
        return hasBg || hasBorder || hasShadow;
      };

      const unbound = [];
      for (const el of Array.from(root.querySelectorAll('*'))) {
        if (el.closest('svg')) continue;
        const r = el.getBoundingClientRect();
        if (r.width * r.height < minBoxArea) continue;
        if (!visible(el)) continue;
        if (isBoundOrRelated(el)) continue;
        unbound.push({
          tag: el.tagName.toLowerCase(),
          cls: el.className && el.className.baseVal !== undefined ? el.className.baseVal : String(el.className || ''),
          text: (el.textContent || '').trim().slice(0, 40),
          area: Math.round(r.width * r.height),
        });
      }

      // Coverage: union area is expensive, so approximate with summed areas
      // clamped to the artboard. Good enough to catch "almost nothing is bound".
      const artboard = rootRect.width * rootRect.height;
      let boundArea = 0;
      for (const b of bound) {
        const r = b.getBoundingClientRect();
        boundArea += r.width * r.height;
      }
      return {
        targets: bound.length,
        unbound,
        coverage: Math.min(1, boundArea / artboard),
        debug: window.__animDebug || null,
      };
    }, cfg.minBoxArea);

    const errors = [];
    if (report.unbound.length) {
      errors.push(
        `${report.unbound.length} substantial content box(es) are never animated:\n` +
        report.unbound.map((u) => `    - ${u.tag}.${u.cls} (${u.area}px2) "${u.text}"`).join('\n'),
      );
    }
    if (report.coverage < cfg.minCoverage) {
      errors.push(`motion covers ${(report.coverage * 100).toFixed(0)}% of the artboard, below the ${(cfg.minCoverage * 100).toFixed(0)}% floor`);
    }
    return { status: errors.length ? 'fail' : 'pass', errors, ...report };
  } finally {
    await browser.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const htmlPath = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!htmlPath || !existsSync(htmlPath)) {
    console.error('Usage: node validate-motion-coverage.mjs <infographic.html>');
    process.exit(1);
  }
  const result = await validateMotionCoverage(htmlPath);
  console.log(JSON.stringify({ status: result.status, targets: result.targets, coverage: Number(result.coverage.toFixed(3)), errors: result.errors, unbound: result.unbound }, null, 2));
  process.exit(result.status === 'fail' ? 1 : 0);
}
