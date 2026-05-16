/**
 * validate-carousel-slides.mjs
 *
 * Programmatic bounds-checking for carousel slides inside a Playwright session.
 * Evaluates DOM bounding rects for every slide and checks:
 *   - Footer clipping (author-footer bottom within canvas)
 *   - Body→footer gap (slide-body bottom does not overlap author-footer top)
 *   - SVG clipping (SVG elements within viewBox and slide canvas)
 *   - Element overflow (no absolutely positioned element escapes 1080×1350)
 *   - Cross-slide layout variety (structural proxy — flags 8+ consecutive identical wrappers)
 *
 * Usage (inside a Playwright session):
 *   node scripts/validate-carousel-slides.mjs <html-path>
 *
 * Requires: Playwright module path as PLAYWRIGHT_PATH env var,
 *           Chromium binary path as CHROMIUM_PATH env var.
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

  return { slides: findings, slideCount: slides.length, maxConsecutiveIdentical: maxConsecutive };
}, { slideWidth: SLIDE_WIDTH, slideHeight: SLIDE_HEIGHT, minFooterGap: MIN_FOOTER_GAP });

await browser.close();

// --- Report ---
let hasFailures = false;

if (results.slideCount === 0) {
  console.error('\n=== Carousel Validation: FAIL — no .infographic slides found ===\n');
  process.exit(1);
}

console.log(`\n=== Carousel Validation: ${results.slideCount} slides ===\n`);

for (const slide of results.slides) {
  const failures = slide.checks.filter((c) => c.status === 'FAIL');
  if (failures.length > 0) {
    hasFailures = true;
    console.log(`Slide ${slide.slide}: FAIL`);
    for (const f of failures) {
      console.log(`  ✗ ${f.check}: ${f.detail}`);
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

console.log(`\n=== Result: ${hasFailures ? 'FAIL' : 'PASS'} ===\n`);

process.exit(hasFailures ? 1 : 0);
