/**
 * Output validator for animated-infographic GIFs.
 *
 * Asserts the encoded file is LinkedIn-ready:
 *   - GIF89a signature (GIF87a has no animation extensions at all)
 *   - ffprobe reports codec_name=gif
 *   - 4:5 portrait aspect ratio, at least MIN_WIDTH wide (the render driver's
 *     size ladder is allowed to step the resolution down, so width is a floor,
 *     not an equality check)
 *   - more than one frame — i.e. it actually animates. A GIF that encoded
 *     cleanly from a broken motion layer is a single settled still, and every
 *     other check here would still pass.
 *   - the NETSCAPE2.0 application extension declares an infinite loop
 *   - file size within the upload budget
 *
 * Depends on the SAME PATH `ffprobe` as the encoder — there is no bundled
 * fallback, so it fails loudly if ffprobe is absent.
 *
 * Usage: node validate-animation-output.mjs <animation.gif> [--max-mb <n>]
 */

import { execFileSync } from 'node:child_process';
import { openSync, readSync, closeSync, existsSync, statSync } from 'node:fs';

const EXPECT = {
  codec: 'gif',
  aspect: 1080 / 1350, // 0.8 — 4:5 portrait
  aspectTolerance: 0.01,
  minWidth: 720,
  minFrames: 2,
  maxMb: 8, // guardrail, not a documented LinkedIn limit — see the QA checklist
};

/**
 * Reads the GIF's declared loop count.
 * Returns { animated: bool, loop: number|null } where loop 0 === infinite and
 * null means no NETSCAPE2.0 application extension is present (plays once).
 */
export function readGifLoop(gifPath) {
  const fd = openSync(gifPath, 'r');
  try {
    // The application extension sits right after the header + global colour
    // table (768 bytes max), so the first 4KB always covers it.
    const buf = Buffer.alloc(4096);
    const bytes = readSync(fd, buf, 0, buf.length, 0);
    const head = buf.subarray(0, bytes);
    const signature = head.subarray(0, 6).toString('latin1');
    const idx = head.indexOf('NETSCAPE2.0', 0, 'latin1');
    if (idx === -1) return { signature, loop: null };
    // ... 0x03 0x01 <loop uint16LE> 0x00
    if (head[idx + 11] !== 0x03 || head[idx + 12] !== 0x01) return { signature, loop: null };
    return { signature, loop: head.readUInt16LE(idx + 13) };
  } finally {
    closeSync(fd);
  }
}

export function validateAnimationOutput(gifPath, expect = EXPECT) {
  const exp = { ...EXPECT, ...expect };
  const errors = [];
  if (!existsSync(gifPath)) return { status: 'fail', errors: [`File not found: ${gifPath}`] };

  let probe;
  try {
    probe = JSON.parse(execFileSync('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0', '-count_frames',
      '-show_entries', 'stream=codec_name,width,height,nb_read_frames:format=duration',
      '-of', 'json', gifPath,
    ], { encoding: 'utf8' }));
  } catch (e) {
    return { status: 'fail', errors: ['ffprobe failed (install ffmpeg): ' + (e.message || e)] };
  }

  const s = (probe.streams && probe.streams[0]) || {};
  const duration = parseFloat(probe.format && probe.format.duration);
  const frames = Number(s.nb_read_frames);
  const bytes = statSync(gifPath).size;
  const sizeMb = bytes / 1024 / 1024;
  const { signature, loop } = readGifLoop(gifPath);
  const aspect = s.width && s.height ? s.width / s.height : NaN;

  if (signature !== 'GIF89a') errors.push(`signature ${signature} != GIF89a (GIF87a cannot animate)`);
  if (s.codec_name !== exp.codec) errors.push(`codec ${s.codec_name} != ${exp.codec}`);
  if (!(Math.abs(aspect - exp.aspect) <= exp.aspectTolerance)) {
    errors.push(`aspect ${s.width}x${s.height} (${aspect.toFixed(3)}) != 4:5 (${exp.aspect})`);
  }
  if (!(s.width >= exp.minWidth)) errors.push(`width ${s.width} < ${exp.minWidth} minimum`);
  if (!(frames >= exp.minFrames)) errors.push(`${frames} frame(s) — the GIF is a still, not an animation`);
  if (loop === null) errors.push('no NETSCAPE2.0 loop extension (GIF plays once); encode with -loop 0');
  else if (loop !== 0) errors.push(`loop count ${loop} != 0 (infinite)`);
  if (!(sizeMb <= exp.maxMb)) errors.push(`size ${sizeMb.toFixed(1)}MB > ${exp.maxMb}MB budget`);

  return {
    status: errors.length ? 'fail' : 'pass',
    errors,
    probed: {
      codec: s.codec_name, width: s.width, height: s.height,
      frames, duration_sec: duration, loop, size_mb: Number(sizeMb.toFixed(2)),
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const maxIdx = args.indexOf('--max-mb');
  const maxMb = maxIdx >= 0 ? Number(args[maxIdx + 1]) : undefined;
  const gifPath = args.find((a, i) => !a.startsWith('--') && !(maxIdx >= 0 && i === maxIdx + 1));
  if (!gifPath) { console.error('Usage: node validate-animation-output.mjs <animation.gif> [--max-mb <n>]'); process.exit(1); }
  const result = validateAnimationOutput(gifPath, maxMb ? { maxMb } : undefined);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'fail' ? 1 : 0);
}
