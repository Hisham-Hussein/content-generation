import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateRasterCarousel } from './validate-raster-carousel.mjs';

test('passes when a target slide has a raster image and final asset', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'raster-validation-'));
  fs.mkdirSync(path.join(root, 'images'));
  fs.writeFileSync(path.join(root, 'images', 'slide-02.png'), 'png');
  const html = '<div class="infographic" id="slide-2"><img class="v2-raster-infographic" src="images/slide-02.png"></div>';
  const result = validateRasterCarousel(html, { targets: [{ slide_id: 'slide-2', final_asset: 'images/slide-02.png' }] }, root);
  assert.equal(result.status, 'pass');
});

test('fails when SVG markup remains in a target slide', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'raster-validation-'));
  fs.mkdirSync(path.join(root, 'images'));
  fs.writeFileSync(path.join(root, 'images', 'slide-02.png'), 'png');
  const html = '<div class="infographic" id="slide-2"><svg></svg><img class="v2-raster-infographic" src="images/slide-02.png"></div>';
  const result = validateRasterCarousel(html, { targets: [{ slide_id: 'slide-2', final_asset: 'images/slide-02.png' }] }, root);
  assert.equal(result.status, 'fail');
  assert.match(result.failures.join('\n'), /SVG/i);
});

test('fails when the manifest has no explicit conversion targets', () => {
  const result = validateRasterCarousel('<div class="infographic" id="slide-2"></div>', { targets: [] }, process.cwd());
  assert.equal(result.status, 'fail');
  assert.match(result.failures.join('\n'), /no target slides/i);
});
