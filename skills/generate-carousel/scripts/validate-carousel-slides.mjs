/**
 * validate-carousel-slides.mjs
 *
 * Programmatic validation for carousel slides inside a Playwright session.
 * Evaluates DOM bounding rects and SVG attribute values for every slide.
 *
 * Geometry checks:
 *   - Footer clipping (author-footer bottom within canvas)
 *   - Body→footer gap (slide-body bottom does not overlap author-footer top)
 *   - SVG clipping (SVG elements within viewBox and slide canvas)
 *   - Element overflow (no absolutely positioned element escapes 1080×1350)
 *   - Cross-slide layout variety (structural proxy — flags 8+ consecutive identical wrappers)
 *
 * SVG property checks (from the general carousel kit README — theme-agnostic):
 *   - SVG font-size floor: all SVG <text> must be >= 22px
 *   - SVG text opacity floor: white/neutral text >= 0.65, accent-colored text >= 0.85
 *   - SVG shape fill tier: reject 0.01–0.04 (CSS card-class), warn 0.05–0.19 without data-tier="container"
 *   - SVG text-to-container overflow: text getBBox must fit inside its nearest sibling rect
 *
 * Structural checks:
 *   - getBBox auto-sizing script presence: at least one <script> block must reference getBBox
 *
 * Usage:
 *   node scripts/validate-carousel-slides.mjs <html-path>
 *
 * Requires: PLAYWRIGHT_PATH and CHROMIUM_PATH env vars.
 *
 * Exit codes: 0 = all pass, 1 = validation failures found
 */

const path = await import('path');
const fs = await import('fs');

const playwrightPath = process.env.PLAYWRIGHT_PATH;
const chromiumPath = process.env.CHROMIUM_PATH;
const htmlPath = process.argv[2];

if (!htmlPath) {
  console.error('Usage: node validate-carousel-slides.mjs <html-path>');
  process.exit(1);
}

if (!playwrightPath || !chromiumPath) {
  console.error('Set PLAYWRIGHT_PATH and CHROMIUM_PATH env vars before running.');
  process.exit(1);
}

const resolvedHtml = path.default.resolve(htmlPath);
if (!fs.default.existsSync(resolvedHtml)) {
  console.error(`HTML file not found: ${resolvedHtml}`);
  process.exit(1);
}

const playwrightModule = await import(playwrightPath);
const playwright = playwrightModule.default || playwrightModule;

const SLIDE_WIDTH = 1080;
const SLIDE_HEIGHT = 1350;
const MIN_FOOTER_GAP = 16; // matches .slide-body margin-bottom from lessons learned

