import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateInfographicHtml,
} from './validate-mobile-linkedin-infographic.mjs';

const validHtml = String.raw`
<!doctype html>
<html>
<body>
  <script type="application/json" id="mobile-linkedin-compliance">
    {
      "version": 1,
      "layout_profile": "single_idea_infographic",
      "artboard": { "width": 1080, "height": 1350 },
      "safe_padding": { "top": 80, "right": 80, "bottom": 80, "left": 80 },
      "font_scale": { "headline_px": 52, "section_px": 34, "body_px": 28, "caption_px": 24 },
      "content_block_count": 5,
      "cta_present": true,
      "primary_visual_system": "stat_poster"
    }
  </script>
  <section data-content-block="hero"></section>
  <section data-content-block="support"></section>
  <section data-content-block="evidence"></section>
  <section data-content-block="proof"></section>
  <section data-content-block="takeaway"></section>
  <section data-cta-block="true"></section>
</body>
</html>
`;

test('passes a compliant infographic contract', () => {
  const result = validateInfographicHtml(validHtml);
  assert.equal(result.status, 'pass');
  assert.equal(result.errors.length, 0);
});

test('fails when body text is below hard minimum', () => {
  const html = validHtml.replace('"body_px": 28', '"body_px": 20');
  const result = validateInfographicHtml(html);
  assert.equal(result.status, 'fail');
  assert.match(result.errors.join('\n'), /body_px/i);
});

test('fails when safe padding is below hard minimum', () => {
  const html = validHtml.replace('"left": 80', '"left": 56');
  const result = validateInfographicHtml(html);
  assert.equal(result.status, 'fail');
  assert.match(result.errors.join('\n'), /safe padding/i);
});

test('fails when too many content blocks are declared', () => {
  const html = validHtml.replace('"content_block_count": 5', '"content_block_count": 6');
  const result = validateInfographicHtml(html);
  assert.equal(result.status, 'fail');
  assert.match(result.errors.join('\n'), /content block/i);
});

test('fails when compliance block is missing', () => {
  const result = validateInfographicHtml('<html><body></body></html>');
  assert.equal(result.status, 'fail');
  assert.match(result.errors.join('\n'), /compliance/i);
});

test('override token downgrades hard validation to overridden', () => {
  const html = validHtml.replace('"body_px": 28', '"body_px": 20');
  const result = validateInfographicHtml(html, { overrideTokenPresent: true });
  assert.equal(result.status, 'overridden');
  assert.match(result.errors.join('\n'), /body_px/i);
});
