#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function rebaseLocalReferences(html, sourceDir, outputDir) {
  return html.replace(/\b(src|href)=(['"])([^'"]+)\2/gi, (whole, attr, quote, value) => {
    if (/^(?:[a-z]+:|\/|#)/i.test(value)) return whole;
    const target = path.resolve(sourceDir, value);
    if (!fs.existsSync(target)) return whole;
    const rebased = path.relative(outputDir, target).split(path.sep).join('/') || '.';
    return `${attr}=${quote}${rebased}${quote}`;
  });
}

export function createVariant(sourceHtmlPath, outputDir) {
  const source = path.resolve(sourceHtmlPath);
  const output = path.resolve(outputDir);
  if (!fs.existsSync(source)) throw new Error(`Source carousel not found: ${source}`);
  if (fs.existsSync(output)) throw new Error(`Output folder already exists: ${output}`);
  const original = fs.readFileSync(source, 'utf8');
  fs.mkdirSync(output, { recursive: true });
  fs.mkdirSync(path.join(output, 'images'));
  const rebased = rebaseLocalReferences(original, path.dirname(source), output);
  const outputHtml = path.join(output, 'carousel.html');
  fs.writeFileSync(outputHtml, rebased);
  const manifest = {
    source_carousel: source,
    source_sha256: sha256(original),
    variant_carousel: outputHtml,
    targets: [],
  };
  fs.writeFileSync(path.join(output, 'conversion-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [source, output] = process.argv.slice(2);
  if (!source || !output) {
    console.error('Usage: node create-carousel-variant.mjs <source-carousel.html> <output-folder>');
    process.exit(1);
  }
  try {
    console.log(JSON.stringify(createVariant(source, output), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
