/**
 * Post-render bounds validator for LinkedIn infographics.
 *
 * Runs inside a Playwright session AFTER the page loads but BEFORE the
 * screenshot is taken. Catches layout overflow that the pre-render HTML
 * contract validator cannot detect (declared padding vs actual rendering).
 *
 * Geometry checks:
 *   - Footer clipping (footer bottom within canvas)
 *   - Content block overflow (data-content-block elements within canvas)
 *   - Section gap (minimum spacing between consecutive children)
 *
 * SVG checks (when SVG elements are present):
 *   - Text-to-container overflow (text getBBox must fit inside nearest sibling rect)
 *   - Text opacity floor (neutral >= 0.65, accent [data-accent] >= 0.85)
 *   - Shape fill tier (reject 0.01-0.04, warn 0.05-0.19 without data-tier)
 *   - ViewBox containment (all elements within declared viewBox)
 *   - Font-size floor (all SVG text >= 22px)
 *
 * Usage (standalone):
 *   node validate-post-render.mjs <path-to-html>
 *
 * Usage (as module inside an existing Playwright session):
 *   import { validatePostRenderOnPage } from './validate-post-render.mjs';
 *   const result = await validatePostRenderOnPage(page);
 */

const CANVAS_HEIGHT = 1350;
const CANVAS_WIDTH = 1080;
const MIN_SECTION_GAP = 12;

/**
 * Runs post-render bounds and SVG checks on an already-loaded Playwright page.
 * Returns { status: 'pass'|'warn'|'fail', errors: string[], warnings: string[] }
 */
