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
  const html = '<div class="infographic" id="slide-2"><div class="slide-viz"><img class="v2-raster-infographic" src="images/slide-02.png"></div></div>';
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

test('fails when a converted visual retains a separate image overlay', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'raster-validation-'));
  fs.mkdirSync(path.join(root, 'images'));
  fs.writeFileSync(path.join(root, 'images', 'slide-02.png'), 'png');
  const html = [
    '<div class="infographic" id="slide-2">',
    '<div class="slide-viz">',
    '<img class="v2-raster-infographic" src="images/slide-02.png">',
    '<img class="provider-logo" src="logo.svg">',
    '</div>',
    '</div>'
  ].join('');
  const result = validateRasterCarousel(
    html,
    { targets: [{ slide_id: 'slide-2', final_asset: 'images/slide-02.png' }] },
    root
  );
  assert.equal(result.status, 'fail');
  assert.match(result.failures.join('\n'), /image overlays/i);
});

test('fails when a converted visual retains an annotation element', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'raster-validation-'));
  fs.mkdirSync(path.join(root, 'images'));
  fs.writeFileSync(path.join(root, 'images', 'slide-02.png'), 'png');
  const html = [
    '<div class="infographic" id="slide-2">',
    '<div class="slide-viz">',
    '<img class="v2-raster-infographic" src="images/slide-02.png">',
    '<span class="annotation">Exact number</span>',
    '</div>',
    '</div>'
  ].join('');
  const result = validateRasterCarousel(
    html,
    { targets: [{ slide_id: 'slide-2', final_asset: 'images/slide-02.png' }] },
    root
  );
  assert.equal(result.status, 'fail');
  assert.match(result.failures.join('\n'), /non-raster content elements/i);
});

test('allows footer and theme images outside the converted visual container', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'raster-validation-'));
  fs.mkdirSync(path.join(root, 'images'));
  fs.writeFileSync(path.join(root, 'images', 'slide-02.png'), 'png');
  const html = [
    '<div class="infographic" id="slide-2">',
    '<div class="slide-viz"><img class="v2-raster-infographic" src="images/slide-02.png"></div>',
    '<div class="author-footer"><img src="author.png"><img src="brand.png"></div>',
    '</div>'
  ].join('');
  const result = validateRasterCarousel(
    html,
    { targets: [{ slide_id: 'slide-2', final_asset: 'images/slide-02.png' }] },
    root
  );
  assert.equal(result.status, 'pass');
});

test('fails when the embedded raster src disagrees with the manifest', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'raster-validation-'));
  fs.mkdirSync(path.join(root, 'images'));
  fs.writeFileSync(path.join(root, 'images', 'declared.png'), 'png');
  const html = '<div class="infographic" id="slide-2"><div class="slide-viz"><img class="v2-raster-infographic" src="images/other.png"></div></div>';
  const result = validateRasterCarousel(
    html,
    { targets: [{ slide_id: 'slide-2', final_asset: 'images/declared.png' }] },
    root
  );
  assert.equal(result.status, 'fail');
  assert.match(result.failures.join('\n'), /does not match final_asset/i);
});

test('fails stale outputs from foundation through PDF', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'raster-validation-'));
  fs.mkdirSync(path.join(root, 'images', 'foundations'), { recursive: true });
  const foundation = path.join(root, 'images', 'foundations', 'slide-02.png');
  const finalAsset = path.join(root, 'images', 'slide-02.png');
  const rendered = path.join(root, 'slide-02.png');
  const pdf = path.join(root, 'carousel.pdf');
  for (const file of [foundation, finalAsset, rendered, pdf]) fs.writeFileSync(file, file);
  const now = Date.now() / 1000;
  fs.utimesSync(finalAsset, now - 40, now - 40);
  fs.utimesSync(foundation, now - 30, now - 30);
  fs.utimesSync(rendered, now - 20, now - 20);
  fs.utimesSync(pdf, now - 25, now - 25);
  const html = '<div class="infographic" id="slide-2"><div class="slide-viz"><img class="v2-raster-infographic" src="images/slide-02.png"></div></div>';
  const result = validateRasterCarousel(html, {
    targets: [{
      slide_id: 'slide-2',
      foundation_asset: 'images/foundations/slide-02.png',
      final_asset: 'images/slide-02.png',
      rendered_slide: 'slide-02.png'
    }],
    pdf: 'carousel.pdf'
  }, root);
  assert.equal(result.status, 'fail');
  assert.match(result.failures.join('\n'), /final asset is stale/i);
  assert.match(result.failures.join('\n'), /PDF is stale/i);
});
