/**
 * Output validator for animated-infographic MP4s.
 *
 * Asserts the encoded file is LinkedIn-ready:
 *   - container stream is H.264 (codec_name=h264)
 *   - pixel format is yuv420p (broad player/LinkedIn compatibility)
 *   - dimensions are exactly 1080x1350 (4:5 portrait)
 *   - duration >= 3s (LinkedIn feed-video minimum)
 *   - moov atom precedes mdat (i.e. -movflags +faststart took effect)
 *
 * Depends on the SAME PATH `ffprobe` as the encoder — there is no bundled
 * fallback, so it fails loudly if ffprobe is absent.
 *
 * Usage: node validate-animation-output.mjs <animation.mp4>
 */

import { execFileSync } from 'node:child_process';
import { openSync, readSync, closeSync, existsSync } from 'node:fs';

const EXPECT = { codec: 'h264', pixFmt: 'yuv420p', width: 1080, height: 1350, minDurationSec: 3 };

/** Returns true if the moov atom appears before mdat in the file head. */
function hasFaststart(mp4Path) {
  const fd = openSync(mp4Path, 'r');
  try {
    const buf = Buffer.alloc(Math.min(1024 * 1024, 4 * 1024 * 1024));
    const bytes = readSync(fd, buf, 0, buf.length, 0);
    const head = buf.subarray(0, bytes);
    const moov = head.indexOf('moov');
    const mdat = head.indexOf('mdat');
    if (moov === -1) return false; // moov not in head -> not faststart
    if (mdat === -1) return true; // moov found, mdat further in -> faststart
    return moov < mdat;
  } finally {
    closeSync(fd);
  }
}

export function validateAnimationOutput(mp4Path, expect = EXPECT) {
  const errors = [];
  if (!existsSync(mp4Path)) return { status: 'fail', errors: [`File not found: ${mp4Path}`] };

  let probe;
  try {
    probe = JSON.parse(execFileSync('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name,width,height,pix_fmt:format=duration',
      '-of', 'json', mp4Path,
    ], { encoding: 'utf8' }));
  } catch (e) {
    return { status: 'fail', errors: ['ffprobe failed (install ffmpeg): ' + (e.message || e)] };
  }

  const s = (probe.streams && probe.streams[0]) || {};
  const duration = parseFloat(probe.format && probe.format.duration);

  if (s.codec_name !== expect.codec) errors.push(`codec ${s.codec_name} != ${expect.codec}`);
  if (s.pix_fmt !== expect.pixFmt) errors.push(`pix_fmt ${s.pix_fmt} != ${expect.pixFmt}`);
  if (s.width !== expect.width) errors.push(`width ${s.width} != ${expect.width}`);
  if (s.height !== expect.height) errors.push(`height ${s.height} != ${expect.height}`);
  if (!(duration >= expect.minDurationSec)) errors.push(`duration ${duration}s < ${expect.minDurationSec}s minimum`);
  if (!hasFaststart(mp4Path)) errors.push('moov atom not at front (missing +faststart)');

  return {
    status: errors.length ? 'fail' : 'pass',
    errors,
    probed: { codec: s.codec_name, pix_fmt: s.pix_fmt, width: s.width, height: s.height, duration_sec: duration },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mp4Path = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!mp4Path) { console.error('Usage: node validate-animation-output.mjs <animation.mp4>'); process.exit(1); }
  const result = validateAnimationOutput(mp4Path);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'fail' ? 1 : 0);
}
