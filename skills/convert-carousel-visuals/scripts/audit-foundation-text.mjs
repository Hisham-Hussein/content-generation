#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function suspiciousText(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /[\p{L}\p{N}]/u.test(line))
    .filter((line) => line.replace(/[^\p{L}\p{N}]/gu, '').length >= 2);
}

export function auditWithTesseract(imagePaths, run = spawnSync) {
  const version = run('tesseract', ['--version'], { encoding: 'utf8' });
  if (version.status !== 0) {
    return {
      status: 'manual_required',
      failures: [],
      reason: 'Tesseract is unavailable; inspect every foundation at full resolution for accidental text, numbers, logos, and readable UI.'
    };
  }

  const failures = [];
  for (const imagePath of imagePaths) {
    if (!fs.existsSync(imagePath)) {
      failures.push(`${imagePath}: file is missing`);
      continue;
    }
    const result = run('tesseract', [imagePath, 'stdout', '--psm', '11'], { encoding: 'utf8' });
    if (result.status !== 0) {
      failures.push(`${imagePath}: OCR failed`);
      continue;
    }
    const found = suspiciousText(result.stdout || '');
    if (found.length) failures.push(`${imagePath}: possible generated text: ${found.join(' | ')}`);
  }
  return { status: failures.length ? 'fail' : 'pass', failures };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const imagePaths = process.argv.slice(2).map((value) => path.resolve(value));
  if (!imagePaths.length) {
    console.error('Usage: node audit-foundation-text.mjs <foundation.png> [foundation.png ...]');
    process.exit(1);
  }
  const result = auditWithTesseract(imagePaths);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'pass' ? 0 : result.status === 'manual_required' ? 2 : 1);
}