const browser = await playwright.chromium.launch({
  executablePath: chromiumPath,
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewportSize({ width: SLIDE_WIDTH, height: SLIDE_HEIGHT * 20 }); // tall viewport for all slides
await page.goto(`file://${resolvedHtml}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

const results = await page.evaluate(({ slideWidth, slideHeight, minFooterGap }) => {
  const slides = document.querySelectorAll('.infographic');
  const findings = [];

  slides.forEach((slide, idx) => {
    const slideNum = idx + 1;
    const slideRect = slide.getBoundingClientRect();
    const slideFindings = [];

    // --- Footer clipping ---
    const footer = slide.querySelector('.author-footer');
    if (!footer) {
      slideFindings.push({ check: 'footer-present', status: 'FAIL', detail: 'No .author-footer found' });
    } else {
      const footerRect = footer.getBoundingClientRect();
      const footerBottom = footerRect.bottom - slideRect.top;
      if (footerBottom > slideHeight) {
        slideFindings.push({
          check: 'footer-clipping',
          status: 'FAIL',
          detail: `Footer bottom at ${Math.round(footerBottom)}px exceeds canvas height ${slideHeight}px`,
        });
      } else {
        slideFindings.push({ check: 'footer-clipping', status: 'PASS' });
      }

      // --- Body→footer gap ---
      const body = slide.querySelector('.slide-body');
      if (body) {
        const bodyRect = body.getBoundingClientRect();
        const gap = footerRect.top - bodyRect.bottom;
        if (gap < minFooterGap) {
          slideFindings.push({
            check: 'body-footer-gap',
            status: 'FAIL',
            detail: `Body→footer gap is ${Math.round(gap)}px (minimum ${minFooterGap}px)`,
          });
        } else {
          slideFindings.push({ check: 'body-footer-gap', status: 'PASS' });
        }
      }
    }

    // --- SVG clipping (all SVGs in .slide-viz containers) ---
    const svgContainers = slide.querySelectorAll('.slide-viz');
    let svgClipFailed = false;
    svgContainers.forEach((container) => {
      container.querySelectorAll('svg').forEach((svg) => {
        const svgRect = svg.getBoundingClientRect();
        const svgRelativeBottom = svgRect.bottom - slideRect.top;
        const svgRelativeRight = svgRect.right - slideRect.left;
        if (svgRelativeBottom > slideHeight || svgRelativeRight > slideWidth) {
          svgClipFailed = true;
          slideFindings.push({
            check: 'svg-clipping',
            status: 'FAIL',
            detail: `SVG extends to (${Math.round(svgRelativeRight)}×${Math.round(svgRelativeBottom)}) vs canvas (${slideWidth}×${slideHeight})`,
          });
        }
      });
    });
    if (!svgClipFailed && svgContainers.length > 0) {
      slideFindings.push({ check: 'svg-clipping', status: 'PASS' });
    } else if (svgContainers.length === 0) {
      slideFindings.push({ check: 'svg-clipping', status: 'INFO', detail: 'No .slide-viz containers — SVG clipping not checked' });
    }

    // --- Element overflow (absolutely positioned) ---
    const allElements = slide.querySelectorAll('*');
    let overflowFound = false;
    allElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.position === 'absolute' || style.position === 'fixed') {
        const elRect = el.getBoundingClientRect();
        const relRight = elRect.right - slideRect.left;
        const relBottom = elRect.bottom - slideRect.top;
        if (relRight > slideWidth + 2 || relBottom > slideHeight + 2) {
          // Allow 2px tolerance for sub-pixel rendering
          overflowFound = true;
          slideFindings.push({
            check: 'element-overflow',
            status: 'FAIL',
            detail: `Positioned element overflows: class="${el.className}" at (${Math.round(relRight)}×${Math.round(relBottom)})`,
          });
        }
      }
    });
    if (!overflowFound) {
      slideFindings.push({ check: 'element-overflow', status: 'PASS' });
    }

    // --- Check A: SVG font-size floor (min 22px) ---
    const svgTexts = slide.querySelectorAll('svg text');
    let fontSizeFailed = false;
    svgTexts.forEach((textEl) => {
      const fs = parseFloat(textEl.getAttribute('font-size'));
      if (!isNaN(fs) && fs < 22) {
        fontSizeFailed = true;
        const content = (textEl.textContent || '').trim().substring(0, 30);
        slideFindings.push({
          check: 'svg-font-size',
          status: 'FAIL',
          detail: `SVG text "${content}" has font-size ${fs}px (minimum 22px)`,
        });
      }
    });
    if (!fontSizeFailed && svgTexts.length > 0) {
      slideFindings.push({ check: 'svg-font-size', status: 'PASS' });
    } else if (svgTexts.length === 0) {
      slideFindings.push({ check: 'svg-font-size', status: 'INFO', detail: 'No SVG text elements — font-size not checked' });
    }

    // --- Check B: SVG opacity tier compliance ---
    // Helper: parse rgba opacity from a fill string
    function parseRgbaOpacity(fill) {
      if (!fill || fill === 'none') return null;
      const m = fill.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/);
      if (!m) return null;
      return { r: parseFloat(m[1]), g: parseFloat(m[2]), b: parseFloat(m[3]), a: m[4] !== undefined ? parseFloat(m[4]) : 1.0 };
    }

    // Detect accent colors: cyan (146,230,253), red (239,68,68), green (34,197,94), yellow (234,179,8), blue (45,167,255)
    // White/neutral (242,242,243) must NOT match — r < 200 for cyan excludes it
    function isAccentColor(r, g, b) {
      return (r < 200 && g > 200 && b > 240) ||  // cyan (146,230,253)
             (r > 200 && g < 100 && b < 100) ||   // red (239,68,68)
             (r < 50 && g > 150 && b < 120) ||     // green (34,197,94)
             (r > 200 && g > 150 && b < 30) ||     // yellow (234,179,8)
             (r < 60 && g > 140 && b > 240);       // blue (45,167,255)
    }

    let opacityFailed = false;

    // Text opacity checks
    svgTexts.forEach((textEl) => {
      const fill = textEl.getAttribute('fill');
      const parsed = parseRgbaOpacity(fill);
      if (!parsed || parsed.a >= 0.99) return; // fully opaque is fine

      const intentionalFade = textEl.hasAttribute('data-intentional-fade');
      const content = (textEl.textContent || '').trim().substring(0, 30);

      if (isAccentColor(parsed.r, parsed.g, parsed.b)) {
        // Accent-colored text: must be >= 0.85
        if (parsed.a < 0.85) {
          opacityFailed = true;
          slideFindings.push({
            check: 'svg-text-opacity',
            status: 'FAIL',
            detail: `Accent text "${content}" opacity ${parsed.a} (minimum 0.85 for accent colors)`,
          });
        }
      } else {
        // White/neutral text: must be >= 0.65 (or >= 0.50 with data-intentional-fade)
        const floor = intentionalFade ? 0.50 : 0.65;
        if (parsed.a < floor) {
          opacityFailed = true;
          slideFindings.push({
            check: 'svg-text-opacity',
            status: 'FAIL',
            detail: `Text "${content}" opacity ${parsed.a} (minimum ${floor}${intentionalFade ? ' with intentional-fade' : ''})`,
          });
        }
      }
    });

    // Shape fill opacity checks
    const svgShapes = slide.querySelectorAll('svg rect, svg circle, svg polygon, svg ellipse');
    svgShapes.forEach((shapeEl) => {
      const fill = shapeEl.getAttribute('fill');
      const parsed = parseRgbaOpacity(fill);
      if (!parsed || parsed.a >= 0.99 || parsed.a === 0) return;

      const tier = shapeEl.getAttribute('data-tier');

      // Hard reject: CSS card-class range (0.01–0.04)
      if (parsed.a >= 0.01 && parsed.a <= 0.04) {
        opacityFailed = true;
        const tag = shapeEl.tagName;
        slideFindings.push({
          check: 'svg-shape-opacity',
          status: 'FAIL',
          detail: `<${tag}> fill opacity ${parsed.a} is in CSS card-class range (0.01–0.04) — SVG has no backdrop-filter`,
        });
      }
      // Warn: 0.05–0.19 without data-tier="container"
      else if (parsed.a >= 0.05 && parsed.a <= 0.19 && tier !== 'container') {
        slideFindings.push({
          check: 'svg-shape-opacity',
          status: 'WARN',
          detail: `<${shapeEl.tagName}> fill opacity ${parsed.a} is in container range (0.05–0.19) but lacks data-tier="container" — verify this is not a content-tier element`,
        });
      }
    });

    if (!opacityFailed && (svgTexts.length > 0 || svgShapes.length > 0)) {
      slideFindings.push({ check: 'svg-opacity-tier', status: 'PASS' });
    }

    // --- Check C: SVG text-to-container overflow ---
    let textOverflowFailed = false;
    svgTexts.forEach((textEl) => {
      try {
        const textBox = textEl.getBBox();
        // Walk previous siblings to find nearest rect (common pattern: rect then text)
        let prev = textEl.previousElementSibling;
        let containerRect = null;
        // Check up to 3 previous siblings for a rect
        for (let i = 0; i < 3 && prev; i++) {
          if (prev.tagName === 'rect') {
            // Heuristic: the rect should be reasonably close and larger than the text
            const rectBox = prev.getBBox();
            const textCenterX = textBox.x + textBox.width / 2;
            const textCenterY = textBox.y + textBox.height / 2;
            // Check if text center is within or near the rect (with generous margin)
            if (textCenterX >= rectBox.x - 20 && textCenterX <= rectBox.x + rectBox.width + 20 &&
                textCenterY >= rectBox.y - 20 && textCenterY <= rectBox.y + rectBox.height + 20) {
              containerRect = rectBox;
              break;
            }
          }
          prev = prev.previousElementSibling;
        }
        if (containerRect) {
          const tolerance = 4; // sub-pixel tolerance
          const overflowLeft = containerRect.x - textBox.x;
          const overflowRight = (textBox.x + textBox.width) - (containerRect.x + containerRect.width);
          const overflowTop = containerRect.y - textBox.y;
          const overflowBottom = (textBox.y + textBox.height) - (containerRect.y + containerRect.height);

          if (overflowLeft > tolerance || overflowRight > tolerance ||
              overflowTop > tolerance || overflowBottom > tolerance) {
            textOverflowFailed = true;
            const content = (textEl.textContent || '').trim().substring(0, 30);
            const maxOverflow = Math.max(overflowLeft, overflowRight, overflowTop, overflowBottom);
            slideFindings.push({
              check: 'svg-text-overflow',
              status: 'FAIL',
              detail: `Text "${content}" overflows container rect by ${Math.round(maxOverflow)}px`,
            });
          }
        }
      } catch (e) { /* getBBox may fail on hidden elements */ }
    });
    if (!textOverflowFailed && svgTexts.length > 0) {
      slideFindings.push({ check: 'svg-text-overflow', status: 'PASS' });
    }

    findings.push({ slide: slideNum, checks: slideFindings });
  });

  // --- Cross-slide layout variety ---
  // Structural proxy only — compares wrapper-level element structure.
  // Content slides typically share the same wrapper (title+viz+body), so this
  // check only catches extreme monotony (8+ identical). Visual variety is
  // verified by the QA subagent, not this script.
  const fingerprints = [];
  slides.forEach((slide) => {
    const children = slide.querySelectorAll('.slide-content > *, .slide-content-center > *');
    const fp = Array.from(children)
      .map((c) => c.tagName + (c.className ? '.' + c.className.split(' ')[0] : ''))
      .join('|');
    fingerprints.push(fp);
  });

  let maxConsecutive = 1;
  let currentRun = 1;
  for (let i = 1; i < fingerprints.length; i++) {
    if (fingerprints[i] === fingerprints[i - 1]) {
      currentRun++;
      maxConsecutive = Math.max(maxConsecutive, currentRun);
    } else {
      currentRun = 1;
    }
  }

  // --- Check D: getBBox auto-sizing script presence ---
  const scripts = document.querySelectorAll('script');
  let hasBBoxScript = false;
  scripts.forEach((s) => {
    if (s.textContent && s.textContent.includes('getBBox')) {
      hasBBoxScript = true;
    }
  });

  return {
    slides: findings,
    slideCount: slides.length,
    maxConsecutiveIdentical: maxConsecutive,
    hasBBoxScript: hasBBoxScript,
  };
}, { slideWidth: SLIDE_WIDTH, slideHeight: SLIDE_HEIGHT, minFooterGap: MIN_FOOTER_GAP });

await browser.close();

// --- Report ---
let hasFailures = false;
let hasWarnings = false;

if (results.slideCount === 0) {
  console.error('\n=== Carousel Validation: FAIL — no .infographic slides found ===\n');
  process.exit(1);
}

console.log(`\n=== Carousel Validation: ${results.slideCount} slides ===\n`);

for (const slide of results.slides) {
  const failures = slide.checks.filter((c) => c.status === 'FAIL');
  const warnings = slide.checks.filter((c) => c.status === 'WARN');
  if (failures.length > 0) {
    hasFailures = true;
    const label = warnings.length > 0 ? 'FAIL + WARN' : 'FAIL';
    console.log(`Slide ${slide.slide}: ${label}`);
    for (const f of failures) {
      console.log(`  ✗ ${f.check}: ${f.detail}`);
    }
    for (const w of warnings) {
      console.log(`  ⚠ ${w.check}: ${w.detail}`);
    }
  } else if (warnings.length > 0) {
    hasWarnings = true;
    console.log(`Slide ${slide.slide}: WARN`);
    for (const w of warnings) {
      console.log(`  ⚠ ${w.check}: ${w.detail}`);
    }
  } else {
    console.log(`Slide ${slide.slide}: PASS`);
  }
}

if (results.maxConsecutiveIdentical >= 8) {
  hasFailures = true;
  console.log(`\nCross-slide: FAIL — ${results.maxConsecutiveIdentical} consecutive identical structural layouts (max 7)`);
} else {
  console.log(`\nCross-slide: PASS (max ${results.maxConsecutiveIdentical} consecutive identical — visual variety checked by QA subagent)`);
}

// Check D: getBBox script presence
if (!results.hasBBoxScript) {
  hasFailures = true;
  console.log(`\ngetBBox script: FAIL — no <script> block references getBBox. The composing agent must include an auto-sizing script.`);
} else {
  console.log(`\ngetBBox script: PASS`);
}

const verdict = hasFailures ? 'FAIL' : (hasWarnings ? 'PASS (with warnings)' : 'PASS');
console.log(`\n=== Result: ${verdict} ===\n`);

process.exit(hasFailures ? 1 : 0);