export async function validatePostRenderOnPage(page) {
  return await page.evaluate(({ canvasH, minGap }) => {
    const errors = [];
    const warnings = [];
    const canvas = document.querySelector('.infographic');
    if (!canvas) {
      errors.push('No .infographic element found.');
      return { status: 'fail', errors, warnings };
    }

    const canvasRect = canvas.getBoundingClientRect();

    // --- GEOMETRY CHECKS ---

    // 1. Footer visibility check
    const footer = canvas.querySelector('.m-footer, .author-footer, [class*="footer"]');
    if (footer) {
      const footerRect = footer.getBoundingClientRect();
      const footerBottom = footerRect.bottom - canvasRect.top;
      if (footerBottom > canvasH) {
        errors.push(
          `Footer is clipped: bottom edge at ${Math.round(footerBottom)}px exceeds canvas height ${canvasH}px (overflow by ${Math.round(footerBottom - canvasH)}px).`
        );
      }
      if (footerRect.height < 1) {
        errors.push('Footer has zero height — likely collapsed or invisible.');
      }
    } else {
      errors.push('No footer element found. Expected .m-footer, .author-footer, or an element with "footer" in its class.');
    }

    // 2. Content block overflow check
    const blocks = canvas.querySelectorAll('[data-content-block]');
    for (const block of blocks) {
      const blockRect = block.getBoundingClientRect();
      const blockBottom = blockRect.bottom - canvasRect.top;
      if (blockBottom > canvasH) {
        const label = block.getAttribute('data-content-block');
        errors.push(
          `Content block "${label}" is clipped: bottom at ${Math.round(blockBottom)}px exceeds canvas ${canvasH}px.`
        );
      }
    }

    // 3. Section gap check — verify minimum space between consecutive direct children
    const children = Array.from(canvas.children).filter(el => {
      const style = getComputedStyle(el);
      return style.position !== 'absolute' && style.display !== 'none' && el.offsetHeight > 0;
    });

    for (let i = 0; i < children.length - 1; i++) {
      const currentRect = children[i].getBoundingClientRect();
      const nextRect = children[i + 1].getBoundingClientRect();
      const gap = nextRect.top - currentRect.bottom;
      if (gap < minGap) {
        const currentId = children[i].className || children[i].tagName;
        const nextId = children[i + 1].className || children[i + 1].tagName;
        errors.push(
          `Insufficient gap (${Math.round(gap)}px, minimum ${minGap}px) between "${currentId}" and "${nextId}".`
        );
      }
    }

    // --- SVG CHECKS (skip gracefully when no SVGs present) ---

    const svgElements = canvas.querySelectorAll('svg');
    if (svgElements.length > 0) {

      // Helper: parse rgba opacity from a fill string
      function parseRgbaOpacity(fill) {
        if (!fill || fill === 'none') return null;
        const m = fill.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/);
        if (!m) return null;
        return { r: parseFloat(m[1]), g: parseFloat(m[2]), b: parseFloat(m[3]), a: m[4] !== undefined ? parseFloat(m[4]) : 1.0 };
      }

      const svgTexts = canvas.querySelectorAll('svg text');
      const svgShapes = canvas.querySelectorAll('svg rect, svg circle, svg polygon, svg ellipse');

      // 4. SVG font-size floor (22px minimum)
      svgTexts.forEach((textEl) => {
        const fs = parseFloat(textEl.getAttribute('font-size'));
        if (!isNaN(fs) && fs < 22) {
          const content = (textEl.textContent || '').trim().substring(0, 30);
          errors.push(`SVG text "${content}" has font-size ${fs}px (minimum 22px).`);
        }
      });

      // 5. SVG text opacity floor
      // Theme-agnostic: accent detection uses data-accent attribute, not color matching
      svgTexts.forEach((textEl) => {
        const fill = textEl.getAttribute('fill');
        const parsed = parseRgbaOpacity(fill);
        if (!parsed || parsed.a >= 0.99) return; // fully opaque is fine

        const isAccent = textEl.hasAttribute('data-accent');
        const content = (textEl.textContent || '').trim().substring(0, 30);

        if (isAccent) {
          if (parsed.a < 0.85) {
            errors.push(`Accent SVG text "${content}" opacity ${parsed.a} (minimum 0.85 for accent elements).`);
          }
        } else {
          if (parsed.a < 0.65) {
            errors.push(`SVG text "${content}" opacity ${parsed.a} (minimum 0.65 for neutral text).`);
          }
        }
      });

      // 6. SVG shape fill tier compliance
      svgShapes.forEach((shapeEl) => {
        const fill = shapeEl.getAttribute('fill');
        const parsed = parseRgbaOpacity(fill);
        if (!parsed || parsed.a >= 0.99 || parsed.a === 0) return;

        const tier = shapeEl.getAttribute('data-tier');
        const tag = shapeEl.tagName;

        // Hard reject: CSS card-class range (0.01-0.04) — invisible without backdrop-filter
        if (parsed.a >= 0.01 && parsed.a <= 0.04) {
          errors.push(`SVG <${tag}> fill opacity ${parsed.a} is in CSS card-class range (0.01–0.04) — SVG has no backdrop-filter.`);
        }
        // Warn: 0.05-0.19 without data-tier="container"
        else if (parsed.a >= 0.05 && parsed.a <= 0.19 && tier !== 'container') {
          warnings.push(`SVG <${tag}> fill opacity ${parsed.a} is in container range (0.05–0.19) but lacks data-tier="container" — verify this is intentional.`);
        }
      });

      // 7. SVG text-to-container overflow (getBBox check)
      svgTexts.forEach((textEl) => {
        try {
          const textBox = textEl.getBBox();
          // Walk previous siblings to find nearest rect
          let prev = textEl.previousElementSibling;
          let containerRect = null;
          for (let i = 0; i < 3 && prev; i++) {
            if (prev.tagName === 'rect') {
              const rectBox = prev.getBBox();
              const textCenterX = textBox.x + textBox.width / 2;
              const textCenterY = textBox.y + textBox.height / 2;
              if (textCenterX >= rectBox.x - 20 && textCenterX <= rectBox.x + rectBox.width + 20 &&
                  textCenterY >= rectBox.y - 20 && textCenterY <= rectBox.y + rectBox.height + 20) {
                containerRect = rectBox;
                break;
              }
            }
            prev = prev.previousElementSibling;
          }
          if (containerRect) {
            const tolerance = 4;
            const overflowRight = (textBox.x + textBox.width) - (containerRect.x + containerRect.width);
            const overflowBottom = (textBox.y + textBox.height) - (containerRect.y + containerRect.height);
            const maxOverflow = Math.max(overflowRight, overflowBottom);
            if (maxOverflow > tolerance) {
              const content = (textEl.textContent || '').trim().substring(0, 30);
              errors.push(`SVG text "${content}" overflows container rect by ${Math.round(maxOverflow)}px.`);
            }
          }
        } catch (e) { /* getBBox may fail on hidden elements */ }
      });

      // 8. SVG viewBox containment
      svgElements.forEach((svg) => {
        const vb = svg.getAttribute('viewBox');
        if (!vb) return;
        const parts = vb.split(/[\s,]+/).map(Number);
        if (parts.length < 4) return;
        const [vbX, vbY, vbW, vbH] = parts;

        const allChildren = svg.querySelectorAll('rect, circle, ellipse, text, line, polygon, path, polyline');
        allChildren.forEach((child) => {
          try {
            const box = child.getBBox();
            if (box.width === 0 && box.height === 0) return; // skip zero-size elements
            if (box.y + box.height > vbY + vbH + 4) { // 4px tolerance
              const tag = child.tagName;
              const content = child.textContent ? ` "${child.textContent.trim().substring(0, 20)}"` : '';
              errors.push(`SVG <${tag}>${content} extends to y=${Math.round(box.y + box.height)}px but viewBox height is ${vbH}px.`);
            }
            if (box.x + box.width > vbX + vbW + 4) {
              const tag = child.tagName;
              errors.push(`SVG <${tag}> extends to x=${Math.round(box.x + box.width)}px but viewBox width is ${vbW}px.`);
            }
          } catch (e) { /* getBBox may fail */ }
        });
      });
    }

    const status = errors.length > 0 ? 'fail' : warnings.length > 0 ? 'warn' : 'pass';
    return { status, errors, warnings };
  }, { canvasH: CANVAS_HEIGHT, minGap: MIN_SECTION_GAP });
}

/**
 * Standalone CLI: loads an HTML file, runs post-render validation, exits.
 */
async function main() {
  const filePath = process.argv.slice(2).find(arg => !arg.startsWith('--'));
  if (!filePath) {
    console.error('Usage: node validate-post-render.mjs <path-to-html>');
    process.exit(1);
  }

  // Resolve Playwright — prefer existing machine-level install
  let playwright;
  const tryPaths = [
    'playwright',
    '@playwright/cli/node_modules/playwright',
  ];
  for (const p of tryPaths) {
    try { playwright = await import(p); break; } catch {}
  }
  if (!playwright) {
    console.error('Playwright not found. Install with: npm i -g @playwright/cli');
    process.exit(1);
  }

  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });

  const url = new URL(filePath, `file://${process.cwd()}/`).href;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const result = await validatePostRenderOnPage(page);
  const output = JSON.stringify(result, null, 2);

  await browser.close();

  if (result.status === 'fail') {
    console.error(output);
    process.exit(1);
  }
  console.log(output);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(e); process.exit(1); });
}
