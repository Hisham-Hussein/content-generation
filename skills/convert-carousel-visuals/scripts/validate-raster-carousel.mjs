#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function slideFragment(html, id) {
  const start = html.search(new RegExp(`<div\\b[^>]*\\bid=["']${id}["'][^>]*>`, 'i'));
  if (start < 0) return null;
  const next = html.slice(start + 1).search(/<div\b[^>]*\bclass=["'][^"']*\binfographic\b/i);
  return next < 0 ? html.slice(start) : html.slice(start, start + next + 1);
}

export function validateRasterCarousel(html, manifest, baseDir) {
  const failures = [];
  const targets = manifest.targets;
  if (!Array.isArray(targets) || targets.length === 0) {
    failures.push('Conversion manifest contains no target slides');
  }
  for (const target of targets || []) {
    const fragment = slideFragment(html, target.slide_id);
    if (!fragment) {
      failures.push(`Missing target slide ${target.slide_id}`);
      continue;
    }
    if (/<svg\b/i.test(fragment)) failures.push(`${target.slide_id} still contains authored SVG markup`);
    if (!new RegExp(`<img\\b[^>]*\\bclass=["'][^"']*\\bv2-raster-infographic\\b`, 'i').test(fragment)) {
      failures.push(`${target.slide_id} has no v2-raster-infographic image`);
    }
    const asset = target.final_asset && path.resolve(baseDir, target.final_asset);
    if (!asset || !fs.existsSync(asset)) failures.push(`${target.slide_id} final asset is missing: ${target.final_asset}`);
  }
  if (manifest.source_carousel && manifest.source_sha256 && fs.existsSync(manifest.source_carousel)) {
    const current = sha256(fs.readFileSync(manifest.source_carousel, 'utf8'));
    if (current !== manifest.source_sha256) failures.push('Source carousel changed after variant creation');
  }
  return { status: failures.length ? 'fail' : 'pass', failures };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [htmlPath, manifestPath] = process.argv.slice(2);
  if (!htmlPath || !manifestPath) {
    console.error('Usage: node validate-raster-carousel.mjs <carousel.html> <conversion-manifest.json>');
    process.exit(1);
  }
  const html = fs.readFileSync(path.resolve(htmlPath), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.resolve(manifestPath), 'utf8'));
  const result = validateRasterCarousel(html, manifest, path.dirname(path.resolve(htmlPath)));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'pass' ? 0 : 1);
}
