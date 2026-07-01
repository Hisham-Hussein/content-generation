/**
 * Animated-infographic render driver (Option A: deterministic seek-loop).
 *
 * Pipeline:
 *   1. ffmpeg/ffprobe preflight (system libx264 build, or stop).
 *   2. Resolve machine-level Playwright + Chromium (reuse, never auto-install).
 *   3. Load the validated static infographic.html at 1080x1350 @ DSF2.
 *   4. Self-derive layout readiness: fonts.ready + SVG rect geometry stable
 *      across 2 rAFs (the static getBBox one-shot has settled). No blind delay.
 *   5. Re-run the sibling post-render bounds validator on the settled static
 *      composition (it must still pass before we animate it).
 *   6. Inject the deterministic motion layer (buildInjectionScript) and drive
 *      window.__seek(t) per frame, screenshotting JPEG frames (supersampled).
 *   7. Export poster.png = the final settled frame (for the LinkedIn thumbnail).
 *   8. ffmpeg: lanczos-downscale frames -> 1080x1350, clone-pad the final frame
 *      for the hold, encode H.264 yuv420p +faststart.
 *   9. Probe the output, write animation-manifest.yaml, clean temp frames.
 *
 * Usage:
 *   node render-animation.mjs <infographic.html> [--out <dir>] [--fast]
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { buildInjectionScript, TIMELINE_CONFIG } from './inject-timeline.mjs';
import { validatePostRenderOnPage } from '../../generate-infographic/scripts/validate-post-render.mjs';

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;
const DEVICE_SCALE = 2;

// ---------------------------------------------------------------------------
// ffmpeg / ffprobe preflight — system libx264 build is mandatory (the Playwright
// bundled binary is VP8/WebM-only and ships no ffprobe). Stop, never fall back.
// ---------------------------------------------------------------------------
export function detectFfmpeg() {
  let encoders;
  try {
    encoders = execFileSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8' });
  } catch (e) {
    throw new Error(
      'ffmpeg not found on PATH. Install it: sudo apt-get install -y ffmpeg\n' +
      '(The Playwright-bundled ffmpeg is VP8/WebM-only and cannot produce LinkedIn H.264.)',
    );
  }
  if (!/\blibx264\b/.test(encoders)) {
    throw new Error('ffmpeg on PATH lacks libx264. Install a full build: sudo apt-get install -y ffmpeg');
  }
  try {
    execFileSync('ffprobe', ['-hide_banner', '-version'], { encoding: 'utf8' });
  } catch (e) {
    throw new Error('ffprobe not found on PATH (needed for output validation). Install: sudo apt-get install -y ffmpeg');
  }
  return { ffmpeg: 'ffmpeg', ffprobe: 'ffprobe' };
}

async function resolvePlaywright() {
  // Bare specifiers first (works when run with node_modules/NODE_PATH in scope),
  // then absolute machine-level locations (global @playwright/cli, npx cache).
  const candidates = ['playwright', '@playwright/cli/node_modules/playwright'];
  const home = process.env.HOME || '';
  const globs = [
    path.join(home, '.nvm/versions/node'),
    path.join(home, '.npm/_npx'),
  ];
  for (const base of globs) {
    try {
      for (const entry of readdirSync(base)) {
        // ESM entry is index.mjs (the package's "import" condition); index.js is CJS
        // and does NOT expose chromium as a named export.
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
      if (mod && (mod.chromium || (mod.default && mod.default.chromium))) {
        return mod.chromium ? mod : mod.default;
      }
    } catch {}
  }
  throw new Error('Playwright not found. Reuse an existing machine-level install or `npm i -g @playwright/cli`.');
}

/** Poll until SVG rect geometry stops changing across 2 consecutive rAFs. */
async function waitForLayoutStable(page) {
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
    const sig = () => Array.prototype.slice
      .call(document.querySelectorAll('.infographic svg rect, .infographic svg text'))
      .map((el) => {
        try { const b = el.getBBox(); return Math.round(b.x) + ':' + Math.round(b.y) + ':' + Math.round(b.width) + ':' + Math.round(b.height); }
        catch (e) { return 'x'; }
      }).join('|');
    const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
    let last = sig();
    let stableFrames = 0;
    for (let i = 0; i < 120 && stableFrames < 2; i++) {
      await raf();
      const now = sig();
      if (now === last) stableFrames++; else { stableFrames = 0; last = now; }
    }
  });
}

function frameName(i) {
  return 'f-' + String(i).padStart(5, '0') + '.jpg';
}

