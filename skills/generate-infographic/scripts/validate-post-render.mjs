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
          // Walk previous siblings to find nearest enclosing rect.
          // Use depth 15 to handle SVGs with icons (circles, paths, lines)
          // between the container rect and the text labels.
          let prev = textEl.previousElementSibling;
          let containerRect = null;
          for (let i = 0; i < 15 && prev; i++) {
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

      // 9. getBBox auto-sizing script presence
      const scripts = document.querySelectorAll('script');
      let hasBBoxScript = false;
      scripts.forEach((s) => {
        if (s.textContent && s.textContent.includes('getBBox')) {
          hasBBoxScript = true;
        }
      });
      if (!hasBBoxScript) {
        errors.push('No getBBox auto-sizing script found. SVG text containers must be sized at runtime — never hardcode rect widths.');
      }
    }

    // --- CONTRAST CHECKS ---
    // Opacity is a proxy for legibility, not a measure of it: a fully opaque
    // colour can still be illegible on its backdrop. This computes the real
    // WCAG 2.x ratio against the resolved background.

    function parseColor(str) {
      if (!str) return null;
      const m = str.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*(?:[,/]\s*([\d.]+))?\s*\)/);
      if (!m) return null;
      return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
    }
    function over(fg, bg) { // composite fg over opaque bg
      const a = fg.a;
      return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
    }
    function relLum(c) {
      const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    }
    function contrast(a, b) {
      const la = relLum(a), lb = relLum(b);
      const hi = Math.max(la, lb), lo = Math.min(la, lb);
      return (hi + 0.05) / (lo + 0.05);
    }
    // Walk ancestors compositing background-colors until fully opaque.
    function resolveBackdrop(el) {
      let acc = null;
      let node = el;
      while (node && node !== document.documentElement) {
        const bg = parseColor(getComputedStyle(node).backgroundColor);
        if (bg && bg.a > 0) {
          acc = acc === null ? bg : over(acc, bg);
          if (acc.a >= 0.999) return acc;
        }
        node = node.parentElement;
      }
      if (acc && acc.a >= 0.999) return acc;
      const pageBg = parseColor(getComputedStyle(document.body).backgroundColor);
      const base = pageBg && pageBg.a >= 0.999 ? pageBg : { r: 255, g: 255, b: 255, a: 1 };
      return acc ? over(acc, base) : base;
    }

    // HTML text nodes
    const textEls = Array.from(canvas.querySelectorAll('*')).filter((el) => {
      if (!el.childNodes.length) return false;
      const own = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
      if (!own) return false;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
      if (s.webkitTextFillColor === 'rgba(0, 0, 0, 0)' || s.color === 'rgba(0, 0, 0, 0)') return false; // gradient-clipped text
      return el.getBoundingClientRect().width > 0;
    });

    for (const el of textEls) {
      const s = getComputedStyle(el);
      const fg = parseColor(s.color);
      if (!fg) continue;
      const elOpacity = parseFloat(s.opacity);
      const eff = { ...fg, a: fg.a * (isNaN(elOpacity) ? 1 : elOpacity) };
      // Start at the element itself: its own background is painted behind its
      // own text. Starting at the parent misreads every inverse surface, marker
      // highlight, and filled container as text on the page field.
      const bd = resolveBackdrop(el);
      const ratio = contrast(over(eff, bd), bd);
      const label = (el.textContent || '').trim().substring(0, 34);
      if (ratio < 3.0) {
        errors.push(`Text "${label}" contrast ${ratio.toFixed(2)}:1 against its backdrop (minimum 3.0:1).`);
      } else if (ratio < 4.5) {
        warnings.push(`Text "${label}" contrast ${ratio.toFixed(2)}:1 — below 4.5:1; acceptable only for large display type.`);
      }
    }

    // SVG text against its plate (nearest ancestor background)
    canvas.querySelectorAll('svg text').forEach((t) => {
      const fill = t.getAttribute('fill') || getComputedStyle(t).fill;
      let fg = parseColor(fill);
      if (!fg && /^#[0-9a-f]{3,8}$/i.test((fill || '').trim())) {
        const h = fill.trim().replace('#', '');
        const x = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.substring(0, 6);
        fg = { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16), a: 1 };
      }
      if (!fg) return;
      const bd = resolveBackdrop(t.parentElement);
      const ratio = contrast(over(fg, bd), bd);
      const label = (t.textContent || '').trim().substring(0, 34);
      if (ratio < 3.0) {
        errors.push(`SVG text "${label}" contrast ${ratio.toFixed(2)}:1 against its plate (minimum 3.0:1).`);
      } else if (ratio < 4.5) {
        warnings.push(`SVG text "${label}" contrast ${ratio.toFixed(2)}:1 — below 4.5:1.`);
      }
    });

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
