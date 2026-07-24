#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function matchingDivFragment(html, start) {
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tags.exec(html))) {
    if (/^<\//.test(match[0])) depth -= 1;
    else depth += 1;
    if (depth === 0) return html.slice(start, tags.lastIndex);
  }
  return null;
}

function slideFragment(html, id) {
  const start = html.search(new RegExp(`<div\\b[^>]*\\bid=["']${id}["'][^>]*>`, 'i'));
  if (start < 0) return null;
  return matchingDivFragment(html, start);
}

function classDivFragment(html, className) {
  const pattern = new RegExp(`<div\\b[^>]*\\bclass=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, 'i');
  const start = html.search(pattern);
  return start < 0 ? null : matchingDivFragment(html, start);
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'));
  return match?.[1] ?? null;
}

function resolveAsset(baseDir, value) {
  return value ? path.resolve(baseDir, value) : null;
}

function isOlder(olderPath, newerPath) {
  return fs.statSync(olderPath).mtimeMs + 1 < fs.statSync(newerPath).mtimeMs;
}

export function validateRasterCarousel(html, manifest, baseDir) {
  const failures = [];
  const renderedSlides = [];
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

    const visual = classDivFragment(fragment, 'slide-viz');
    if (!visual) {
      failures.push(`${target.slide_id} has no slide-viz container`);
      continue;
    }
    const images = visual.match(/<img\b[^>]*>/gi) || [];
    const rasters = images.filter((tag) => /\bclass=["'][^"']*\bv2-raster-infographic\b/i.test(tag));
    if (rasters.length !== 1) {
      failures.push(`${target.slide_id} must contain exactly one v2-raster-infographic image; found ${rasters.length}`);
    }
    if (images.length !== 1) {
      failures.push(`${target.slide_id} slide-viz contains ${images.length} images; converted visuals must have one flattened content raster and no image overlays`);
    }
    const openingEnd = visual.indexOf('>') + 1;
    const closingStart = visual.toLowerCase().lastIndexOf('</div>');
    const inner = visual.slice(openingEnd, closingStart);
    const nonImageElements = [...inner.matchAll(/<([a-z][\w-]*)\b/gi)]
      .map((match) => match[1].toLowerCase())
      .filter((tag) => tag !== 'img');
    if (nonImageElements.length) {
      failures.push(`${target.slide_id} slide-viz contains non-raster content elements: ${[...new Set(nonImageElements)].join(', ')}`);
    }

    const rasterSrc = rasters.length === 1 ? attribute(rasters[0], 'src') : null;
    if (rasterSrc && target.final_asset) {
      const declared = path.normalize(target.final_asset);
      const embedded = path.normalize(rasterSrc);
      if (declared !== embedded) {
        failures.push(`${target.slide_id} raster src does not match final_asset: ${rasterSrc} != ${target.final_asset}`);
      }
    }

    const foundation = resolveAsset(baseDir, target.foundation_asset);
    if (target.foundation_asset && !fs.existsSync(foundation)) {
      failures.push(`${target.slide_id} foundation asset is missing: ${target.foundation_asset}`);
    }
    const asset = resolveAsset(baseDir, target.final_asset);
    if (!asset || !fs.existsSync(asset)) failures.push(`${target.slide_id} final asset is missing: ${target.final_asset}`);
    if (foundation && asset && fs.existsSync(foundation) && fs.existsSync(asset) && isOlder(asset, foundation)) {
      failures.push(`${target.slide_id} final asset is stale relative to its foundation`);
    }

    const rendered = resolveAsset(baseDir, target.rendered_slide);
    if (target.rendered_slide && !fs.existsSync(rendered)) {
      failures.push(`${target.slide_id} rendered slide is missing: ${target.rendered_slide}`);
    }
    if (rendered && fs.existsSync(rendered)) {
      renderedSlides.push(rendered);
      if (asset && fs.existsSync(asset) && isOlder(rendered, asset)) {
        failures.push(`${target.slide_id} rendered slide is stale relative to its final asset`);
      }
    }
  }

  const pdf = resolveAsset(baseDir, manifest.pdf);
  if (manifest.pdf && !fs.existsSync(pdf)) failures.push(`PDF is missing: ${manifest.pdf}`);
  if (pdf && fs.existsSync(pdf)) {
    for (const rendered of renderedSlides) {
      if (isOlder(pdf, rendered)) {
        failures.push(`PDF is stale relative to rendered slide: ${path.relative(baseDir, rendered)}`);
        break;
      }
    }
  }

  if (manifest.source_carousel && manifest.source_sha256 && fs.existsSync(manifest.source_carousel)) {
    const current = sha256(fs.readFileSync(manifest.source_carousel));
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
