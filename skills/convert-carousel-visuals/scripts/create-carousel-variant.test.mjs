import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createVariant } from './create-carousel-variant.mjs';

test('copies a carousel, rebases existing relative assets, and preserves the source', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'carousel-variant-'));
  const sourceDir = path.join(root, 'bundle');
  const assetDir = path.join(root, 'assets');
  fs.mkdirSync(sourceDir);
  fs.mkdirSync(assetDir);
  fs.writeFileSync(path.join(assetDir, 'logo.png'), 'asset');
  const source = path.join(sourceDir, 'carousel.html');
  const original = '<img src="../assets/logo.png"><a href="https://example.com">x</a>';
  fs.writeFileSync(source, original);
  const variant = createVariant(source, path.join(sourceDir, 'carousel-v2'));
  assert.equal(fs.readFileSync(source, 'utf8'), original);
  assert.match(fs.readFileSync(variant.variant_carousel, 'utf8'), /src="\.\.\/\.\.\/assets\/logo\.png"/);
  assert.match(fs.readFileSync(variant.variant_carousel, 'utf8'), /https:\/\/example\.com/);
  assert.ok(fs.existsSync(path.join(sourceDir, 'carousel-v2', 'images')));
  assert.deepEqual(variant.targets, []);
});
