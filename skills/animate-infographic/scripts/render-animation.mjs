/**
 * Animated-infographic render driver (Option A: deterministic seek-loop).
 *
 * Output format is an animated GIF — LinkedIn plays uploaded GIFs inline in the
 * feed, so a GIF needs no video-post treatment, no thumbnail selection and no
 * tap-to-play. See references/animation-render-workflow.md.
 *
 * Pipeline:
 *   1. ffmpeg/ffprobe preflight (gif encoder + palettegen/paletteuse, or stop).
 *   2. Resolve machine-level Playwright + Chromium (reuse, never auto-install).
 *   3. Load the validated static infographic.html at 1080x1350 @ DSF2.
 *   4. Self-derive layout readiness: fonts.ready + SVG rect geometry stable
 *      across 2 rAFs (the static getBBox one-shot has settled). No blind delay.
 *   5. Re-run the sibling post-render bounds validator on the settled static
 *      composition (it must still pass before we animate it).
 *   6. Inject the deterministic motion layer (buildInjectionScript) and drive
 *      window.__seek(t) per frame, screenshotting JPEG frames (supersampled).
 *   7. Export poster.png = the final settled frame (static still / QA anchor).
 *   8. ffmpeg two-pass palette encode (palettegen -> paletteuse), walking a
 *      quality ladder until the GIF fits the size budget. The trailing hold is
 *      the muxer's -final_delay, not cloned frames.
 *   9. Probe the output, write animation-manifest.yaml, clean temp frames.
 *
 * Usage:
 *   node render-animation.mjs <infographic.html> [--out <dir>] [--fast]
 *                             [--max-mb <n>] [--width <px>]
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { buildInjectionScript, TIMELINE_CONFIG } from './inject-timeline.mjs';
import { validatePostRenderOnPage } from '../../generate-infographic/scripts/validate-post-render.mjs';

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;
const DEVICE_SCALE = 2;

// GIF stores per-frame delays in CENTISECONDS, so only frame rates that divide
// 100 evenly survive the round-trip without drift. 30fps (33.33ms) quantises to
// 3cs and plays ~10% fast; 25 (4cs), 20 (5cs) and 12.5 (8cs) are exact.
// TIMELINE_CONFIG.fps is therefore NOT used for capture here.
// 20fps (5cs) rather than 25 (4cs): this choreography is slow drifting motion,
// which does not need the extra temporal resolution, and the guide orb's halo is
// a large changing rectangle every frame — the one thing GIF cannot compress.
// Dropping 25->20 cut post 61 from 5.1MB to ~4MB at no visible cost.
const GIF_FPS = 20;
const GIF_FAST_FPS = 10;

// GIF has no inter-frame motion compensation, so a full-res true-colour build is
// far heavier than the equivalent H.264. The encoder walks this ladder (best
// first) until the file fits the size budget. Every fps must divide 100.
const GIF_LADDER = [
  { width: 1080, colors: 256, fps: 20 },
  { width: 1080, colors: 160, fps: 20 },
  { width: 900, colors: 128, fps: 20 },
  { width: 800, colors: 128, fps: 12.5 },
  { width: 720, colors: 96, fps: 12.5 },
];

// Guardrail, not a documented LinkedIn limit — re-check LinkedIn's current image
// upload limits before publishing for a new tenant. Override with --max-mb.
const DEFAULT_MAX_MB = 8;

// Ordered dither pattern: quiet on flat brand fills and it compresses far better
// than error-diffusion (sierra2_4a), which sprays per-frame noise into LZW.
const GIF_DITHER = 'bayer:bayer_scale=3';

function gifHeight(width) {
  return Math.round((width * CANVAS_HEIGHT) / CANVAS_WIDTH);
}

// ---------------------------------------------------------------------------
// ffmpeg / ffprobe preflight — a system ffmpeg with the gif muxer and the
// palettegen/paletteuse filters is mandatory (the Playwright bundled binary is
// VP8/WebM-only, has no gif muxer and ships no ffprobe). Stop, never fall back.
// ---------------------------------------------------------------------------
export function detectFfmpeg() {
  let encoders;
  try {
    encoders = execFileSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8' });
  } catch (e) {
    throw new Error(
      'ffmpeg not found on PATH. Install it: sudo apt-get install -y ffmpeg\n' +
      '(The Playwright-bundled ffmpeg is VP8/WebM-only, has no GIF muxer and ships no ffprobe.)',
    );
  }
  if (!/^\s*V\S*\s+gif\s/m.test(encoders)) {
    throw new Error('ffmpeg on PATH lacks the gif encoder. Install a full build: sudo apt-get install -y ffmpeg');
  }
  let filters;
  try {
    filters = execFileSync('ffmpeg', ['-hide_banner', '-filters'], { encoding: 'utf8' });
  } catch (e) {
    throw new Error('ffmpeg -filters failed; install a full build: sudo apt-get install -y ffmpeg');
  }
  for (const f of ['palettegen', 'paletteuse']) {
    if (!new RegExp(`\\b${f}\\b`).test(filters)) {
      throw new Error(`ffmpeg on PATH lacks the ${f} filter (needed for the two-pass GIF palette). Install: sudo apt-get install -y ffmpeg`);
    }
  }
  try {
    execFileSync('ffprobe', ['-hide_banner', '-version'], { encoding: 'utf8' });
  } catch (e) {
    throw new Error('ffprobe not found on PATH (needed for output validation). Install: sudo apt-get install -y ffmpeg');
  }
  return { ffmpeg: 'ffmpeg', ffprobe: 'ffprobe' };
}

/**
 * Two-pass palette GIF encode for one ladder step. Returns the byte size.
 *
 * Pass 1 builds an optimal palette (stats_mode=diff weights the moving regions,
 * which is what a build-on animation actually needs). Pass 2 maps frames onto it
 * with diff_mode=rectangle so only the changed rectangle of each frame is
 * stored. The hold is `-final_delay` on the last frame — cloning frames for it
 * would cost real bytes and buy nothing.
 */
