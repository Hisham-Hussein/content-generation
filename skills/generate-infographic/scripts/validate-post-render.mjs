/**
 * Post-render bounds validator for LinkedIn infographics.
 *
 * Runs inside a Playwright session AFTER the page loads but BEFORE the
 * screenshot is taken. Catches layout overflow that the pre-render HTML
 * contract validator cannot detect (declared padding vs actual rendering).
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
 * Runs post-render bounds checks on an already-loaded Playwright page.
 * Returns { status: 'pass'|'fail', errors: string[] }
 */
export async function validatePostRenderOnPage(page) {
  return await page.evaluate(({ canvasH, minGap }) => {
    const errors = [];
    const canvas = document.querySelector('.infographic');
    if (!canvas) {
      errors.push('No .infographic element found.');
      return { status: 'fail', errors };
    }

    const canvasRect = canvas.getBoundingClientRect();

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

    return {
      status: errors.length === 0 ? 'pass' : 'fail',
      errors,
    };
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