async function renderAnimation(htmlPath, opts = {}) {
  const fast = !!opts.fast;
  const fps = fast ? 24 : TIMELINE_CONFIG.fps;
  const scale = fast ? 1 : DEVICE_SCALE;
  const outDir = opts.outDir || path.dirname(path.resolve(htmlPath));

  const { ffprobe } = detectFfmpeg();
  const playwright = await resolvePlaywright();

  const framesDir = mkdtempSync(path.join(tmpdir(), 'anim-frames-'));
  const browser = await playwright.chromium.launch();
  let manifest;
  try {
    const page = await browser.newPage({ deviceScaleFactor: scale, viewport: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } });
    await page.goto(pathToFileURL(path.resolve(htmlPath)).href, { waitUntil: 'networkidle' });
    await waitForLayoutStable(page);

    // Re-validate the settled static composition before animating it.
    const postRender = await validatePostRenderOnPage(page);
    if (postRender.status === 'fail') {
      throw new Error('Static infographic fails post-render bounds check; fix it before animating:\n' + postRender.errors.join('\n'));
    }

    // Install the deterministic motion layer.
    await page.evaluate(buildInjectionScript(TIMELINE_CONFIG));
    const ready = await page.evaluate(() => ({
      ready: !!window.__animReady,
      lastEndMs: window.__animLastEndMs,
      holdMs: window.__animHoldMs,
      err: window.__animError || null,
    }));
    if (!ready.ready) throw new Error('Motion layer failed to bind: ' + (ready.err || 'unknown'));

    const box = await page.evaluate(() => {
      const el = document.querySelector('.infographic');
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    const clip = { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };

    const frameMs = 1000 / fps;
    const frameCount = Math.ceil(ready.lastEndMs / frameMs) + 1;
    for (let i = 0; i < frameCount; i++) {
      const t = Math.min(i * frameMs, ready.lastEndMs);
      await page.evaluate((tt) => window.__seek(tt), t);
      await page.screenshot({ path: path.join(framesDir, frameName(i)), clip, type: 'jpeg', quality: 100, animations: 'disabled' });
    }

    // Poster = final settled frame (PNG, for the thumbnail).
    await page.evaluate((tt) => window.__seek(tt), ready.lastEndMs);
    const posterPath = path.join(outDir, 'poster.png');
    await page.screenshot({ path: posterPath, clip, type: 'png', animations: 'disabled' });

    await browser.close();

    // Stitch: lanczos downscale -> hold-pad -> H.264 yuv420p +faststart.
    const holdSec = (ready.holdMs / 1000).toFixed(3);
    const mp4Path = path.join(outDir, 'animation.mp4');
    const vf = `scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:flags=lanczos,tpad=stop_mode=clone:stop_duration=${holdSec}`;
    execFileSync('ffmpeg', [
      '-y', '-framerate', String(fps), '-i', path.join(framesDir, 'f-%05d.jpg'),
      '-vf', vf, '-c:v', 'libx264', '-preset', fast ? 'medium' : 'slow', '-crf', '18',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(fps), mp4Path,
    ], { stdio: 'pipe' });

    const probe = JSON.parse(execFileSync(ffprobe, [
      '-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name,width,height,pix_fmt:format=duration',
      '-of', 'json', mp4Path,
    ], { encoding: 'utf8' }));
    const stream = probe.streams[0];
    const duration = parseFloat(probe.format.duration);

    manifest = {
      source_html: path.resolve(htmlPath),
      outputs: { mp4: mp4Path, poster: posterPath },
      render_method: 'playwright-chromium-seek-loop',
      fps, supersample: scale, frame_count: frameCount,
      capture_end_ms: ready.lastEndMs, hold_ms: ready.holdMs,
      codec: stream.codec_name, pix_fmt: stream.pix_fmt,
      width: stream.width, height: stream.height,
      duration_sec: Number(duration.toFixed(3)),
      faststart: true,
      motion: ['block-reveal', 'svg-fill-reveal', 'svg-stroke-draw-on', 'accent-emphasis'],
      post_render_revalidated: postRender.status,
    };
    writeFileSync(path.join(outDir, 'animation-manifest.yaml'), toYaml(manifest));
  } finally {
    try { await browser.close(); } catch {}
    rmSync(framesDir, { recursive: true, force: true });
  }
  return manifest;
}

function toYaml(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  let out = '';
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      out += `${pad}${k}:\n` + v.map((x) => `${pad}  - ${x}`).join('\n') + '\n';
    } else if (v && typeof v === 'object') {
      out += `${pad}${k}:\n` + toYaml(v, indent + 1);
    } else {
      out += `${pad}${k}: ${v}\n`;
    }
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const htmlPath = args.find((a) => !a.startsWith('--'));
  if (!htmlPath || !existsSync(htmlPath)) {
    console.error('Usage: node render-animation.mjs <infographic.html> [--out <dir>] [--fast]');
    process.exit(1);
  }
  const outIdx = args.indexOf('--out');
  const opts = { fast: args.includes('--fast'), outDir: outIdx >= 0 ? args[outIdx + 1] : undefined };
  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });
  const manifest = await renderAnimation(htmlPath, opts);
  console.log(JSON.stringify(manifest, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.message || e); process.exit(1); });
}

export { renderAnimation };