function encodeGifStep({ framesDir, captureFps, step, gifPath, palettePath, holdMs }) {
  const height = gifHeight(step.width);
  const decimate = step.fps < captureFps ? `fps=${step.fps},` : '';
  const chain = `${decimate}scale=${step.width}:${height}:flags=lanczos`;
  const framePattern = path.join(framesDir, 'f-%05d.jpg');

  execFileSync('ffmpeg', [
    '-y', '-framerate', String(captureFps), '-i', framePattern,
    '-vf', `${chain},palettegen=stats_mode=diff:max_colors=${step.colors}`,
    '-update', '1', palettePath,
  ], { stdio: 'pipe' });

  execFileSync('ffmpeg', [
    '-y', '-framerate', String(captureFps), '-i', framePattern, '-i', palettePath,
    '-lavfi', `${chain}[s];[s][1:v]paletteuse=dither=${GIF_DITHER}:diff_mode=rectangle`,
    '-loop', '0', '-final_delay', String(Math.round(holdMs / 10)),
    gifPath,
  ], { stdio: 'pipe' });

  return { width: step.width, height, bytes: statSync(gifPath).size };
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
  const fps = fast ? GIF_FAST_FPS : GIF_FPS;
  const scale = fast ? 1 : DEVICE_SCALE;
  const outDir = opts.outDir || path.dirname(path.resolve(htmlPath));
  const maxBytes = Math.round((opts.maxMb || DEFAULT_MAX_MB) * 1024 * 1024);

  // Ladder steps can never out-run the captured frame rate, and --width pins the
  // top step so the ladder only ever steps DOWN from what the caller asked for.
  const ladder = GIF_LADDER
    .filter((s) => !opts.width || s.width <= opts.width)
    .map((s) => ({ ...s, fps: Math.min(s.fps, fps) }));
  if (opts.width && ladder.length === 0) {
    throw new Error(`--width ${opts.width} is below the smallest ladder step (${GIF_LADDER[GIF_LADDER.length - 1].width}px).`);
  }

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

    // Poster = final settled frame (PNG). Static still + QA anchor; a GIF has no
    // separately-uploadable thumbnail, so this is not a LinkedIn upload asset.
    await page.evaluate((tt) => window.__seek(tt), ready.lastEndMs);
    const posterPath = path.join(outDir, 'poster.png');
    await page.screenshot({ path: posterPath, clip, type: 'png', animations: 'disabled' });

    await browser.close();

    // Encode: walk the quality ladder until the GIF fits the size budget.
    const gifPath = path.join(outDir, 'animation.gif');
    const palettePath = path.join(framesDir, 'palette.png');
    let chosen = null;
    const attempts = [];
    for (const step of ladder) {
      const res = encodeGifStep({ framesDir, captureFps: fps, step, gifPath, palettePath, holdMs: ready.holdMs });
      attempts.push({ ...step, bytes: res.bytes });
      if (res.bytes <= maxBytes) { chosen = { ...step, ...res }; break; }
    }
    if (!chosen) {
      const last = attempts[attempts.length - 1];
      throw new Error(
        `GIF is still ${(last.bytes / 1024 / 1024).toFixed(1)}MB at the smallest ladder step ` +
        `(${last.width}px / ${last.colors} colors / ${last.fps}fps), over the ${(maxBytes / 1024 / 1024).toFixed(1)}MB budget.\n` +
        'Shorten the build in TIMELINE_CONFIG (fewer staggered tracks / shorter reveals), or raise the budget with --max-mb.',
      );
    }

    // Probe the actual file — frame count and duration are counted, not assumed.
    const probe = JSON.parse(execFileSync(ffprobe, [
      '-v', 'error', '-select_streams', 'v:0', '-count_frames',
      '-show_entries', 'stream=codec_name,width,height,pix_fmt,nb_read_frames:format=duration,size',
      '-of', 'json', gifPath,
    ], { encoding: 'utf8' }));
    const stream = probe.streams[0];
    const duration = parseFloat(probe.format.duration);

    manifest = {
      source_html: path.resolve(htmlPath),
      outputs: { gif: gifPath, poster: posterPath },
      render_method: 'playwright-chromium-seek-loop',
      capture_fps: fps, supersample: scale, captured_frames: frameCount,
      capture_end_ms: ready.lastEndMs, hold_ms: ready.holdMs,
      codec: stream.codec_name,
      gif_fps: chosen.fps, max_colors: chosen.colors, dither: GIF_DITHER,
      ladder_steps_tried: attempts.length,
      width: stream.width, height: stream.height,
      gif_frames: Number(stream.nb_read_frames),
      duration_sec: Number(duration.toFixed(3)),
      size_bytes: chosen.bytes,
      size_mb: Number((chosen.bytes / 1024 / 1024).toFixed(2)),
      size_budget_mb: Number((maxBytes / 1024 / 1024).toFixed(2)),
      loop: 'infinite',
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
  const flagValue = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  // A flag's value is not a positional arg.
  const flagValues = new Set(['--out', '--max-mb', '--width'].map(flagValue).filter(Boolean));
  const htmlPath = args.find((a) => !a.startsWith('--') && !flagValues.has(a));
  if (!htmlPath || !existsSync(htmlPath)) {
    console.error('Usage: node render-animation.mjs <infographic.html> [--out <dir>] [--fast] [--max-mb <n>] [--width <px>]');
    process.exit(1);
  }
  const opts = {
    fast: args.includes('--fast'),
    outDir: flagValue('--out'),
    maxMb: flagValue('--max-mb') ? Number(flagValue('--max-mb')) : undefined,
    width: flagValue('--width') ? Number(flagValue('--width')) : undefined,
  };
  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });
  const manifest = await renderAnimation(htmlPath, opts);
  console.log(JSON.stringify(manifest, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.message || e); process.exit(1); });
}

export { renderAnimation };
