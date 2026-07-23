import test from 'node:test';
import assert from 'node:assert/strict';
import { inventoryCarouselHtml } from './inventory-carousel-visuals.mjs';

test('inventories authored SVGs per carousel slide and reads their labels', () => {
  const html = `
    <div class="infographic" id="slide-1"><svg><text>5.4 to 3.3</text></svg></div>
    <div class="infographic daylight" id="slide-2"><div class="slide-viz"><svg><text>2x</text></svg></div></div>`;
  const result = inventoryCarouselHtml(html);
  assert.equal(result.slide_count, 2);
  assert.equal(result.authored_svg_count, 2);
  assert.deepEqual(result.slides[0].svgs[0].labels, ['5.4 to 3.3']);
  assert.deepEqual(result.slides[1].svgs[0].labels, ['2x']);
});

test('does not treat SVG image references as authored SVG elements', () => {
  const result = inventoryCarouselHtml('<div class="infographic" id="slide-1"><img src="logo.svg"></div>');
  assert.equal(result.authored_svg_count, 0);
});
